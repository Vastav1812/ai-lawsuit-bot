import express from 'express';
import { verifyPayment, trackPayment } from '../middleware/x402pay.js';
import { invokeNovaMicro as invokeModel } from '../config/bedrock.js';
import { ethers } from 'ethers';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load contract ABI and deployment info
const deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
const contractABI = JSON.parse(fs.readFileSync('./artifacts/contracts/AICourtSettlement.sol/AICourtSettlement.json', 'utf8')).abi;

// Initialize contract interface
const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);
const contract = new ethers.Contract(deploymentInfo.courtContract, contractABI, provider);

// Initialize case storage
const casesDir = path.join(process.cwd(), 'cases');
fs.mkdirSync(casesDir, { recursive: true });

// Helper to get case file path
function getCaseFilePath(caseId) {
  return path.join(casesDir, `${caseId}.json`);
}

// Helper to save case data
async function saveCaseData(caseId, data) {
  const filePath = getCaseFilePath(caseId);
  await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Helper to load case data
async function loadCaseData(caseId) {
  const filePath = getCaseFilePath(caseId);
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Case ${caseId} not found`);
    }
    throw error;
  }
}

/**
 * File a new case - Requires $10 payment
 */
router.post('/file', verifyPayment(10.00), trackPayment, async (req, res) => {
  try {
    const { defendant, claimType, evidence, requestedDamages } = req.body;
    
    // Validate input
    if (!defendant || !claimType || !evidence || !requestedDamages) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Store evidence on IPFS (mock for now)
    const evidenceHash = `Qm${Buffer.from(JSON.stringify(evidence)).toString('hex').substring(0, 44)}`;
    
    // Create case in database
    const caseId = Date.now(); // Temporary ID before blockchain confirmation
    
    const caseData = {
      id: caseId,
      plaintiff: req.paymentData.from,
      defendant,
      claimType,
      evidence,
      evidenceHash,
      requestedDamages,
      status: 'pending_judgment',
      filedAt: new Date().toISOString(),
      paymentData: req.paymentData
    };
    
    // Save case data
    await saveCaseData(caseId, caseData);
    console.log('📁 Case filed:', caseData);
    
    // TODO: Submit to blockchain via CDP Wallet
    
    res.json({
      success: true,
      caseId,
      message: "Case filed successfully",
      evidenceHash,
      nextSteps: "Your case will be reviewed by our AI judge within 24 hours",
      paymentReceived: req.paymentData.amount
    });
    
  } catch (error) {
    console.error('Case filing error:', error);
    res.status(500).json({ error: "Failed to file case" });
  }
});

/**
 * Get AI judgment for a case - Requires $5 payment
 */
router.post('/:caseId/judge', verifyPayment(5.00), trackPayment, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Load case data
    const caseData = await loadCaseData(caseId);
    
    // Prepare prompt for AI judge
    const prompt = `As an AI Judge, analyze this case:
    
Case Type: ${caseData.claimType}
Evidence: ${JSON.stringify(caseData.evidence)}
Requested Damages: ${caseData.requestedDamages} ETH

Provide judgment in JSON format:
{
  "verdict": "guilty" or "not_guilty",
  "awardedDamages": number (in ETH),
  "reasoning": "brief explanation",
  "precedents": ["similar case references"]
}`;

    // Get AI judgment
    console.log('🤖 Requesting AI judgment...');
    const aiResponse = await invokeModel(prompt, 300);
    
    let judgment;
    try {
      judgment = JSON.parse(aiResponse);
    } catch {
      // Fallback parsing
      judgment = {
        verdict: "not_guilty",
        awardedDamages: 0,
        reasoning: aiResponse,
        precedents: []
      };
    }
    
    // Store judgment
    const verdictHash = `Qm${Buffer.from(JSON.stringify(judgment)).toString('hex').substring(0, 44)}`;
    
    // Update case data
    caseData.judgment = judgment;
    caseData.verdictHash = verdictHash;
    caseData.status = judgment.verdict === "guilty" ? "pending_settlement" : "dismissed";
    caseData.judgedAt = new Date().toISOString();
    await saveCaseData(caseId, caseData);
    
    res.json({
      success: true,
      caseId,
      judgment,
      verdictHash,
      message: "Case judged by AI",
      nextSteps: judgment.verdict === "guilty" 
        ? "Defendant must settle within 7 days" 
        : "Case dismissed - no damages awarded",
      paymentReceived: req.paymentData.amount
    });
    
  } catch (error) {
    console.error('Judgment error:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to process judgment" });
    }
  }
});

/**
 * Get case details - Free endpoint
 */
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await loadCaseData(caseId);
    res.json(caseData);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to fetch case" });
    }
  }
});

export default router;