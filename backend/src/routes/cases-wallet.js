// backend/src/routes/cases-wallet.js
import express from 'express';
import { verifyPayment, trackPayment } from '../middleware/x402pay.js';
import { invokeNovaMicro as invokeModel } from '../config/bedrock.js';
import { walletManager } from '../services/walletManager.js';
import { settlementService } from '../services/settlementService.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Cases directory
const casesDir = path.join(process.cwd(), 'cases');

// Create cases directory on startup
(async () => {
  try {
    await fs.mkdir(casesDir, { recursive: true });
    console.log('✅ Cases directory ready at:', casesDir);
  } catch (error) {
    console.error('❌ Failed to create cases directory:', error);
  }
})();

// Helper functions for case persistence
async function saveCaseData(caseId, data) {
  await fs.mkdir(casesDir, { recursive: true });
  const filePath = path.join(casesDir, `case_${caseId}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function loadCaseData(caseId) {
  try {
    const filePath = path.join(casesDir, `case_${caseId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function updateCaseData(caseId, updates) {
  const caseData = await loadCaseData(caseId);
  if (!caseData) {
    throw new Error(`Case ${caseId} not found`);
  }
  const updatedData = { ...caseData, ...updates };
  await saveCaseData(caseId, updatedData);
  return updatedData;
}

// Helper function to analyze evidence quality
function analyzeEvidenceQuality(evidence) {
  if (!evidence || typeof evidence !== 'string') {
    return { quality: 'invalid', score: 0 };
  }

  const evidenceLength = evidence.length;
  const wordCount = evidence.split(/\s+/).filter(word => word.length > 2).length;
  const hasCoherentWords = /\b\w{4,}\b/.test(evidence);
  const sentenceCount = evidence.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const hasNumbers = /\d/.test(evidence);
  const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(evidence);
  
  // Check for gibberish patterns
  const isGibberish = /^[a-z]{3,15}$/.test(evidence.toLowerCase()) || 
                      /^[A-Z]{3,15}$/.test(evidence) ||
                      /^(.)\1+$/.test(evidence); // Repeated characters
  
  let score = 0;
  
  // Scoring system
  if (evidenceLength >= 50) score += 20;
  else if (evidenceLength >= 20) score += 10;
  
  if (wordCount >= 10) score += 20;
  else if (wordCount >= 5) score += 10;
  
  if (hasCoherentWords) score += 20;
  if (sentenceCount >= 2) score += 20;
  if (hasNumbers) score += 10;
  if (hasSpecialChars && !isGibberish) score += 10;
  
  // Penalties
  if (isGibberish) score -= 50;
  if (evidenceLength < 20) score -= 20;
  if (wordCount < 5) score -= 20;
  
  // Determine quality
  let quality;
  if (score >= 70) quality = 'strong';
  else if (score >= 40) quality = 'adequate';
  else if (score >= 20) quality = 'weak';
  else quality = 'frivolous';
  
  return { quality, score };
}

// Initialize wallet manager on startup
walletManager.initialize().catch(console.error);

// ===== ROUTES IN CORRECT ORDER =====

/**
 * Test endpoint - Free
 */
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Cases-wallet route is working',
    casesDir: casesDir 
  });
});

/**
 * Search cases - Free endpoint
 * MUST BE BEFORE /:caseId ROUTES
 */
