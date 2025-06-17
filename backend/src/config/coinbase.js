import { Coinbase } from "@coinbase/coinbase-sdk";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Coinbase SDK
try {
  const apiKeyPath = join(__dirname, '../../', process.env.COINBASE_API_KEY_PATH);
  Coinbase.configureFromJson(apiKeyPath);
  console.log('✅ Coinbase SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Coinbase SDK:', error);
  process.exit(1);
}

export default Coinbase;