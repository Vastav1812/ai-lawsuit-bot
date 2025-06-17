import express from 'express';

const router = express.Router();

// Track all payments in memory (use database in production)
const paymentHistory = [];

// Middleware to log payments
export const logPayment = (req, res, next) => {
  if (req.paymentData) {
    paymentHistory.push({
      ...req.paymentData,
      id: paymentHistory.length + 1,
      success: true
    });
  }
  next();
};

// Free endpoint to view payment analytics
router.get('/dashboard', async (req, res) => {
  const totalRevenue = paymentHistory.reduce((sum, p) => {
    const amount = parseFloat(p.amount.replace('$', ''));
    return sum + amount;
  }, 0);
  
  const endpointRevenue = paymentHistory.reduce((acc, p) => {
    acc[p.endpoint] = (acc[p.endpoint] || 0) + parseFloat(p.amount.replace('$', ''));
    return acc;
  }, {});
  
  res.json({
    summary: {
      totalPayments: paymentHistory.length,
      totalRevenue: `$${totalRevenue.toFixed(2)}`,
      averagePayment: `$${(totalRevenue / paymentHistory.length || 0).toFixed(2)}`,
      uniqueUsers: new Set(paymentHistory.map(p => p.from)).size
    },
    endpointBreakdown: endpointRevenue,
    recentPayments: paymentHistory.slice(-10).reverse(),
    hourlyRevenue: calculateHourlyRevenue(paymentHistory)
  });
});

function calculateHourlyRevenue(payments) {
  const hourly = {};
  payments.forEach(p => {
    const hour = new Date(p.timestamp).getHours();
    hourly[hour] = (hourly[hour] || 0) + parseFloat(p.amount.replace('$', ''));
  });
  return hourly;
}

export default router;