router.get('/search', async (req, res) => {
  try {
    const { plaintiff, defendant, claimType, status, fromDate, toDate, limit = 10 } = req.query;
    console.log('🔍 Search endpoint hit!');
    console.log('🔍 Query params:', req.query);
    
    // Ensure cases directory exists
    await fs.mkdir(casesDir, { recursive: true });
    
    // Get all case files
    const files = await fs.readdir(casesDir);
    const caseFiles = files.filter(f => f.startsWith('case_') && f.endsWith('.json'));
    console.log(`📁 Found ${caseFiles.length} case files`);
    
    const matchingCases = [];
    
    for (const file of caseFiles) {
      try {
        const caseId = file.replace('case_', '').replace('.json', '');
        const caseData = await loadCaseData(caseId);
        
        if (caseData) {
          let matches = true;
          
          // Case-insensitive address comparison
          if (plaintiff && caseData.plaintiff.toLowerCase() !== plaintiff.toLowerCase()) {
            matches = false;
          }
          
          if (defendant && caseData.defendant.toLowerCase() !== defendant.toLowerCase()) {
            matches = false;
          }
          
          if (claimType && caseData.claimType !== claimType) {
            matches = false;
          }
          
          if (status && caseData.status !== status) {
            matches = false;
          }
          
          if (fromDate) {
            const caseDate = new Date(caseData.filedAt);
            const searchFromDate = new Date(fromDate);
            if (caseDate < searchFromDate) matches = false;
          }
          
          if (toDate) {
            const caseDate = new Date(caseData.filedAt);
            const searchToDate = new Date(toDate);
            if (caseDate > searchToDate) matches = false;
          }
          
          if (matches) {
            matchingCases.push(caseData);
          }
        }
      } catch (e) {
        console.error(`Error processing ${file}:`, e);
      }
    }
    
    // Sort by filing date (newest first)
    matchingCases.sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt));
    
    // Apply limit
    const limitedCases = matchingCases.slice(0, parseInt(limit));
    
    console.log(`📊 Search results: ${limitedCases.length} of ${matchingCases.length} total matches`);
    
    res.json({
      success: true,
      count: matchingCases.length,
      cases: limitedCases,
      total: matchingCases.length
    });
    
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: "Failed to search cases", details: error.message });
  }
});

/**
 * Get case statistics - Free endpoint
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const files = await fs.readdir(casesDir);
    const caseFiles = files.filter(f => f.startsWith('case_') && f.endsWith('.json'));
    
    let stats = {
      total: 0,
      byStatus: {},
      byClaimType: {},
      totalDamagesAwarded: 0,
      guiltyVerdicts: 0,
      notGuiltyVerdicts: 0,
      dismissedFrivolous: 0,
      totalPenalties: 0,
      appealsGranted: 0,
      appealsDenied: 0
    };
    
    for (const file of caseFiles) {
      try {
        const caseId = file.replace('case_', '').replace('.json', '');
        const caseData = await loadCaseData(caseId);
        
        if (caseData) {
          stats.total++;
          
          // Count by status
          stats.byStatus[caseData.status] = (stats.byStatus[caseData.status] || 0) + 1;
          
          // Count by claim type
          stats.byClaimType[caseData.claimType] = (stats.byClaimType[caseData.claimType] || 0) + 1;
          
          // Count verdicts and damages
          if (caseData.judgment) {
            if (caseData.judgment.verdict === 'guilty') {
              stats.guiltyVerdicts++;
              stats.totalDamagesAwarded += parseFloat(caseData.judgment.awardedDamages || 0);
            } else if (caseData.judgment.verdict === 'not_guilty') {
              stats.notGuiltyVerdicts++;
            } else if (caseData.judgment.verdict === 'dismissed_frivolous') {
              stats.dismissedFrivolous++;
              stats.totalPenalties += parseFloat(caseData.judgment.penalty || 0);
            }
          }
          
          // Count appeal outcomes
          if (caseData.appealDecision) {
            if (caseData.appealDecision.decision === 'upheld') {
              stats.appealsDenied++;
            } else {
              stats.appealsGranted++;
            }
          }
        }
      } catch (e) {
        console.error(`Error processing ${file}:`, e);
      }
    }
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: "Failed to generate statistics" });
  }
});

/**
 * Process pending appeals - Free endpoint for checking appeal status
 */
