import { Coinbase } from "@coinbase/coinbase-sdk";
import { config } from "dotenv";

// Load environment variables
config();

let coinbase = null;

// Initialize Coinbase SDK
try {
  // Map environment variables - Railway uses different names
  const apiKeyName = process.env.COINBASE_API_KEY_NAME || process.env.COINBASE_PROJECT_ID;
  const privateKey = process.env.COINBASE_API_KEY_PRIVATE_KEY || process.env.COINBASE_PRIVATE_KEY;

  console.log('🔍 Checking Coinbase configuration...');
  console.log('   API Key Name exists:', !!apiKeyName);
  console.log('   Private Key exists:', !!privateKey);

  if (apiKeyName && privateKey) {
    console.log('🔧 Initializing Coinbase SDK...');
    
    // Create Coinbase instance with correct constructor
    coinbase = new Coinbase({
      apiKeyName: apiKeyName,
      privateKey: privateKey
    });
    
    console.log('✅ Coinbase SDK initialized successfully');
  } else {
    throw new Error('Missing required Coinbase credentials');
  }
} catch (error) {
  console.error('❌ Failed to initialize Coinbase SDK:', error.message);
  
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Running in production without Coinbase SDK');
    console.log('💡 Required environment variables:');
    console.log('   - COINBASE_PROJECT_ID (or COINBASE_API_KEY_NAME)');
    console.log('   - COINBASE_PRIVATE_KEY (or COINBASE_API_KEY_PRIVATE_KEY)');
  }
  
  // Keep coinbase as null - walletManager will handle this gracefully
  coinbase = null;
}

export default coinbase;