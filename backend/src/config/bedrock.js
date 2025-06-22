// backend/src/config/bedrock.js
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { config } from 'dotenv';

config();

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Flag to track if we should use fallback
let useOnlyFallback = false;

// Helper function to invoke Nova Micro
async function invokeNovaMicro(prompt, maxTokens = 500) {
  // If we've already determined Nova isn't available, use fallback immediately
  if (useOnlyFallback || process.env.USE_FALLBACK_AI === 'true') {
    console.log('📋 Using intelligent fallback judgment system');
    return generateFallbackJudgment(prompt);
  }

  try {
    // Try with inference profile if provided
    const modelId = process.env.NOVA_INFERENCE_PROFILE_ARN || "amazon.nova-micro-v1:0";
    
    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: maxTokens,
          temperature: 0.7,
          topP: 0.9,
          stopSequences: []
        }
      })
    });
    
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log('📥 Nova Micro response:', JSON.stringify(responseBody, null, 2));
    
    // Handle Nova Micro's response format
    if (responseBody.results && responseBody.results[0] && responseBody.results[0].outputText) {
      return responseBody.results[0].outputText;
    } else if (responseBody.completion) {
      return responseBody.completion;
    } else if (responseBody.output && responseBody.output.text) {
      return responseBody.output.text;
    } else {
      console.error('Unexpected response format:', responseBody);
      throw new Error('Unexpected response format from Nova Micro');
    }
  } catch (error) {
    console.error('❌ Nova Micro invocation error:', error);
    
    // If it's a validation error about inference profile, disable Nova for this session
    if (error.name === 'ValidationException' && error.message.includes('inference profile')) {
      console.log('⚠️ Nova Micro requires inference profile. Switching to fallback system for this session.');
      useOnlyFallback = true;
    }
    
    console.log('⚠️ Using fallback judgment logic...');
    return generateFallbackJudgment(prompt);
  }
}

