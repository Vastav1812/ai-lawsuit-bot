import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';

// Import our configurations
import Coinbase from './config/coinbase.js';
import { paymentMiddleware, PRICING } from './middleware/x402pay.js';

// Import routes
import casesRouter from './routes/cases.js';
import precedentsRouter from './routes/precedents.js';
import analyticsRouter from './routes/analytics.js';
import casesWalletRouter from './routes/cases-wallet.js';
import walletsRouter from './routes/wallets.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS with specific options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins - add all possible frontend URLs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://localhost:4000',
      'http://127.0.0.1:4000',
      'http://localhost:5173',  // Vite default
      'http://127.0.0.1:5173',
      'https://ai-lawsuit.vercel.app',  // ADD THIS LINE
      'https://ai-lawsuit-git-main-vastav1812s-projects.vercel.app',
      'https://ai-lawsuit-g3olloads-vastav1812s-projects.vercel.app'
    ];
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, you might want to allow all origins
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️  CORS: Allowing origin ${origin} in development mode`);
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-PAYMENT', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Payment-Required', 'X-Payment-Amount'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply x402 payment middleware globally
app.use(paymentMiddleware);

// Health check endpoint (free)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    paymentGateway: 'x402 active'
  });
});

// API info endpoint (free)
app.get('/api/info', (req, res) => {
  res.json({
    name: 'AI Lawsuit Settlement Bot',
    version: '1.0.0',
    network: process.env.NETWORK,
    pricing: PRICING,
    features: [
      'AI-powered case analysis',
      'Automated settlements',
      'Precedent marketplace',
      'x402 payment integration'
    ],
    endpoints: {
      cases: {
        file: { method: 'POST', path: '/api/cases/file', price: PRICING['/api/cases/file'] },
        judge: { method: 'POST', path: '/api/cases/:id/judge', price: PRICING['/api/cases/*/judge'] },
        details: { method: 'GET', path: '/api/cases/:id', price: 'FREE' }
      },
      precedents: {
        search: { method: 'GET', path: '/api/precedents/search', price: PRICING['/api/precedents/search'] },
        full: { method: 'GET', path: '/api/precedents/full/:id', price: PRICING['/api/precedents/full/*'] },
        bulk: { method: 'POST', path: '/api/precedents/bulk', price: PRICING['/api/precedents/bulk'] }
      },
      analytics: {
        report: { method: 'POST', path: '/api/analytics/report', price: PRICING['/api/analytics/report'] }
      }
    }
  });
});

// Mount routers - ORDER MATTERS!
app.use('/api/cases', casesRouter);
app.use('/api/cases-wallet', casesWalletRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/precedents', precedentsRouter);
app.use('/api/analytics', analyticsRouter);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      '/health',
      '/api/info',
      '/api/cases/*',
      '/api/cases-wallet/*',
      '/api/wallets/*',
      '/api/precedents/*',
      '/api/analytics/*'
    ]
  });
});

// 402 Payment Required handler
app.use((req, res, next) => {
  if (res.statusCode === 402) {
    res.json({
      error: 'Payment Required',
      message: 'This endpoint requires payment via x402 protocol',
      pricing: PRICING,
      instructions: 'Include X-PAYMENT header with valid payment proof'
    });
  } else {
    next();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Log the error
  console.error('❌ Error:', err.message || err);
  if (err.stack) {
    console.error('Stack trace:', err.stack);
  }

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 AI Lawsuit Bot server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Network: ${process.env.NETWORK || 'base-sepolia'}`);
  console.log(`💰 x402 Payment Gateway: Active`);
  console.log(`🌐 CORS: Configured for development`);
  console.log(`\n📊 Pricing:`);
  
  if (PRICING && typeof PRICING === 'object') {
    Object.entries(PRICING).forEach(([endpoint, price]) => {
      console.log(`   ${endpoint}: ${price}`);
    });
  }
  
  // Debug: Log all registered routes (only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📍 Registered routes:');
    
    // Function to extract route info
    const logRoutes = () => {
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          // Routes registered directly on the app
          const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
          console.log(`   ${methods} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
          // Router middleware
          const regexp = middleware.regexp;
          let basePath = '';
          
          try {
            // Try to extract base path from regexp
            const regexpStr = regexp.toString();
            basePath = regexpStr
              .replace(/^\/\^/, '')
              .replace(/\$\/?/, '')
              .replace(/\\/g, '')
              .replace(/$$\?\:/g, '')
              .replace(/$$/g, '')
              .split('?')[0];
            
            // Clean up any remaining regexp artifacts
            basePath = basePath.replace(/[()]/g, '').replace(/\\/g, '');
            
            // Ensure no double slashes
            basePath = basePath.replace(/\/+/g, '/');
          } catch (e) {
            basePath = '/';
          }
          
          if (middleware.handle && middleware.handle.stack) {
            middleware.handle.stack.forEach((handler) => {
              if (handler.route) {
                const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
                const fullPath = `${basePath}${handler.route.path}`.replace(/\/+/g, '/');
                console.log(`   ${methods} ${fullPath}`);
              }
            });
          }
        }
      });
    };
    
    try {
      logRoutes();
    } catch (error) {
      console.log('   (Unable to display routes - server is running normally)');
    }
    
    console.log('');
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n📴 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message || error);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  // Exit the process after logging
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise);
  console.error('Reason:', reason);
  // Exit the process after logging
  process.exit(1);
});

export default app;