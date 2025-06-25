import { walletManager } from './walletManager.js';
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SettlementService {
  constructor() {
    this.pendingSettlements = new Map();
    this.penalties = new Map();
    this.appealSettlements = new Map();
    this.settlementsDir = path.join(process.cwd(), 'data', 'settlements');
    this.initialize();
  }

  async initialize() {
    try {
      await fs.mkdir(this.settlementsDir, { recursive: true });
      console.log(`📁 Settlements directory created/verified: ${this.settlementsDir}`);
      await this.loadSettlementsFromDisk();
      console.log('✅ Settlement service initialized');
    } catch (error) {
      console.error('❌ Settlement service initialization error:', error);
    }
  }

  async loadSettlementsFromDisk() {
    try {
      const files = await fs.readdir(this.settlementsDir);
      console.log(`📁 Found ${files.length} files in settlements directory:`, files);
      
      const settlementFiles = files.filter(f => f.startsWith('settlement_') && f.endsWith('.json'));
      console.log(`📄 Found ${settlementFiles.length} settlement files:`, settlementFiles);
      
      for (const file of settlementFiles) {
        try {
          const caseId = file.replace('settlement_', '').replace('.json', '');
          const data = await fs.readFile(path.join(this.settlementsDir, file), 'utf8');
          const settlement = JSON.parse(data);
          this.pendingSettlements.set(caseId, settlement);
          console.log(`✅ Loaded settlement for case ${caseId}`);
        } catch (e) {
          console.error(`Error loading settlement file ${file}:`, e);
        }
      }
      
      console.log(`📁 Loaded ${this.pendingSettlements.size} settlements from disk`);
      console.log(`📋 Settlement case IDs in memory:`, Array.from(this.pendingSettlements.keys()));
    } catch (error) {
      console.log('No existing settlements found on disk:', error.message);
    }
  }

  async saveSettlementToDisk(caseId, settlement) {
    try {
      const filePath = path.join(this.settlementsDir, `settlement_${caseId}.json`);
      await fs.writeFile(filePath, JSON.stringify(settlement, null, 2));
    } catch (error) {
      console.error(`Error saving settlement for case ${caseId}:`, error);
    }
  }

  async removeSettlementFromDisk(caseId) {
    try {
      const filePath = path.join(this.settlementsDir, `settlement_${caseId}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, which is fine
    }
  }

  async initiateCaseSettlement(caseData, verdict) {
    try {
      console.log(`🏛️ Initiating settlement for case ${caseData.id}`);
      
      // Get wallet address - handle all cases gracefully
      let escrowAddress = caseData.caseWalletAddress;
      
      // Check if wallet manager is ready and try to get/create wallet
      if (walletManager.isReady()) {
        const caseWalletKey = `case_${caseData.id}`;
        let caseWallet = walletManager.wallets.get(caseWalletKey);
        
        if (!caseWallet && escrowAddress && escrowAddress.startsWith('0x')) {
          // We have a valid address but no wallet object - that's okay
          console.log(`Using existing wallet address: ${escrowAddress}`);
        } else if (!caseWallet) {
          // Try to create a new wallet
          try {
            caseWallet = await walletManager.createCaseWallet(caseData.id);
            if (caseWallet && caseWallet.getDefaultAddress) {
              const addressObj = await caseWallet.getDefaultAddress();
              escrowAddress = addressObj.getId ? addressObj.getId() : escrowAddress;
            }
          } catch (walletError) {
            console.warn('Could not create wallet:', walletError.message);
          }
        } else if (caseWallet && caseWallet.getDefaultAddress) {
          // We have a wallet object, get its address
          try {
            const addressObj = await caseWallet.getDefaultAddress();
            escrowAddress = addressObj.getId ? addressObj.getId() : escrowAddress;
          } catch (addressError) {
            console.warn('Could not get wallet address:', addressError.message);
          }
        }
      }
      
      // Ensure we have some address (even if it's a placeholder)
      if (!escrowAddress || escrowAddress === 'pending-wallet-creation' || 
          escrowAddress === '0x0000000000000000000000000000000000000000') {
        // Use a more realistic mock address
        escrowAddress = `0x${caseData.id.padStart(40, '0').slice(-40)}`;
        console.warn(`Using placeholder address: ${escrowAddress}`);
      }
      
      // Create settlement record
      const settlement = {
        caseId: caseData.id,
        verdict,
        escrowAddress: escrowAddress,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        requiredAmount: verdict.awardedDamages,
        defendant: caseData.defendant,
        plaintiff: caseData.plaintiff,
        paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        paymentInstructions: {
          network: 'base-sepolia',
          address: escrowAddress,
          amount: `${verdict.awardedDamages} ETH`,
          memo: `Settlement for Case #${caseData.id}`
        }
      };
      
      this.pendingSettlements.set(caseData.id, settlement);
      
      // Save to disk for persistence
      await this.saveSettlementToDisk(caseData.id, settlement);
      
      return {
        settlementId: caseData.id,
        escrowAddress: escrowAddress,
        requiredAmount: verdict.awardedDamages,
        paymentInstructions: settlement.paymentInstructions,
        deadline: settlement.paymentDeadline,
        qrCode: `ethereum:${escrowAddress}?value=${verdict.awardedDamages}`,
        message: `Defendant must deposit ${verdict.awardedDamages} ETH to the settlement wallet`
      };
    } catch (error) {
      console.error('Settlement initiation error:', error);
      
      // Always return a settlement object, even on error
      const fallbackAddress = caseData.caseWalletAddress || `0x${caseData.id.padStart(40, '0').slice(-40)}`;
      return {
        settlementId: caseData.id,
        escrowAddress: fallbackAddress,
        requiredAmount: verdict.awardedDamages,
        paymentInstructions: {
          network: 'base-sepolia',
          address: fallbackAddress,
          amount: `${verdict.awardedDamages} ETH`,
          memo: `Settlement for Case #${caseData.id}`
        },
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        qrCode: `ethereum:${fallbackAddress}?value=${verdict.awardedDamages}`,
        message: `Defendant must deposit ${verdict.awardedDamages} ETH to the settlement wallet`,
        warning: 'Settlement created with limited wallet functionality'
      };
    }
  }

  async initiatePenalty(caseData, judgment) {
    try {
      console.log(`⚖️ Initiating penalty for frivolous case ${caseData.id}`);
      
      let penaltyAddress = `0x${('penalty' + caseData.id).padStart(40, '0').slice(-40)}`;
      
      // Try to create penalty wallet if wallet manager is ready
      if (walletManager.isReady()) {
        try {
          const penaltyWallet = await walletManager.createCaseWallet(`penalty_${caseData.id}`);
          if (penaltyWallet && penaltyWallet.getDefaultAddress) {
            const addressObj = await penaltyWallet.getDefaultAddress();
            penaltyAddress = addressObj.getId ? addressObj.getId() : penaltyAddress;
          }
        } catch (walletError) {
          console.warn('Could not create penalty wallet:', walletError.message);
        }
      }
      
      const penalty = {
        caseId: caseData.id,
        penaltyType: 'frivolous_lawsuit',
        amount: judgment.penalty,
        payer: caseData.plaintiff,
        paymentAddress: penaltyAddress,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: judgment.reasoning,
        distribution: {
          courtTreasury: judgment.penalty * 0.7,
          defendantCompensation: judgment.penalty * 0.3
        }
      };
      
      this.penalties.set(caseData.id, penalty);
      
      return {
        penaltyId: `penalty_${caseData.id}`,
        paymentAddress: penaltyAddress,
        amount: judgment.penalty,
        deadline: penalty.deadline,
        reason: 'Frivolous lawsuit penalty',
        paymentInstructions: {
          network: 'base-sepolia',
          address: penaltyAddress,
          amount: `${judgment.penalty} ETH`,
          memo: `Penalty for frivolous Case #${caseData.id}`
        },
        qrCode: `ethereum:${penaltyAddress}?value=${judgment.penalty}`
      };
    } catch (error) {
      console.error('Penalty initiation error:', error);
      throw error;
    }
  }

  async checkSettlementDeposit(caseId) {
    const settlement = this.pendingSettlements.get(caseId);
    if (!settlement) throw new Error('Settlement not found');
    
    try {
      let ethBalance = 0;
      
      if (walletManager.isReady()) {
        try {
          const balance = await walletManager.getWalletBalance(`case_${caseId}`);
          ethBalance = parseFloat(balance.ETH || '0');
        } catch (balanceError) {
          console.log(`Could not get balance from wallet manager:`, balanceError.message);
        }
      }
      
      console.log(`💰 Case ${caseId} escrow balance: ${ethBalance} ETH`);
      
      const deadlinePassed = new Date() > new Date(settlement.paymentDeadline);
      
      if (parseFloat(ethBalance) >= parseFloat(settlement.requiredAmount)) {
        settlement.status = 'funded';
        settlement.depositedAmount = ethBalance;
        settlement.depositedAt = new Date().toISOString();
        
        return {
          funded: true,
          balance: ethBalance,
          required: settlement.requiredAmount,
          canDistribute: true,
          deadlinePassed: false
        };
      }
      
      return {
        funded: false,
        balance: ethBalance,
        required: settlement.requiredAmount,
        remaining: parseFloat(settlement.requiredAmount) - parseFloat(ethBalance),
        deadlinePassed,
        daysRemaining: deadlinePassed ? 0 : Math.ceil((new Date(settlement.paymentDeadline) - new Date()) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      console.error('Balance check error:', error);
      return {
        funded: false,
        balance: 0,
        required: settlement.requiredAmount,
        remaining: parseFloat(settlement.requiredAmount),
        deadlinePassed: new Date() > new Date(settlement.paymentDeadline),
        daysRemaining: Math.max(0, Math.ceil((new Date(settlement.paymentDeadline) - new Date()) / (1000 * 60 * 60 * 24))),
        error: error.message
      };
    }
  }

  async checkPenaltyDeposit(caseId) {
    const penalty = this.penalties.get(caseId);
    if (!penalty) throw new Error('Penalty not found');
    
    try {
      let ethBalance = 0;
      
      if (walletManager.isReady()) {
        try {
          const balance = await walletManager.getWalletBalance(`penalty_${caseId}`);
          ethBalance = parseFloat(balance.ETH || '0');
        } catch (balanceError) {
          console.log('Could not get penalty balance:', balanceError.message);
        }
      }
      
      const deadlinePassed = new Date() > new Date(penalty.deadline);
      
      if (ethBalance >= penalty.amount) {
        penalty.status = 'paid';
        penalty.paidAt = new Date().toISOString();
        
        return {
          paid: true,
          balance: ethBalance,
          required: penalty.amount
        };
      }
      
      return {
        paid: false,
        balance: ethBalance,
        required: penalty.amount,
        remaining: penalty.amount - ethBalance,
        deadlinePassed,
        daysRemaining: deadlinePassed ? 0 : Math.ceil((new Date(penalty.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      console.error('Penalty balance check error:', error);
      return {
        paid: false,
        balance: 0,
        required: penalty.amount,
        remaining: penalty.amount,
        deadlinePassed: new Date() > new Date(penalty.deadline),
        daysRemaining: 0,
        error: error.message
      };
    }
  }

  async executeSettlement(caseId) {
    const settlement = this.pendingSettlements.get(caseId);
    if (!settlement) throw new Error('Settlement not found');
    
    if (settlement.status !== 'funded') {
      throw new Error('Settlement not fully funded');
    }
    
    try {
      console.log(`⚖️ Executing settlement for case ${caseId}`);
      
      const totalAmount = parseFloat(settlement.requiredAmount);
      const distributions = [
        {
          recipient: settlement.plaintiff,
          amount: totalAmount * 0.75,
          reason: 'Damages awarded'
        },
        {
          recipient: process.env.COURT_TREASURY_ADDRESS || '0x1234567890123456789012345678901234567890',
          amount: totalAmount * 0.15,
          reason: 'Court fees'
        },
        {
          recipient: process.env.JURY_POOL_ADDRESS || '0x1234567890123456789012345678901234567891',
          amount: totalAmount * 0.05,
          reason: 'Jury incentives'
        },
        {
          recipient: process.env.PRECEDENT_FUND_ADDRESS || '0x1234567890123456789012345678901234567892',
          amount: totalAmount * 0.05,
          reason: 'Legal precedent rewards'
        }
      ];
      
      const transactions = [];
      
      // If wallet manager is ready, try to execute transfers
      if (walletManager.isReady()) {
        for (const dist of distributions) {
          try {
            const tx = await walletManager.transferFunds(
              `case_${caseId}`,
              dist.recipient,
              dist.amount.toString()
            );
            transactions.push({
              to: dist.recipient,
              amount: dist.amount,
              reason: dist.reason,
              txHash: tx.getTransactionHash ? tx.getTransactionHash() : 'pending',
              status: 'completed'
            });
          } catch (error) {
            console.error(`Failed to transfer to ${dist.recipient}:`, error);
            transactions.push({
              to: dist.recipient,
              amount: dist.amount,
              reason: dist.reason,
              error: error.message,
              status: 'failed'
            });
          }
        }
      } else {
        // Wallet system not ready - simulate distributions
        console.warn('⚠️ Wallet system not ready - simulating settlement distribution');
        for (const dist of distributions) {
          transactions.push({
            to: dist.recipient,
            amount: dist.amount,
            reason: dist.reason,
            txHash: 'simulated-' + Date.now(),
            status: 'simulated'
          });
        }
      }
      
      // Update settlement status
      settlement.status = 'distributed';
      settlement.distributedAt = new Date().toISOString();
      settlement.distributions = distributions;
      settlement.transactions = transactions;
      
      // Save updated settlement to disk
      await this.saveSettlementToDisk(caseId, settlement);
      
      return {
        success: true,
        caseId,
        distributions,
        transactions,
        completedAt: settlement.distributedAt
      };
    } catch (error) {
      console.error('Settlement execution error:', error);
      settlement.status = 'distribution_failed';
      settlement.error = error.message;
      
      // Save error status to disk
      await this.saveSettlementToDisk(caseId, settlement);
      
      throw error;
    }
  }

  async executePenaltyDistribution(caseId) {
    const penalty = this.penalties.get(caseId);
    if (!penalty) throw new Error('Penalty not found');
    
    if (penalty.status !== 'paid') {
      throw new Error('Penalty not paid');
    }
    
    try {
      console.log(`💸 Distributing penalty for case ${caseId}`);
      
      const distributions = [
        {
          recipient: process.env.COURT_TREASURY_ADDRESS || '0x1234567890123456789012345678901234567890',
          amount: penalty.distribution.courtTreasury,
          reason: 'Court penalty fees'
        },
        {
          recipient: penalty.defendantAddress || '0x0000000000000000000000000000000000000000',
          amount: penalty.distribution.defendantCompensation,
          reason: 'Compensation for frivolous lawsuit'
        }
      ];
      
      const transactions = [];
      
      if (walletManager.isReady()) {
        for (const dist of distributions) {
          try {
            const tx = await walletManager.transferFunds(
              `penalty_${caseId}`,
              dist.recipient,
              dist.amount.toString()
            );
            transactions.push({
              to: dist.recipient,
              amount: dist.amount,
              reason: dist.reason,
              txHash: tx.getTransactionHash ? tx.getTransactionHash() : 'pending',
              status: 'completed'
            });
          } catch (error) {
            transactions.push({
              to: dist.recipient,
              amount: dist.amount,
              reason: dist.reason,
              error: error.message,
              status: 'failed'
            });
          }
        }
      } else {
        // Simulate distributions
        for (const dist of distributions) {
          transactions.push({
            to: dist.recipient,
            amount: dist.amount,
            reason: dist.reason,
            txHash: 'simulated-' + Date.now(),
            status: 'simulated'
          });
        }
      }
      
      penalty.status = 'distributed';
      penalty.distributedAt = new Date().toISOString();
      penalty.transactions = transactions;
      
      return {
        success: true,
        distributions,
        transactions
      };
    } catch (error) {
      console.error('Penalty distribution error:', error);
      penalty.status = 'distribution_failed';
      throw error;
    }
  }

  async getSettlementStatus(caseId) {
    console.log(`🔍 Checking settlement status for case ${caseId}`);
    console.log(`📋 Settlements in memory:`, Array.from(this.pendingSettlements.keys()));
    
    const settlement = this.pendingSettlements.get(caseId);
    if (!settlement) {
      console.log(`❌ No settlement found in memory for case ${caseId}`);
      return null;
    }
    
    console.log(`✅ Found settlement for case ${caseId}:`, settlement);
    
    // Check current balance if not yet distributed
    if (settlement.status === 'pending_payment' || settlement.status === 'funded') {
      try {
        const depositStatus = await this.checkSettlementDeposit(caseId);
        
        return {
          ...settlement,
          currentBalance: depositStatus.balance,
          remainingAmount: depositStatus.remaining,
          isFullyFunded: depositStatus.funded,
          deadlinePassed: depositStatus.deadlinePassed,
          daysRemaining: depositStatus.daysRemaining
        };
      } catch (error) {
        console.error('Error checking deposit status:', error);
        return {
          ...settlement,
          currentBalance: 0,
          remainingAmount: settlement.requiredAmount,
          isFullyFunded: false,
          error: error.message
        };
      }
    }
    
    return settlement;
  }

  async getPenaltyStatus(caseId) {
    const penalty = this.penalties.get(caseId);
    if (!penalty) return null;
    
    if (penalty.status === 'pending_payment') {
      try {
        const depositStatus = await this.checkPenaltyDeposit(caseId);
        
        return {
          ...penalty,
          currentBalance: depositStatus.balance,
          remainingAmount: depositStatus.remaining,
          isPaid: depositStatus.paid,
          deadlinePassed: depositStatus.deadlinePassed,
          daysRemaining: depositStatus.daysRemaining
        };
      } catch (error) {
        return {
          ...penalty,
          currentBalance: 0,
          remainingAmount: penalty.amount,
          isPaid: false,
          error: error.message
        };
      }
    }
    
    return penalty;
  }

  async processAppealSettlement(caseId, appealDecision, originalJudgment) {
    try {
      console.log(`⚖️ Processing appeal settlement for case ${caseId}`);
      
      // If appeal modifies damages
      if (appealDecision.decision === 'modified' && appealDecision.newAwardedDamages !== undefined) {
        const difference = originalJudgment.awardedDamages - appealDecision.newAwardedDamages;
        
        if (difference > 0) {
          // Refund difference to defendant
          const refund = {
            caseId,
            type: 'appeal_refund',
            amount: difference,
            recipient: 'defendant',
            reason: 'Appeal granted - damages reduced',
            status: 'pending'
          };
          
          this.appealSettlements.set(`appeal_${caseId}`, refund);
          
          return {
            type: 'refund',
            amount: difference,
            recipient: 'defendant',
            message: `Appeal granted. ${difference} ETH to be refunded to defendant.`
          };
        }
      }
      
      // If appeal overturns guilty verdict
      if (appealDecision.decision === 'overturned' && appealDecision.newVerdict === 'not_guilty') {
        const fullRefund = {
          caseId,
          type: 'appeal_full_refund',
          amount: originalJudgment.awardedDamages,
          recipient: 'defendant',
          reason: 'Appeal granted - verdict overturned',
          status: 'pending'
        };
        
        this.appealSettlements.set(`appeal_${caseId}`, fullRefund);
        
        return {
          type: 'full_refund',
          amount: originalJudgment.awardedDamages,
          recipient: 'defendant',
          message: 'Appeal granted - verdict overturned. Full amount to be refunded.'
        };
      }
      
      return {
        type: 'no_change',
        message: 'Appeal processed but no settlement changes required.'
      };
    } catch (error) {
      console.error('Appeal settlement error:', error);
      throw error;
    }
  }
}

export const settlementService = new SettlementService();