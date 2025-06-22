import { config } from "dotenv";

config();

const TREASURY_ADDRESS = process.env.COURT_TREASURY_ADDRESS || "0x1234567890123456789012345678901234567890";

// Define our pricing structure
export const PRICING = {
  "/api/cases/file": "$10.00",
  "/api/cases/*/judge": "$5.00",
  "/api/precedents/search": "$0.50",
  "/api/precedents/full/*": "$5.00",
  "/api/cases/*/appeal": "$25.00",
  "/api/analytics/report": "$15.00",
  "/api/judge/priority": "$20.00",
  "/api/precedents/bulk": "$50.00"
};

// Create custom payment middleware following x402 protocol
export const paymentMiddleware = (req, res, next) => {
  // Skip payment for free endpoints
  const freeEndpoints = ['/health', '/api/info', '/api/cases/', '/'];
  if (freeEndpoints.some(endpoint => req.path.startsWith(endpoint) || req.path === endpoint)) {
    return next();
  }
  
  // For now, just continue - we'll add payment checking logic later
  next();
};

// Verify payment middleware factory - UPDATED to accept price parameter
export const verifyPayment = (priceInDollars) => {
  return (req, res, next) => {
    const paymentHeader = req.headers['x-payment'];
    
    if (!paymentHeader) {
      const price = priceInDollars ? `$${priceInDollars.toFixed(2)}` : getPriceForPath(req.path) || "$1.00";
      
      return res.status(402).json({
        error: "Payment required",
        message: "This endpoint requires payment via x402 protocol",
        paymentRequired: {
          amount: price,
          address: TREASURY_ADDRESS,
          details: "Include X-PAYMENT header with payment proof"
        }
      });
    }
    
    // Decode and verify payment (simplified for demo)
    try {
      const paymentData = JSON.parse(
        Buffer.from(paymentHeader, 'base64').toString()
      );
      
      // Verify the payment amount matches the required price
      const requiredPrice = priceInDollars ? `$${priceInDollars.toFixed(2)}` : getPriceForPath(req.path);
      
      req.paymentData = {
        from: paymentData.from || "0xuser",
        amount: paymentData.amount || "$0.00",
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl,
        verified: true,
        requiredAmount: requiredPrice
      };
      
      console.log(`💰 Payment received for ${req.path}:`, req.paymentData);
      next();
    } catch (error) {
      return res.status(400).json({
        error: "Invalid payment header",
        message: "Payment header must be base64 encoded JSON"
      });
    }
  };
};

// Helper function to get price for a path
function getPriceForPath(path) {
  for (const [pattern, price] of Object.entries(PRICING)) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]+') + '$');
    if (regex.test(path)) {
      return price;
    }
  }
  return null;
}

// Payment tracking middleware
export const trackPayment = async (req, res, next) => {
  if (req.paymentData) {
    console.log(`📊 Payment tracked:`, {
      endpoint: req.path,
      amount: req.paymentData.amount,
      from: req.paymentData.from,
      timestamp: req.paymentData.timestamp
    });
  }
  next();
};