router.get('/appeals/pending', async (req, res) => {
  try {
    const files = await fs.readdir(casesDir);
    const caseFiles = files.filter(f => f.startsWith('case_') && f.endsWith('.json'));
    
    const pendingAppeals = [];
    
    for (const file of caseFiles) {
      try {
        const caseId = file.replace('case_', '').replace('.json', '');
        const caseData = await loadCaseData(caseId);
        
        if (caseData && caseData.status === 'under_appeal' && caseData.appeal) {
          const reviewDate = new Date(caseData.appeal.reviewDate);
          const now = new Date();
          const hoursRemaining = Math.max(0, Math.ceil((reviewDate - now) / (1000 * 60 * 60)));
          
          pendingAppeals.push({
            caseId: caseData.id,
            appealId: caseData.appeal.id,
            filedAt: caseData.appeal.filedAt,
            reviewDate: caseData.appeal.reviewDate,
            hoursRemaining,
            readyForReview: now >= reviewDate
          });
        }
      } catch (e) {
        console.error(`Error processing ${file}:`, e);
      }
    }
    
    res.json({
      success: true,
      pendingAppeals,
      total: pendingAppeals.length
    });
    
  } catch (error) {
    console.error('Pending appeals error:', error);
    res.status(500).json({ error: "Failed to fetch pending appeals" });
  }
});

/**
 * List all cases - Free endpoint (paginated)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, plaintiff, defendant } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('📋 List cases request:', { page, limit, status, plaintiff, defendant });
    
    // Get all case files
    const files = await fs.readdir(casesDir);
    const caseFiles = files.filter(f => f.startsWith('case_') && f.endsWith('.json'));
    
    // Load cases
    const cases = [];
    for (const file of caseFiles) {
      try {
        const caseId = file.replace('case_', '').replace('.json', '');
        const caseData = await loadCaseData(caseId);
        if (caseData) {
          let include = true;
          
          if (status && caseData.status !== status) include = false;
          if (plaintiff && caseData.plaintiff.toLowerCase() !== plaintiff.toLowerCase()) include = false;
          if (defendant && caseData.defendant.toLowerCase() !== defendant.toLowerCase()) include = false;
          
          if (include) {
            cases.push(caseData);
          }
        }
      } catch (e) {
        console.error(`Error loading ${file}:`, e);
      }
    }
    
    // Sort by filing date (newest first)
    cases.sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt));
    
    // Paginate
    const paginatedCases = cases.slice(offset, offset + limit);
    
    res.json({
      success: true,
      cases: paginatedCases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: cases.length,
        totalPages: Math.ceil(cases.length / limit)
      }
    });
    
  } catch (error) {
    console.error('List cases error:', error);
    res.status(500).json({ error: "Failed to list cases" });
  }
});

// backend/src/routes/cases-wallet.js - Fix the file endpoint around line 400-410

/**
 * File a new case with wallet creation
 */
router.post('/file', verifyPayment(10.00), trackPayment, async (req, res) => {
  try {
    const { defendant, claimType, evidence, requestedDamages } = req.body;
    
    // Validate input
    if (!defendant || !claimType || !evidence || !requestedDamages) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["defendant", "claimType", "evidence", "requestedDamages"]
      });
    }
    
    // Create case ID
    const caseId = Date.now().toString();
    
    // Create case wallet for potential settlement
    console.log(`Creating wallet for case ${caseId}...`);
    
    // FIX: This line was missing - we need to check if wallet exists first
    let caseWalletAddress;
    try {
      // Check if wallet already exists
      const existingWallet = walletManager.wallets.get(`case_${caseId}`);
      if (existingWallet) {
        caseWalletAddress = await existingWallet.getDefaultAddress();
      } else {
        // Create new wallet
        const caseWallet = await walletManager.createCaseWallet(caseId);
        caseWalletAddress = await caseWallet.getDefaultAddress();
      }
    } catch (walletError) {
      console.error('Wallet creation error:', walletError);
      // Continue without wallet for now
      caseWalletAddress = { getId: () => 'pending-wallet-creation' };
    }
    
    // Store case data
    const caseData = {
      id: caseId,
      plaintiff: req.paymentData.from,
      defendant,
      claimType,
      evidence,
      requestedDamages,
      status: 'filed',
      filedAt: new Date().toISOString(),
      caseWalletAddress: caseWalletAddress.getId(),
      paymentData: req.paymentData,
      judgment: null,
      settlement: null
    };
    
    // Save to disk
    await saveCaseData(caseId, caseData);
    console.log('📁 Case filed and saved:', caseId);
    
    res.json({
      success: true,
      caseId,
      message: "Case filed successfully",
      caseWalletAddress: caseWalletAddress.getId(),
      nextSteps: "AI judge will review within 24 hours",
      paymentReceived: req.paymentData.amount
    });
    
  } catch (error) {
    console.error('Case filing error:', error);
    res.status(500).json({ error: "Failed to file case", details: error.message });
  }
});

