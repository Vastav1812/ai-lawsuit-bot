import express from 'express';
import { verifyPayment, trackPayment } from '../middleware/x402pay.js';

const router = express.Router();

// Mock precedent database
const precedents = [
  {
    id: 1,
    caseId: 1001,
    type: "API_FRAUD",
    summary: "AI agent promised 99% accuracy but delivered 60%",
    verdict: "guilty",
    damages: "0.5 ETH",
    keywords: ["accuracy", "false advertising", "API fraud"],
    citationCount: 45
  },
  {
    id: 2,
    caseId: 1002,
    type: "DATA_THEFT",
    summary: "Unauthorized training on proprietary dataset",
    verdict: "guilty",
    damages: "2.0 ETH",
    keywords: ["data theft", "unauthorized use", "training data"],
    citationCount: 23
  }
];

/**
 * Search precedents - Requires $0.50 payment
 */
router.get('/search', verifyPayment, trackPayment, async (req, res) => {
  try {
    const { type, keywords, verdict } = req.query;
    
    // Filter precedents based on search criteria
    let results = [...precedents];
    
    if (type) {
      results = results.filter(p => p.type === type);
    }
    
    if (keywords) {
      const searchTerms = keywords.toLowerCase().split(',');
      results = results.filter(p => 
        searchTerms.some(term => 
          p.keywords.some(k => k.toLowerCase().includes(term))
        )
      );
    }
    
    if (verdict) {
      results = results.filter(p => p.verdict === verdict);
    }
    
    res.json({
      success: true,
      count: results.length,
      results: results.map(p => ({
        id: p.id,
        caseId: p.caseId,
        type: p.type,
        summary: p.summary,
        verdict: p.verdict,
        citationCount: p.citationCount
      })),
      searchCriteria: { type, keywords, verdict },
      paymentReceived: req.paymentData.amount
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * Access full precedent details - Requires $5 payment
 */
router.get('/full/:precedentId', verifyPayment, trackPayment, async (req, res) => {
  try {
    const { precedentId } = req.params;
    
    // Mock full precedent data
    const fullPrecedent = {
      id: precedentId,
      caseId: 1001,
      type: "API_FRAUD",
      filedDate: "2024-01-10",
      settledDate: "2024-01-15",
      plaintiff: "0x123...abc",
      defendant: "0x456...def",
      claimDetails: {
        promised: "99% accuracy in translation",
        delivered: "60% accuracy based on benchmark tests",
        evidence: [
          "Benchmark test results",
          "API documentation screenshots",
          "Customer complaints"
        ]
      },
      judgment: {
        verdict: "guilty",
        awardedDamages: "0.5 ETH",
        reasoning: "The defendant clearly misrepresented their service capabilities. The evidence shows a significant gap between promised and delivered performance.",
        mitigatingFactors: ["Service was functional, just not as accurate as claimed"],
        aggravatingFactors: ["Multiple customers affected", "No refunds offered"]
      },
      legalPrinciples: [
        "Misrepresentation in service agreements",
        "Material breach of contract",
        "Consumer protection in AI services"
      ],
      similarCases: [1002, 1003, 1004],
      citationCount: 45,
      paymentReceived: req.paymentData.amount
    };
    
    // Distribute payment to original plaintiff
    console.log(`💸 Distributing precedent access fee to original plaintiff`);
    
    res.json({
      success: true,
      precedent: fullPrecedent,
      message: "Full precedent accessed successfully"
    });
    
  } catch (error) {
    console.error('Precedent access error:', error);
    res.status(500).json({ error: "Failed to access precedent" });
  }
});

/**
 * Bulk precedent access - Requires $50 payment
 */
router.post('/bulk', verifyPayment, trackPayment, async (req, res) => {
  try {
    const { precedentIds } = req.body;
    
    if (!Array.isArray(precedentIds) || precedentIds.length === 0) {
      return res.status(400).json({ error: "precedentIds array required" });
    }
    
    if (precedentIds.length > 20) {
      return res.status(400).json({ error: "Maximum 20 precedents per bulk request" });
    }
    
    // Mock bulk data
    const bulkPrecedents = precedentIds.map(id => ({
      id,
      caseId: 1000 + parseInt(id),
      type: "API_FRAUD",
      summary: `Case ${id} summary`,
      verdict: "guilty",
      damages: "0.5 ETH",
      fullDetailsUrl: `/api/precedents/full/${id}`
    }));
    
    res.json({
      success: true,
      count: bulkPrecedents.length,
      precedents: bulkPrecedents,
      totalValue: `$${precedentIds.length * 5}`,
      discount: "50% bulk discount applied",
      paymentReceived: req.paymentData.amount
    });
    
  } catch (error) {
    console.error('Bulk access error:', error);
    res.status(500).json({ error: "Bulk access failed" });
  }
});

export default router;