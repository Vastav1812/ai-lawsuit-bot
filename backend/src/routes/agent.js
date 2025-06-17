import express from 'express';
import { aiCourtAgent } from '../services/agentKit.js';
import { verifyPayment } from '../middleware/x402pay.js';

const router = express.Router();

// Initialize agent on server start
aiCourtAgent.initialize().catch(console.error);

/**
 * Get agent status
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      active: true,
      capabilities: aiCourtAgent.capabilities,
      activeJobs: Array.from(aiCourtAgent.activeJobs.entries()),
      walletAddress: aiCourtAgent.agentWallet 
        ? await aiCourtAgent.agentWallet.getDefaultAddress() 
        : null
    };
    
    res.json({ success: true, agent: status });
  } catch (error) {
    console.error('Agent status error:', error);
    res.status(500).json({ error: 'Failed to get agent status' });
  }
});

/**
 * Manually trigger case processing
 */
router.post('/process-cases', verifyPayment, async (req, res) => {
  try {
    await aiCourtAgent.processPendingCases();
    
    res.json({
      success: true,
      message: 'Case processing triggered',
      activeJobs: aiCourtAgent.activeJobs.size
    });
  } catch (error) {
    console.error('Process cases error:', error);
    res.status(500).json({ error: 'Failed to process cases' });
  }
});

/**
 * Generate report on demand
 */
router.post('/generate-report', verifyPayment, async (req, res) => {
  try {
    const report = await aiCourtAgent.generateDailyReport();
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Analyze specific case
 */
router.post('/analyze-case', verifyPayment, async (req, res) => {
  try {
    const { caseData } = req.body;
    
    const analysis = await aiCourtAgent.analyzeCase(caseData);
    const judgment = await aiCourtAgent.renderJudgment(caseData, analysis);
    
    res.json({
      success: true,
      analysis,
      judgment
    });
  } catch (error) {
    console.error('Case analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze case' });
  }
});

export default router;