// ===== PARAMETERIZED ROUTES MUST COME AFTER STATIC ROUTES =====

/**
 * Get case details - Free endpoint
 */
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await loadCaseData(caseId);
    
    if (!caseData) {
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    
    res.json({
      success: true,
      case: caseData
    });
    
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: "Failed to fetch case" });
  }
});

/**
 * AI Judge + Settlement Initiation - Enhanced with evidence quality check
 */
router.post('/:caseId/judge', verifyPayment(5.00), trackPayment, async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log(`🔨 Processing judgment for case: ${caseId}`);
    
    // Load case data from disk
    const caseData = await loadCaseData(caseId);
    
    if (!caseData) {
      console.log(`❌ Case not found: ${caseId}`);
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    
    console.log('📋 Found case data:', caseData);
    
    // Check if already judged
    if (caseData.status === 'judged' && caseData.judgment) {
      return res.status(400).json({ 
        error: "Case already judged",
        judgment: caseData.judgment 
      });
    }
    
    // Analyze evidence quality
    const evidenceAnalysis = analyzeEvidenceQuality(caseData.evidence);
    console.log('📊 Evidence analysis:', evidenceAnalysis);
    
    let judgment;
    
    // If evidence is clearly frivolous, dismiss immediately
    if (evidenceAnalysis.quality === 'frivolous') {
      judgment = {
        verdict: "dismissed_frivolous",
        awardedDamages: 0,
        reasoning: "Case dismissed as frivolous. The evidence provided is insufficient, incoherent, or appears to be random text. This wastes judicial resources.",
        evidenceQuality: "frivolous",
        penalty: 0.1, // 0.1 ETH penalty
        evidenceScore: evidenceAnalysis.score
      };
    } else {
      // Enhanced AI judgment prompt
      const prompt = `As an AI Judge, carefully analyze this legal case:

CASE DETAILS:
- Case Type: ${caseData.claimType}
- Evidence Provided: "${caseData.evidence}"
- Requested Damages: ${caseData.requestedDamages} ETH
- Evidence Quality Score: ${evidenceAnalysis.score}/100

EVALUATION CRITERIA:
1. Is the evidence specific and relevant to the claim type?
2. Are there verifiable facts, dates, or transaction details?
3. Does the evidence demonstrate actual harm or breach?
4. Is the requested damage amount justified by the evidence?
5. Are there any signs this is a bad faith claim?

CLAIM TYPE REQUIREMENTS:
- API_FRAUD: Must show unauthorized API usage, stolen keys, or fraudulent charges
- DATA_THEFT: Must demonstrate data was stolen with proof of ownership and theft
- SERVICE_MANIPULATION: Must show service was manipulated causing damages
- TOKEN_FRAUD: Must prove token theft or fraudulent token transactions

Provide judgment as JSON:
{
  "verdict": "guilty" / "not_guilty" / "dismissed_frivolous",
  "awardedDamages": number (0 to requested amount based on evidence strength),
  "reasoning": "detailed legal reasoning citing specific evidence",
  "evidenceQuality": "strong" / "adequate" / "weak",
  "evidenceScore": ${evidenceAnalysis.score},
  "specificFindings": ["finding1", "finding2"],
  "penalty": 0 (or 0.1 if bad faith claim)
}`;

      console.log('🤖 Invoking AI model with enhanced judgment logic...');
      
      let aiResponse;
      try {
        aiResponse = await invokeModel(prompt, 400);
        console.log('🤖 AI response:', aiResponse);
        judgment = JSON.parse(aiResponse);
      } catch (aiError) {
        console.error('❌ AI model error:', aiError);
        
        // Intelligent fallback based on evidence quality
        if (evidenceAnalysis.quality === 'strong') {
          judgment = {
            verdict: "guilty",
            awardedDamages: parseFloat(caseData.requestedDamages) * 0.7,
            reasoning: "Based on the evidence provided, the claim appears valid. Awarding 70% of requested damages.",
            evidenceQuality: evidenceAnalysis.quality,
            evidenceScore: evidenceAnalysis.score,
            specificFindings: ["Evidence shows clear harm", "Damages are partially justified"],
            penalty: 0
          };
        } else if (evidenceAnalysis.quality === 'adequate') {
          judgment = {
            verdict: "guilty",
            awardedDamages: parseFloat(caseData.requestedDamages) * 0.4,
            reasoning: "Evidence suggests some validity to the claim. Awarding reduced damages due to limited proof.",
            evidenceQuality: evidenceAnalysis.quality,
            evidenceScore: evidenceAnalysis.score,
            specificFindings: ["Some evidence of wrongdoing", "Damages partially substantiated"],
            penalty: 0
          };
        } else {
          judgment = {
            verdict: "not_guilty",
            awardedDamages: 0,
            reasoning: "Insufficient evidence to support the claim. The plaintiff has not met the burden of proof.",
            evidenceQuality: evidenceAnalysis.quality,
            evidenceScore: evidenceAnalysis.score,
            specificFindings: ["Lack of specific evidence", "Claims are unsubstantiated"],
            penalty: 0
          };
        }
      }
    }
    
    // Ensure verdict is properly formatted
    judgment.verdict = judgment.verdict.toLowerCase().replace(' ', '_');
    
    // Ensure numeric values
    if (judgment.awardedDamages) {
      judgment.awardedDamages = parseFloat(judgment.awardedDamages);
    }
    if (judgment.penalty) {
      judgment.penalty = parseFloat(judgment.penalty);
    }
    
    // Update case status
    const updatedCaseData = await updateCaseData(caseId, {
      status: judgment.verdict === 'dismissed_frivolous' ? 'dismissed' : 'judged',
      judgment: judgment,
      judgedAt: new Date().toISOString()
    });
    
    console.log('✅ Case judged and saved');
    
    // If guilty, initiate settlement
    let settlementInfo = null;
    if (judgment.verdict === "guilty" && judgment.awardedDamages > 0) {
      try {
        console.log(`🏛️ Attempting to create settlement for case ${caseId} with damages ${judgment.awardedDamages}`);
        console.log(`📋 Case data for settlement:`, {
          id: updatedCaseData.id,
          caseWalletAddress: updatedCaseData.caseWalletAddress,
          defendant: updatedCaseData.defendant,
          plaintiff: updatedCaseData.plaintiff
        });
        
        settlementInfo = await settlementService.initiateCaseSettlement(
          updatedCaseData,
          judgment
        );
        console.log('💰 Settlement initiated successfully:', settlementInfo);
      } catch (settlementError) {
        console.error('❌ Settlement initiation failed:', settlementError);
        console.error('❌ Settlement error details:', settlementError.message);
        console.error('❌ Settlement error stack:', settlementError.stack);
      }
    } else {
      console.log(`ℹ️ No settlement needed for case ${caseId} - verdict: ${judgment.verdict}, damages: ${judgment.awardedDamages}`);
    }
    
    // Handle penalty for frivolous cases
    let penaltyInfo = null;
    if (judgment.verdict === "dismissed_frivolous" && judgment.penalty > 0) {
      penaltyInfo = {
        amount: judgment.penalty,
        reason: "Frivolous lawsuit penalty",
        payableBy: caseData.plaintiff,
        payableTo: "Court Treasury",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };
    }
    
    res.json({
      success: true,
      caseId,
      judgment,
      settlement: settlementInfo,
      penalty: penaltyInfo,
      message: judgment.verdict === "guilty" 
        ? `Defendant found guilty. Must pay ${judgment.awardedDamages} ETH to settlement wallet.`
        : judgment.verdict === "dismissed_frivolous"
        ? `Case dismissed as frivolous. Plaintiff must pay ${judgment.penalty} ETH penalty.`
        : "Case dismissed - defendant not guilty",
      paymentReceived: req.paymentData.amount
    });
    
  } catch (error) {
    console.error('❌ Judgment error:', error);
    res.status(500).json({ error: "Failed to process judgment", details: error.message });
  }
});

