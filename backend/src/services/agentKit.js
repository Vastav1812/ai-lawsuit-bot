import { Wallet } from "@coinbase/coinbase-sdk";
import { invokeModel } from '../config/bedrock-flexible.js';
import { settlementService } from './settlementService.js';
import { walletManager } from './walletManager.js';

export class AICourtAgent {
  constructor() {
    this.agentWallet = null;
    this.capabilities = [
      'analyze_cases',
      'render_judgments', 
      'monitor_settlements',
      'manage_precedents',
      'generate_reports'
    ];
    this.activeJobs = new Map();
  }

  async initialize() {
    console.log('🤖 Initializing AI Court Agent...');
    
    // Create or load agent wallet
    this.agentWallet = await walletManager.loadOrCreateWallet('ai_judge_agent');
    const agentAddress = await this.agentWallet.getDefaultAddress();
    
    console.log('✅ AI Agent initialized with address:', agentAddress);
    
    // Start autonomous monitoring
    this.startAutonomousOperations();
    
    return {
      address: agentAddress,
      capabilities: this.capabilities,
      status: 'active'
    };
  }

  // Autonomous case monitoring
  async startAutonomousOperations() {
    // Monitor pending cases every 5 minutes
    setInterval(() => this.processPendingCases(), 5 * 60 * 1000);
    
    // Check settlements every 10 minutes
    setInterval(() => this.checkPendingSettlements(), 10 * 60 * 1000);
    
    // Generate daily reports
    setInterval(() => this.generateDailyReport(), 24 * 60 * 60 * 1000);
    
    console.log('🔄 Autonomous operations started');
  }

  async processPendingCases() {
    console.log('🔍 AI Agent: Checking for pending cases...');
    
    // In production, query database for pending cases
    const pendingCases = await this.getPendingCases();
    
    for (const caseData of pendingCases) {
      if (!this.activeJobs.has(caseData.id)) {
        this.activeJobs.set(caseData.id, 'processing');
        
        try {
          // Analyze case
          const analysis = await this.analyzeCase(caseData);
          
          // Render judgment
          const judgment = await this.renderJudgment(caseData, analysis);
          
          // Store judgment
          await this.storeJudgment(caseData.id, judgment);
          
          // If guilty, initiate settlement
          if (judgment.verdict === 'guilty') {
            await settlementService.initiateCaseSettlement(caseData, judgment);
          }
          
          this.activeJobs.set(caseData.id, 'completed');
          
        } catch (error) {
          console.error(`Error processing case ${caseData.id}:`, error);
          this.activeJobs.set(caseData.id, 'failed');
        }
      }
    }
  }

  async analyzeCase(caseData) {
    const prompt = `As an AI Legal Analyst, perform deep analysis of this case:

Case Type: ${caseData.claimType}
Plaintiff Claims: ${JSON.stringify(caseData.evidence)}
Requested Damages: ${caseData.requestedDamages} ETH

Analyze:
1. Validity of claims
2. Strength of evidence
3. Applicable precedents
4. Recommended verdict
5. Damage calculation methodology

Format: JSON with keys: claimValidity(0-100), evidenceStrength(0-100), applicablePrecedents[], recommendedVerdict, damageAnalysis`;

    const analysis = await invokeModel(prompt, 500);
    
    try {
      return JSON.parse(analysis);
    } catch {
      return {
        claimValidity: 50,
        evidenceStrength: 50,
        applicablePrecedents: [],
        recommendedVerdict: 'not_guilty',
        damageAnalysis: 'Unable to parse analysis'
      };
    }
  }

