// Create backend/scripts/check-bedrock-models.js
import { config } from "dotenv";
import { BedrockClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock";

config();

const client = new BedrockClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function checkAvailableModels() {
  try {
    console.log('🔍 Checking available Bedrock models...\n');
    
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);
    
    console.log('Available models:');
    response.modelSummaries.forEach(model => {
      if (model.modelId.includes('nova') || model.modelId.includes('claude')) {
        console.log(`- ${model.modelId} (${model.modelName})`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAvailableModels();