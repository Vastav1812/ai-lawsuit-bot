import { Coinbase } from "@coinbase/coinbase-sdk";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load environment variables for production
config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let coinbase;

// Initialize Coinbase SDK
try {
  // Check if we're in production or have environment variables set
  if (process.env.COINBASE_PRIVATE_KEY && process.env.COINBASE_PROJECT_ID) {
    console.log('🔧 Configuring Coinbase SDK from environment variables...');
    
    coinbase = Coinbase.configure({
      apiKeyName: process.env.COINBASE_NAME || 'ai-lawsuit-bot',
      privateKey: process.env.COINBASE_PRIVATE_KEY,
      projectId: process.env.COINBASE_PROJECT_ID
    });
    
    console.log('✅ Coinbase SDK initialized successfully from environment variables');
  } 
  // Fallback to JSON file for local development
  else if (process.env.COINBASE_API_KEY_PATH) {
    const apiKeyPath = join(__dirname, '../../', process.env.COINBASE_API_KEY_PATH);
    
    if (existsSync(apiKeyPath)) {
      console.log('🔧 Configuring Coinbase SDK from JSON file...');
      coinbase = Coinbase.configureFromJson(apiKeyPath);
      console.log('✅ Coinbase SDK initialized successfully from JSON file');
    } else {
      throw new Error(`JSON file not found at: ${apiKeyPath}`);
    }
  }
  // Try default JSON file location
  else {
    const defaultPath = join(__dirname, '../../coinbase_cloud_api_key.json');
    
    if (existsSync(defaultPath)) {
      console.log('🔧 Configuring Coinbase SDK from default JSON file...');
      coinbase = Coinbase.configureFromJson(defaultPath);
      console.log('✅ Coinbase SDK initialized successfully from default JSON file');
    } else {
      throw new Error('No Coinbase configuration found');
    }
  }
} catch (error) {
  console.error('❌ Failed to initialize Coinbase SDK:', error.message);
  
  // In production, log the error but don't exit - allow app to start with limited functionality
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Running in production without Coinbase SDK - some features may be limited');
    console.log('💡 To fix this, set these environment variables in Railway:');
    console.log('   - COINBASE_NAME (optional, defaults to "ai-lawsuit-bot")');
    console.log('   - COINBASE_PRIVATE_KEY (required)');
    console.log('   - COINBASE_PROJECT_ID (required)');
    coinbase = null;
  } else {
    console.log('💡 For local development, make sure one of these exists:');
    console.log('   - coinbase_cloud_api_key.json in the backend directory');
    console.log('   - Set COINBASE_API_KEY_PATH in your .env file');
    console.log('   - Or set COINBASE_PRIVATE_KEY and COINBASE_PROJECT_ID in your .env file');
    process.exit(1);
  }
}

export default coinbase;