/**
 * Check settlement status
 */
router.get('/:caseId/settlement', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // First check if case exists
    const caseData = await loadCaseData(caseId);
    if (!caseData) {
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    
    // Get settlement status
    const status = await settlementService.getSettlementStatus(caseId);
    
    if (!status) {
      return res.status(404).json({ 
        error: "No settlement found for this case",
        caseStatus: caseData.status 
      });
    }
    
    res.json({
      success: true,
      caseId,
      settlement: status,
      caseWalletAddress: caseData.caseWalletAddress
    });
    
  } catch (error) {
    console.error('Settlement status error:', error);
    res.status(500).json({ error: "Failed to check settlement" });
  }
});

/**
 * Execute settlement distribution
 */
router.post('/:caseId/settle', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Check if case exists and is judged
    const caseData = await loadCaseData(caseId);
    if (!caseData) {
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    
    if (caseData.status !== 'judged' || !caseData.judgment) {
      return res.status(400).json({ 
        error: "Case must be judged before settlement",
        currentStatus: caseData.status 
      });
    }
    
    if (caseData.judgment.verdict !== 'guilty') {
      return res.status(400).json({ 
        error: "No settlement required - defendant not guilty" 
      });
    }
    
    // Check if settlement is funded
    const depositStatus = await settlementService.checkSettlementDeposit(caseId);
    
    if (!depositStatus.funded) {
      return res.status(400).json({
        error: "Settlement not fully funded",
        required: depositStatus.required,
        current: depositStatus.balance,
        remaining: depositStatus.remaining,
        caseWalletAddress: caseData.caseWalletAddress
      });
    }
    
    // Execute settlement
    const result = await settlementService.executeSettlement(caseId);
    
    // Update case status
    await updateCaseData(caseId, {
      status: 'settled',
      settledAt: new Date().toISOString(),
      settlementResult: result
    });
    
    res.json({
      success: true,
      message: "Settlement distributed successfully",
      result,
      caseId
    });
    
  } catch (error) {
    console.error('Settlement execution error:', error);
    res.status(500).json({ error: "Failed to execute settlement" });
  }
});