  async renderJudgment(caseData, analysis) {
    const prompt = `As an AI Judge, render final judgment based on this analysis:

Case: ${caseData.id}
Analysis: ${JSON.stringify(analysis)}
Requested Damages: ${caseData.requestedDamages} ETH

Render judgment with:
1. Clear verdict (guilty/not_guilty)
2. If guilty, calculate fair damages
3. Legal reasoning
4. Precedent citations

Format: JSON with keys: verdict, awardedDamages, reasoning, precedentCitations[]`;

    const judgment = await invokeModel(prompt, 400);
    
    try {
      const parsed = JSON.parse(judgment);
      
      // Ensure damages don't exceed requested
      if (parsed.awardedDamages > parseFloat(caseData.requestedDamages)) {
        parsed.awardedDamages = parseFloat(caseData.requestedDamages);
      }
      
      return parsed;
    } catch {
      return {
        verdict: 'not_guilty',
        awardedDamages: 0,
        reasoning: 'Unable to render clear judgment',
        precedentCitations: []
      };
    }
  }

  async checkPendingSettlements() {
    console.log('💰 AI Agent: Checking pending settlements...');
    
    // Get all pending settlements
    const settlements = await this.getPendingSettlements();
    
    for (const settlement of settlements) {
      const status = await settlementService.checkSettlementDeposit(settlement.caseId);
      
      if (status.funded && settlement.status === 'ready_to_distribute') {
        console.log(`✅ Settlement ${settlement.caseId} is funded, executing distribution...`);
        
        try {
          await settlementService.executeSettlement(settlement.caseId);
          await this.notifyParties(settlement.caseId, 'settlement_complete');
        } catch (error) {
          console.error(`Failed to execute settlement ${settlement.caseId}:`, error);
        }
      } else if (this.isOverdue(settlement)) {
        console.log(`⚠️ Settlement ${settlement.caseId} is overdue`);
        await this.handleOverdueSettlement(settlement);
      }
    }
  }

  async generateDailyReport() {
    console.log('📊 AI Agent: Generating daily report...');
    
    const report = {
      date: new Date().toISOString().split('T')[0],
      metrics: {
        casesProcessed: this.activeJobs.size,
        settlementsCompleted: 0,
        totalDamagesAwarded: 0,
        precedentsCreated: 0
      },
      systemHealth: await this.checkSystemHealth(),
      recommendations: []
    };
    
    // Generate insights
    const insights = await this.generateInsights(report);
    report.insights = insights;
    
    // Store report
    await this.storeReport(report);
    
    console.log('✅ Daily report generated:', report);
    
    return report;
  }

  async checkSystemHealth() {
    const walletInfo = await walletManager.exportWalletInfo();
    
    return {
      walletsOperational: Object.keys(walletInfo.system).length >= 4,
      treasuryBalance: walletInfo.system.treasury?.balances || [],
      activeAgents: 1,
      lastCheckTime: new Date().toISOString()
    };
  }

  async generateInsights(reportData) {
    const prompt = `Analyze this court system daily report and provide insights:

${JSON.stringify(reportData)}

Generate:
1. Key trends
2. Potential issues
3. Optimization recommendations
4. Fraud risk indicators`;

    return await invokeModel(prompt, 300);
  }

  // Mock data functions (replace with database in production)
  async getPendingCases() {
    return []; // Would query database
  }

  async getPendingSettlements() {
    return Array.from(settlementService.pendingSettlements.values());
  }

  async storeJudgment(caseId, judgment) {
    console.log(`📝 Storing judgment for case ${caseId}`);
    // Would store in database
  }

  async storeReport(report) {
    console.log('📊 Storing daily report');
    // Would store in database
  }

  async notifyParties(caseId, event) {
    console.log(`📧 Notifying parties for case ${caseId}: ${event}`);
    // Would send notifications
  }

  isOverdue(settlement) {
    const deadline = new Date(settlement.createdAt);
    deadline.setDate(deadline.getDate() + 7);
    return new Date() > deadline;
  }

  async handleOverdueSettlement(settlement) {
    // Mark as expired and return funds if any
    settlement.status = 'expired';
  }
}

// Create singleton instance
export const aiCourtAgent = new AICourtAgent();