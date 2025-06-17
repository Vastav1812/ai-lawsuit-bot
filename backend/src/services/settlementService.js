import { walletManager } from './walletManager.js';
import { ethers } from 'ethers';

export class SettlementService {
  constructor() {
    this.pendingSettlements = new Map();
  }

  async initiateCaseSettlement(caseData, verdict) {
    try {
      console.log(`🏛️ Initiating settlement for case ${caseData.id}`);
      
      // Create a unique wallet for this case's escrow
      const caseWallet = await walletManager.createCaseWallet(caseData.id);
      const escrowAddress = await caseWallet.getDefaultAddress();
      
      // Create settlement record
      const settlement = {
        caseId: caseData.id,
        verdict,
        escrowAddress,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        requiredAmount: verdict.awardedDamages,
        defendant: caseData.defendant,
        plaintiff: caseData.plaintiff
      };
      
      this.pendingSettlements.set(caseData.id, settlement);
      
      return {
        settlementId: caseData.id,
        escrowAddress,
        requiredAmount: verdict.awardedDamages,
        message: `Defendant must deposit ${verdict.awardedDamages} ETH to ${escrowAddress}`,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };
    } catch (error) {
      console.error('Settlement initiation error:', error);
      throw error;
    }
  }

  async checkSettlementDeposit(caseId) {
    const settlement = this.pendingSettlements.get(caseId);
    if (!settlement) throw new Error('Settlement not found');
    
    try {
      // Check case wallet balance
      const balances = await walletManager.getWalletBalance(`case_${caseId}`);
      const ethBalance = balances.find(b => b.asset === 'ETH')?.amount || 0;
      
      console.log(`💰 Case ${caseId} escrow balance: ${ethBalance} ETH`);
      
      if (parseFloat(ethBalance) >= parseFloat(settlement.requiredAmount)) {
        settlement.status = 'ready_to_distribute';
        settlement.depositedAmount = ethBalance;
        settlement.depositedAt = new Date().toISOString();
        
        return {
          funded: true,
          balance: ethBalance,
          required: settlement.requiredAmount,
          canDistribute: true
        };
      }
      
      return {
        funded: false,
        balance: ethBalance,
        required: settlement.requiredAmount,
        remaining: parseFloat(settlement.requiredAmount) - parseFloat(ethBalance)
      };
    } catch (error) {
      console.error('Balance check error:', error);
      throw error;
    }
  }

  async executeSettlement(caseId) {
    const settlement = this.pendingSettlements.get(caseId);
    if (!settlement) throw new Error('Settlement not found');
    
    if (settlement.status !== 'ready_to_distribute') {
      throw new Error('Settlement not ready for distribution');
    }
    
    try {
      console.log(`⚖️ Executing settlement for case ${caseId}`);
      
      // Prepare verdict with addresses
      const verdictWithAddresses = {
        ...settlement.verdict,
        plaintiffAddress: settlement.plaintiff,
        awardedDamages: settlement.requiredAmount
      };
      
      // Execute distribution
      const distribution = await walletManager.distributeSettlement(
        caseId,
        verdictWithAddresses
      );
      
      // Update settlement status
      settlement.status = 'completed';
      settlement.completedAt = new Date().toISOString();
      settlement.distribution = distribution;
      
      return {
        success: true,
        caseId,
        distribution: distribution.distributions,
        transactions: distribution.transactions,
        completedAt: settlement.completedAt
      };
    } catch (error) {
      console.error('Settlement execution error:', error);
      settlement.status = 'failed';
      settlement.error = error.message;
      throw error;
    }
  }

  async getSettlementStatus(caseId) {
    const settlement = this.pendingSettlements.get(caseId);
    if (!settlement) return null;
    
    // Check current balance
    const depositStatus = await this.checkSettlementDeposit(caseId);
    
    return {
      ...settlement,
      currentBalance: depositStatus.balance,
      remainingAmount: depositStatus.remaining,
      isFullyFunded: depositStatus.funded
    };
  }

  async processAppealPayment(caseId, appealData) {
    // Create appeal wallet
    const appealWallet = await walletManager.createCaseWallet(`appeal_${caseId}`);
    const appealAddress = await appealWallet.getDefaultAddress();
    
    // Appeal fee distribution: 50% to court, 50% to original winner
    const appealFee = 0.025; // 0.025 ETH appeal fee
    
    return {
      appealId: `appeal_${caseId}`,
      paymentAddress: appealAddress,
      requiredFee: appealFee,
      distribution: {
        court: appealFee * 0.5,
        originalWinner: appealFee * 0.5
      }
    };
  }
}

export const settlementService = new SettlementService();