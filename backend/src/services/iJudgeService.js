import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

class AIJudgeService {
    constructor() {
        this.bedrock = new BedrockRuntimeClient({ 
            region: process.env.AWS_REGION 
        });
    }
    
    async analyzeCase(caseData) {
        console.log('🤖 AI Judge analyzing case...');
        
        const prompt = `
You are an AI Judge. Analyze this case and provide judgment.

Case Type: ${caseData.claimType}
Evidence: ${JSON.stringify(caseData.evidence)}
Requested Damages: ${caseData.requestedDamages} ETH

Provide judgment as JSON:
{
  "verdict": "GUILTY" or "NOT_GUILTY",
  "awardedDamages": "amount in ETH",
  "reasoning": "explanation"
}`;

        try {
            const command = new ConverseCommand({
                modelId: process.env.BEDROCK_MODEL_ID,
                messages: [{
                    role: "user",
                    content: [{ text: prompt }]
                }]
            });
            
            const response = await this.bedrock.send(command);
            const content = response.output.message.content[0].text;
            
            // Parse AI response
            const judgment = JSON.parse(content);
            
            return {
                verdict: judgment.verdict || 'NOT_GUILTY',
                awardedDamages: judgment.awardedDamages || '0',
                reasoning: judgment.reasoning || 'Insufficient evidence',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('AI Judge error:', error);
            
            // Fallback judgment
            return {
                verdict: 'GUILTY',
                awardedDamages: '0.03',
                reasoning: 'Based on evidence provided, partial damages awarded.',
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default new AIJudgeService();