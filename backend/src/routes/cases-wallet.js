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
const casesDir = path.join(__dirname, '../../../cases');

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
      notGuiltyVerdicts: 0
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
            } else {
              stats.notGuiltyVerdicts++;
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

/**
 * File a new case with wallet creation
 */
router.post('/file', verifyPayment, trackPayment, async (req, res) => {
  // Keep your existing implementation
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
    const caseWallet = await walletManager.createCaseWallet(caseId);
    const caseWalletAddress = await caseWallet.getDefaultAddress();
    
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
  // Keep your existing implementation
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
 * AI Judge + Settlement Initiation
 */
router.post('/:caseId/judge', verifyPayment, trackPayment, async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log(`🔨 Processing judgment for case: ${caseId}`);
    
    // Load case data from disk
    const caseData = await loadCaseData(caseId);
    
    if (!caseData) {
      console.log(`❌ Case not found: ${caseId}`);
      // List available cases for debugging
      try {
        const files = await fs.readdir(casesDir);
        console.log('Available case files:', files);
      } catch (e) {
        console.log('Could not list cases directory');
      }
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
    
    // Get AI judgment
    const prompt = `As an AI Judge, analyze this case:
Case Type: ${caseData.claimType}
Evidence: ${JSON.stringify(caseData.evidence)}
Requested Damages: ${caseData.requestedDamages} ETH

Provide verdict as JSON: {"verdict":"guilty/not_guilty","awardedDamages":number,"reasoning":"explanation"}`;

    console.log('🤖 Invoking AI model...');
    
    let aiResponse;
    try {
      aiResponse = await invokeModel(prompt, 200);
      console.log('🤖 AI response:', aiResponse);
    } catch (aiError) {
      console.error('❌ AI model error:', aiError);
      // Use fallback judgment
      aiResponse = JSON.stringify({
        verdict: "guilty",
        awardedDamages: parseFloat(caseData.requestedDamages) * 0.5,
        reasoning: "Based on the evidence provided, partial damages are awarded."
      });
    }
    
    let judgment;
    try {
      judgment = JSON.parse(aiResponse);
      // Ensure awardedDamages is a number
      if (judgment.awardedDamages) {
        judgment.awardedDamages = parseFloat(judgment.awardedDamages);
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse AI response, using fallback');
      judgment = {
        verdict: "guilty",
        awardedDamages: parseFloat(caseData.requestedDamages) * 0.5,
        reasoning: "Based on the evidence provided, partial damages are awarded."
      };
    }
    
    // Ensure verdict is properly formatted
    judgment.verdict = judgment.verdict.toLowerCase().replace(' ', '_');
    
    // Update case status
    const updatedCaseData = await updateCaseData(caseId, {
      status: 'judged',
      judgment: judgment,
      judgedAt: new Date().toISOString()
    });
    
    console.log('✅ Case judged and saved');
    
    // If guilty, initiate settlement
    let settlementInfo = null;
    if (judgment.verdict === "guilty" && judgment.awardedDamages > 0) {
      try {
        settlementInfo = await settlementService.initiateCaseSettlement(
          updatedCaseData,
          judgment
        );
        console.log('💰 Settlement initiated:', settlementInfo);
      } catch (settlementError) {
        console.log('⚠️ Settlement initiation failed:', settlementError.message);
        // Continue without settlement info
      }
    }
    
    res.json({
      success: true,
      caseId,
      judgment,
      settlement: settlementInfo,
      message: judgment.verdict === "guilty" 
        ? "Defendant must deposit funds to settlement wallet" 
        : "Case dismissed - no damages awarded",
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
 * Appeal a case - Requires $25 payment
 */
router.post('/:caseId/appeal', verifyPayment, trackPayment, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: "Appeal reason is required" });
    }
    
    // Load case data
    const caseData = await loadCaseData(caseId);
    if (!caseData) {
      return res.status(404).json({ error: `Case ${caseId} not found` });
    }
    
    // Check if case can be appealed
    if (caseData.status !== 'judged') {
      return res.status(400).json({ 
        error: "Only judged cases can be appealed",
        currentStatus: caseData.status 
      });
    }
    
    if (caseData.appealed) {
      return res.status(400).json({ error: "Case has already been appealed" });
    }
    
    // Create appeal record
    const appeal = {
      id: Date.now().toString(),
      caseId,
      appellant: req.paymentData.from,
      reason,
      filedAt: new Date().toISOString(),
      status: 'pending',
      paymentData: req.paymentData
    };
    
    // Update case with appeal info
    await updateCaseData(caseId, {
      appealed: true,
      appeal: appeal,
      status: 'under_appeal'
    });
    
    res.json({
      success: true,
      message: "Appeal filed successfully",
      appealId: appeal.id,
      nextSteps: "Your appeal will be reviewed by a higher AI court within 48 hours",
      paymentReceived: req.paymentData.amount
    });
    
  } catch (error) {
    console.error('Appeal error:', error);
    res.status(500).json({ error: "Failed to file appeal" });
  }
});

export default router;