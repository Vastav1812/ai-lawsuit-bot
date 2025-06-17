// Create backend/scripts/test-nova-simple.js
import { config } from "dotenv";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Load environment variables
config();

async function testNova() {
  console.log('🧪 Testing EU Nova Micro...\n');
  console.log('Region:', process.env.AWS_REGION);
  console.log('Model:', process.env.BEDROCK_MODEL_ID);
  console.log('');

  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  try {
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: [{
            text: "Say hello"
          }]
        }]
      })
    });
    
    console.log('📤 Sending request...');
    const response = await client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log('📥 Raw response:', JSON.stringify(result, null, 2));
    
    if (result.completion) {
      console.log('✅ Success! Nova Micro said:', result.completion);
    } else if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Success! Nova Micro said:', result.content[0].text);
    } else {
      console.log('✅ Success! Nova Micro response:', result);
    }
    
    console.log('\n🎉 EU Nova Micro is working perfectly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Check your .env file has the correct model ID');
    console.log('- Make sure AWS credentials are correct');
  }
}

testNova();