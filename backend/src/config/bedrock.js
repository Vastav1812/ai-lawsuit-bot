import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Helper function to invoke Nova Micro
export async function invokeNovaMicro(prompt, maxTokens = 500) {
  try {
    const command = new InvokeModelCommand({
      modelId: "amazon.nova-micro-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        stop_sequences: ["\n\n"]
      })
    });
    
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log('📥 Raw response:', JSON.stringify(responseBody, null, 2));
    
    // Handle Nova Micro's response format
    if (responseBody.completion) {
      return responseBody.completion;
    } else {
      console.error('Unexpected response format:', responseBody);
      throw new Error('Unexpected response format from Nova Micro');
    }
  } catch (error) {
    console.error('Bedrock invocation error:', error);
    throw error;
  }
}

// Test connection function
export async function testBedrockConnection() {
  try {
    console.log('🧪 Testing Bedrock Nova Micro connection...');
    const response = await invokeNovaMicro("Say 'AI Judge system operational!'", 50);
    console.log('✅ Bedrock responded:', response);
    return true;
  } catch (error) {
    console.error('❌ Bedrock connection failed:', error);
    return false;
  }
}

export default bedrockClient;