// Intelligent fallback judgment generator
function generateFallbackJudgment(prompt) {
  // Extract key information from prompt using better regex
  const claimTypeMatch = prompt.match(/Case Type:\s*(\w+)/);
  const damagesMatch = prompt.match(/Requested Damages:\s*([\d.]+)/);
  const evidenceMatch = prompt.match(/Evidence Provided:\s*"([^"]+)"/s) || 
                       prompt.match(/Evidence:\s*"([^"]+)"/s) ||
                       prompt.match(/Evidence:\s*([^\n]+)/);
  const qualityMatch = prompt.match(/Evidence Quality Score:\s*(\d+)/);
  
  const claimType = claimTypeMatch ? claimTypeMatch[1] : 'UNKNOWN';
  const requestedDamages = damagesMatch ? parseFloat(damagesMatch[1]) : 1;
  const evidenceText = evidenceMatch ? evidenceMatch[1].trim() : '';
  const qualityScore = qualityMatch ? parseInt(qualityMatch[1]) : 50;
  
  console.log('📊 Analyzing case:', {
    claimType,
    requestedDamages,
    evidenceLength: evidenceText.length,
    qualityScore
  });
  
  // Determine verdict based on evidence quality and type
  let verdict = "not_guilty";
  let awardedDamages = 0;
  let reasoning = "";
  let evidenceQuality = "weak";
  let specificFindings = [];
  
  // Check for frivolous cases
  if (qualityScore < 20 || evidenceText.length < 30) {
    verdict = "dismissed_frivolous";
    reasoning = "Case dismissed as frivolous. The evidence provided is insufficient or appears to be random text. This wastes judicial resources.";
    evidenceQuality = "frivolous";
    specificFindings = [
      "Evidence lacks substance",
      "No verifiable claims presented",
      "Possible bad faith filing"
    ];
    
    return JSON.stringify({
      verdict,
      awardedDamages: 0,
      reasoning,
      evidenceQuality,
      evidenceScore: qualityScore,
      specificFindings,
      penalty: 0.1
    });
  }
  
  // Analyze based on claim type
  const claimTypeAnalysis = {
    API_FRAUD: {
      keywords: ['api', 'key', 'unauthorized', 'access', 'stolen', 'fraud', 'endpoint', 'token'],
      damageMultiplier: 0.8,
      minEvidence: 50
    },
    DATA_THEFT: {
      keywords: ['data', 'stolen', 'breach', 'confidential', 'leak', 'theft', 'database', 'records'],
      damageMultiplier: 0.9,
      minEvidence: 60
    },
    SERVICE_MANIPULATION: {
      keywords: ['service', 'manipulate', 'alter', 'tamper', 'modify', 'disrupt', 'system', 'hack'],
      damageMultiplier: 0.7,
      minEvidence: 40
    },
    TOKEN_FRAUD: {
      keywords: ['token', 'wallet', 'crypto', 'theft', 'unauthorized', 'transfer', 'blockchain', 'eth'],
      damageMultiplier: 0.85,
      minEvidence: 55
    }
  };
  
  const analysis = claimTypeAnalysis[claimType] || { keywords: [], damageMultiplier: 0.5, minEvidence: 50 };
  const evidenceLower = evidenceText.toLowerCase();
  const keywordMatches = analysis.keywords.filter(keyword => evidenceLower.includes(keyword)).length;
  const keywordScore = (keywordMatches / analysis.keywords.length) * 100;
  
  // Check evidence coherence
  const hasSpecificDetails = /\d{4}|\b0x[a-fA-F0-9]+\b|@\w+|\w+\.\w+/.test(evidenceText); // dates, addresses, emails, domains
  const sentenceCount = evidenceText.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
  const isCoherent = sentenceCount >= 2 && evidenceText.length >= analysis.minEvidence;
  
  console.log('🔍 Evidence analysis:', {
    keywordMatches,
    keywordScore,
    hasSpecificDetails,
    sentenceCount,
    isCoherent
  });
  
  // Determine verdict based on comprehensive analysis
  if (qualityScore >= 70 && keywordScore >= 25 && isCoherent && hasSpecificDetails) {
    verdict = "guilty";
    awardedDamages = requestedDamages * analysis.damageMultiplier;
    reasoning = `Strong evidence provided with clear indicators of ${claimType.replace('_', ' ').toLowerCase()}. ` +
                `The evidence contains specific details and multiple corroborating factors. ` +
                `Awarding ${(analysis.damageMultiplier * 100).toFixed(0)}% of requested damages.`;
    evidenceQuality = "strong";
    specificFindings = [
      `Evidence contains ${keywordMatches} relevant keywords for ${claimType}`,
      "Specific details and dates provided",
      "Clear documentation of harm",
      "Coherent narrative supporting claims"
    ];
  } else if (qualityScore >= 40 && keywordScore >= 15 && isCoherent) {
    verdict = "guilty";
    awardedDamages = requestedDamages * (analysis.damageMultiplier * 0.6);
    reasoning = `Evidence suggests wrongdoing related to ${claimType.replace('_', ' ').toLowerCase()}. ` +
                `While some elements of the claim are supported, the evidence lacks comprehensive detail. ` +
                `Awarding ${(analysis.damageMultiplier * 60).toFixed(0)}% of requested damages.`;
    evidenceQuality = "adequate";
    specificFindings = [
      "Evidence partially supports claims",
      `${keywordMatches} relevant factors identified`,
      "Some documentation provided",
      "Additional evidence would strengthen the case"
    ];
  } else {
    verdict = "not_guilty";
    reasoning = "Insufficient evidence to support the claims. The plaintiff has not met the burden of proof. " +
                "The evidence lacks specific details, corroborating factors, or clear connection to the alleged wrongdoing.";
    evidenceQuality = "weak";
    specificFindings = [
      "Lack of specific evidence related to " + claimType,
      "No clear proof of wrongdoing",
      "Claims are largely unsubstantiated",
      evidenceText.length < 50 ? "Evidence too brief to evaluate properly" : "Evidence lacks relevant details"
    ];
  }
  
  const judgment = {
    verdict,
    awardedDamages: Math.round(awardedDamages * 100) / 100,
    reasoning,
    evidenceQuality,
    evidenceScore: qualityScore,
    specificFindings,
    penalty: verdict === "dismissed_frivolous" ? 0.1 : 0
  };
  
  console.log('⚖️ Judgment rendered:', judgment);
  
  return JSON.stringify(judgment);
}

// Test connection function
async function testBedrockConnection() {
  try {
    console.log('🧪 Testing Nova Micro connection...');
    
    // If we're using fallback only, skip the test
    if (process.env.USE_FALLBACK_AI === 'true') {
      console.log('📋 Configured to use fallback AI system');
      return true;
    }
    
    const testPrompt = "Respond with: 'AI Judge system operational!'";
    const response = await invokeNovaMicro(testPrompt, 50);
    console.log('✅ AI system responded:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Nova Micro connection failed:', error.message);
    console.log('⚠️ Fallback judgment system will be used');
    return false;
  }
}

// Initialize and test on startup
if (process.env.NODE_ENV !== 'test') {
  testBedrockConnection();
}

export { invokeNovaMicro, testBedrockConnection };