/**
 * Get wallet info for a case
 */
router.get('/:caseId/wallet', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Check if case exists
    const caseData = await loadCaseData(caseId);
    if (!caseData) {
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    
    // Get wallet info
    const caseWallet = walletManager.wallets.get(`case_${caseId}`);
    if (!caseWallet) {
      return res.status(404).json({ 
        error: "Case wallet not found",
        expectedAddress: caseData.caseWalletAddress 
      });
    }
    
    const address = await caseWallet.getDefaultAddress();
    
    // Try to get balance
    let balances = {};
    try {
      balances = await walletManager.getWalletBalance(`case_${caseId}`);
    } catch (balanceError) {
      console.log('Could not fetch balance:', balanceError.message);
      balances = { ETH: '0', error: 'Could not fetch balance' };
    }
    
    res.json({
      success: true,
      caseId,
      walletAddress: address.getId(),
      network: 'base-sepolia',
      balances,
      judgment: caseData.judgment,
      status: caseData.status
    });
    
  } catch (error) {
    console.error('Wallet info error:', error);
    res.status(500).json({ error: "Failed to get wallet info" });
  }
});

/**
 * Appeal a case - Enhanced with timeline and validation
 */
router.post('/:caseId/appeal', verifyPayment(25.00), trackPayment, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { reason } = req.body;
    
    // Validate appeal reason
    if (!reason || reason.length < 50) {
      return res.status(400).json({ 
        error: "Appeal reason must be at least 50 characters and provide substantive grounds for appeal" 
      });
    }
    
    // Load case data
    const caseData = await loadCaseData(caseId);
    if (!caseData) {
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    
    // Check if case can be appealed
    if (!['judged', 'dismissed'].includes(caseData.status)) {
      return res.status(400).json({ 
        error: "Only judged or dismissed cases can be appealed",
        currentStatus: caseData.status 
      });
    }
    
    if (caseData.appealed) {
      return res.status(400).json({ error: "Case has already been appealed" });
    }
    
    // Check if within appeal window (30 days)
    const judgmentDate = new Date(caseData.judgedAt);
    const daysSinceJudgment = (Date.now() - judgmentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceJudgment > 30) {
      return res.status(400).json({ 
        error: "Appeal window has expired. Appeals must be filed within 30 days of judgment.",
        daysSinceJudgment: Math.floor(daysSinceJudgment)
      });
    }
    
    // Calculate appeal review date (48 hours from now)
    const appealReviewDate = new Date();
    appealReviewDate.setHours(appealReviewDate.getHours() + 48);
    
    // Create appeal record
    const appeal = {
      id: Date.now().toString(),
      caseId,
      appellant: req.paymentData.from,
      reason,
      filedAt: new Date().toISOString(),
      reviewDate: appealReviewDate.toISOString(),
      status: 'pending',
      paymentData: req.paymentData
    };
    
    // Update case with appeal info
    await updateCaseData(caseId, {
      appealed: true,
      appeal: appeal,
      status: 'under_appeal',
      previousStatus: caseData.status,
      previousJudgment: caseData.judgment
    });
    
    res.json({
      success: true,
      message: "Appeal filed successfully",
      appealId: appeal.id,
      reviewDate: appealReviewDate.toISOString(),
      hoursUntilReview: 48,
      nextSteps: "Your appeal will be reviewed by a higher AI court in 48 hours",
      paymentReceived: req.paymentData.amount
    });
    
  } catch (error) {
    console.error('Appeal error:', error);
    res.status(500).json({ error: "Failed to file appeal" });
  }
});

