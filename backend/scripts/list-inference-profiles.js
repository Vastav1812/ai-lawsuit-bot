// Create backend/scripts/list-inference-profiles.js
import { config } from "dotenv";
import { BedrockClient, ListInferenceProfilesCommand } from "@aws-sdk/client-bedrock";

config();

async function listProfiles() {
  const client = new BedrockClient({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  try {
    console.log('📋 Checking available inference profiles...\n');
    
    const command = new ListInferenceProfilesCommand({});
    const response = await client.send(command);
    
    console.log('Available profiles:');
    response.inferenceProfileSummaries?.forEach(profile => {
      console.log(`- ${profile.inferenceProfileName}`);
      console.log(`  ID: ${profile.inferenceProfileId}`);
      console.log(`  Models: ${profile.models?.map(m => m.modelId).join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listProfiles();