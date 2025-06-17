import express from 'express';
import { verifyPayment, trackPayment } from '../middleware/x402pay.js';

const router = express.Router();

/**
 * Generate analytics report - Requires $15 payment
 */
router.post('/report', verifyPayment, trackPayment, async (req, res) => {
  try {
    const { startDate, endDate, metrics } = req.body;
    
    // Mock analytics data
    const report = {
      period: { startDate, endDate },
      summary: {
        totalCases: 156,
        guiltyVerdicts: 89,
        totalDamagesAwarded: "45.7 ETH",
        averageSettlementTime: "3.2 days",
        mostCommonCaseType: "API_FRAUD"
      },
      caseTypeBreakdown: {
        API_FRAUD: 67,
        DATA_THEFT: 34,
        SERVICE_MANIPULATION: 28,
        TOKEN_FRAUD: 27
      },
      topPrecedents: [
        { caseId: 1001, citations: 45, type: "API_FRAUD" },
        { caseId: 1002, citations: 38, type: "DATA_THEFT" },
        { caseId: 1003, citations: 31, type: "SERVICE_MANIPULATION" }
      ],
      revenueAnalysis: {
        filingFees: "1.56 ETH",
        precedentAccess: "0.89 ETH",
        appealFees: "0.25 ETH",
        totalRevenue: "2.7 ETH"
      },
      trends: {
        casesGrowth: "+15% month-over-month",
        averageDamagesIncreasing: true,
        emergingCaseTypes: ["PROMPT_INJECTION", "MODEL_POISONING"]
      },
      generatedAt: new Date().toISOString(),
      paymentReceived: req.paymentData.amount
    };
    
    res.json({
      success: true,
      report,
      message: "Analytics report generated successfully",
      exportFormats: ["json", "csv", "pdf"]
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

/**
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Mock dashboard stats data
    const stats = {
      totalCases: 2847,
      totalSettlements: "$1.2M",
      activeJudges: 156,
      avgResolutionTime: "2.5 days",
      successRate: "94.2%",
      pendingCases: 23,
    };
    res.json({
      success: true,
      stats,
      message: "Dashboard stats fetched successfully",
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * Get recent activities for dashboard
 */
router.get('/activities/recent', async (req, res) => {
  try {
    // Mock recent activities data
    const activities = [
      {
        id: 1,
        type: 'case_filed',
        description: 'New case filed: API Fraud Case #2847',
        time: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
      },
      {
        id: 2,
        type: 'judgment',
        description: 'Case #2846: Verdict reached - Guilty',
        time: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      },
      {
        id: 3,
        type: 'settlement',
        description: 'Case #2845: Settlement completed - 0.5 ETH',
        time: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
      },
      {
        id: 4,
        type: 'appeal',
        description: 'Case #2844: Appeal filed',
        time: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
      },
      {
        id: 5,
        type: 'precedent',
        description: 'New precedent created: Case #2843',
        time: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 hours ago
      }
    ];

    res.json({
      success: true,
      activities,
      message: "Recent activities fetched successfully"
    });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: "Failed to fetch recent activities" });
  }
});

export default router;