/**
 * Process a pending appeal
 */
router.post('/:caseId/process-appeal', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await loadCaseData(caseId);
    
    if (!caseData || !caseData.appeal) {
      return res.status(404).json({ error: "No appeal found for this case" });
    }
    
    if (caseData.status !== 'under_appeal') {
      return res.status(400).json({ 
        error: "Case is not under appeal",
        currentStatus: caseData.status 
      });
    }
    
    const appeal = caseData.appeal;
    const now = new Date();
    const reviewDate = new Date(appeal.reviewDate);
    
    // Check if appeal is ready for review
    if (now < reviewDate) {
      const hoursLeft = Math.ceil((reviewDate - now) / (1000 * 60 * 60));
      return res.status(400).json({ 
        error: "Appeal not ready for review",
        hoursRemaining: hoursLeft,
        reviewDate: appeal.reviewDate
      });
    }
    
    // Enhanced appeal review prompt
    const prompt = `As a Higher AI Court of Appeals, review this case appeal:

ORIGINAL CASE:
- Type: ${caseData.claimType}
- Original Evidence: "${caseData.evidence}"
- Original Verdict: ${caseData.previousJudgment.verdict}
- Original Damages: ${caseData.previousJudgment.awardedDamages} ETH
- Original Reasoning: ${caseData.previousJudgment.reasoning}
- Evidence Quality: ${caseData.previousJudgment.evidenceQuality}

APPEAL:
- Appellant: ${appeal.appellant === caseData.plaintiff ? 'Plaintiff' : 'Defendant'}
- Appeal Reason: "${appeal.reason}"
- Filed: ${appeal.filedAt}

REVIEW CRITERIA:
1. Were there errors in law or procedure in the original judgment?
2. Is there new evidence or perspective that wasn't considered?
3. Was the evidence evaluation fair and thorough?
4. Were damages calculated appropriately?
5. Does the appeal raise valid legal grounds?

APPEAL STANDARDS:
- Clear error in judgment: Overturn or modify
- Procedural issues: May warrant new judgment
- Disagreement with outcome alone: Insufficient for appeal
- New substantive evidence: May justify reconsideration

Provide appeal decision as JSON:
{
  "decision": "upheld" / "overturned" / "modified",
  "newVerdict": "guilty" / "not_guilty" (if changed),
  "newAwardedDamages": number (if modified),
  "reasoning": "detailed explanation of appeal decision",
  "keyFindings": ["finding1", "finding2"],
  "costsAwarded": "appellant" / "respondent" / "none"
}`;

    console.log('⚖️ Processing appeal with higher court AI...');
    
    let appealDecision;
    try {
      const aiResponse = await invokeModel(prompt, 400);
      appealDecision = JSON.parse(aiResponse);
    } catch (error) {
      console.error('Appeal AI error, using conservative fallback');
      
      // Conservative fallback - analyze appeal reason length and quality
      const appealReasonWords = appeal.reason.split(/\s+/).length;
      const hasSpecificClaims = /error|mistake|overlooked|failed to consider|new evidence/i.test(appeal.reason);
      
      if (appealReasonWords > 50 && hasSpecificClaims) {
        appealDecision = {
          decision: "modified",
          newVerdict: caseData.previousJudgment.verdict,
          newAwardedDamages: caseData.previousJudgment.awardedDamages * 0.8,
          reasoning: "The appeal raises some valid concerns. Damages are reduced by 20% in light of the arguments presented.",
          keyFindings: ["Some merit found in appeal arguments", "Original judgment largely upheld with modification"],
          costsAwarded: "none"
        };
      } else {
        appealDecision = {
          decision: "upheld",
          reasoning: "The appeal does not present sufficient grounds to overturn the original judgment. The original verdict stands.",
          keyFindings: ["No substantial errors in original judgment", "Appeal arguments lack merit"],
          costsAwarded: "respondent"
        };
      }
    }
    
    // Update case based on appeal decision
    const updates = {
      status: appealDecision.decision === 'upheld' ? 'appeal_denied' : 'appeal_granted',
      appealDecision: appealDecision,
      appealProcessedAt: new Date().toISOString()
    };
    
    // If verdict is changed or modified
    if (appealDecision.decision !== 'upheld') {
      updates.judgment = {
        ...caseData.previousJudgment,
        verdict: appealDecision.newVerdict || caseData.previousJudgment.verdict,
        awardedDamages: appealDecision.newAwardedDamages !== undefined 
          ? appealDecision.newAwardedDamages 
          : caseData.previousJudgment.awardedDamages,
        appealModified: true,
        appealDecisionDate: new Date().toISOString()
      };
      
      // Update status based on new verdict
      if (appealDecision.newVerdict === 'not_guilty') {
        updates.status = 'appeal_granted_dismissed';
      } else if (appealDecision.newAwardedDamages > 0) {
        updates.status = 'appeal_granted_modified';
      }
    }
    
    await updateCaseData(caseId, updates);
    
    res.json({
      success: true,
      appealDecision,
      message: appealDecision.decision === 'upheld' 
        ? "Appeal denied - original judgment stands"
        : appealDecision.decision === 'overturned'
        ? "Appeal granted - judgment overturned"
        : "Appeal granted - judgment modified",
      newStatus: updates.status
    });
    
  } catch (error) {
    console.error('Appeal processing error:', error);
    res.status(500).json({ error: "Failed to process appeal" });
  }
});

/**
 * Check appeal status
 */
router.get('/:caseId/appeal-status', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await loadCaseData(caseId);
    
    if (!caseData) {
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    
    if (!caseData.appeal) {
      return res.status(404).json({ error: "No appeal filed for this case" });
    }
    
    const now = new Date();
    const reviewDate = new Date(caseData.appeal.reviewDate);
    const hoursRemaining = Math.max(0, Math.ceil((reviewDate - now) / (1000 * 60 * 60)));
    
    res.json({
      success: true,
      appeal: {
        ...caseData.appeal,
        hoursRemaining,
        readyForReview: now >= reviewDate
      },
      appealDecision: caseData.appealDecision || null,
      currentStatus: caseData.status
    });
    
  } catch (error) {
    console.error('Appeal status error:', error);
    res.status(500).json({ error: "Failed to check appeal status" });
  }
});

export default router;