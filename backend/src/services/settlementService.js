// backend/src/services/settlementService.js
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

// backend/src/services/settlementService.js - Update the initiateCaseSettlement method
async initiateCaseSettlement(caseData, verdict) {
  try {
    console.log(`🏛️ Initiating settlement for case ${caseData.id}`);
    
    // Get the existing case wallet
    const caseWalletKey = `case_${caseData.id}`;
    let caseWallet = walletManager.wallets.get(caseWalletKey);
    
    // If wallet doesn't exist in memory, try to create/load it
    if (!caseWallet) {
      console.log(`Wallet not in memory, checking if address exists: ${caseData.caseWalletAddress}`);
      
      // If we have a wallet address stored, use it
      if (caseData.caseWalletAddress && caseData.caseWalletAddress !== 'pending-wallet-creation') {
        // For now, we'll use the stored address directly
        const settlement = {
          caseId: caseData.id,
          verdict,
          escrowAddress: caseData.caseWalletAddress,
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
          requiredAmount: verdict.awardedDamages,
          defendant: caseData.defendant,
          plaintiff: caseData.plaintiff,
          paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          paymentInstructions: {
            network: 'base-sepolia',
            address: caseData.caseWalletAddress,
            amount: `${verdict.awardedDamages} ETH`,
            memo: `Settlement for Case #${caseData.id}`
          }
        };
        
        this.pendingSettlements.set(caseData.id, settlement);
        
        // Save to disk for persistence
        await this.saveSettlementToDisk(caseData.id, settlement);
        
        return {
          settlementId: caseData.id,
          escrowAddress: caseData.caseWalletAddress,
          requiredAmount: verdict.awardedDamages,
          paymentInstructions: settlement.paymentInstructions,
          deadline: settlement.paymentDeadline,
          qrCode: `ethereum:${caseData.caseWalletAddress}?value=${verdict.awardedDamages}`,
          message: `Defendant must deposit ${verdict.awardedDamages} ETH to the settlement wallet`
        };
      } else {
        // Try to create a new wallet
        console.log(`Creating new wallet for case ${caseData.id}`);
        caseWallet = await walletManager.createCaseWallet(caseData.id);
      }
    }
    
    // If we have a wallet object, get its address
    let escrowAddress;
    if (caseWallet) {
      const addressObj = await caseWallet.getDefaultAddress();
      escrowAddress = addressObj.getId();
    } else {
      escrowAddress = caseData.caseWalletAddress;
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
    // Don't throw - return a basic settlement with the case wallet address
    if (caseData.caseWalletAddress && caseData.caseWalletAddress !== 'pending-wallet-creation') {
      return {
        settlementId: caseData.id,
        escrowAddress: caseData.caseWalletAddress,
        requiredAmount: verdict.awardedDamages,
        paymentInstructions: {
          network: 'base-sepolia',
          address: caseData.caseWalletAddress,
          amount: `${verdict.awardedDamages} ETH`,
          memo: `Settlement for Case #${caseData.id}`
        },
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        qrCode: `ethereum:${caseData.caseWalletAddress}?value=${verdict.awardedDamages}`,
        message: `Defendant must deposit ${verdict.awardedDamages} ETH to the settlement wallet`
      };
    }
    throw error;
  }
}

  async initiatePenalty(caseData, judgment) {
    try {
      console.log(`⚖️ Initiating penalty for frivolous case ${caseData.id}`);
      
      // Create penalty wallet
      const penaltyWallet = await walletManager.createCaseWallet(`penalty_${caseData.id}`);
      const penaltyAddress = await penaltyWallet.getDefaultAddress();
      
      const penalty = {
        caseId: caseData.id,
        penaltyType: 'frivolous_lawsuit',
        amount: judgment.penalty,
        payer: caseData.plaintiff,
        paymentAddress: penaltyAddress.getId(),
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: judgment.reasoning,
        distribution: {
          courtTreasury: judgment.penalty * 0.7, // 70% to court
          defendantCompensation: judgment.penalty * 0.3 // 30% to defendant for their trouble
        }
      };
      
      this.penalties.set(caseData.id, penalty);
      
      return {
        penaltyId: `penalty_${caseData.id}`,
        paymentAddress: penaltyAddress.getId(),
        amount: judgment.penalty,
        deadline: penalty.deadline,
        reason: 'Frivolous lawsuit penalty',
        paymentInstructions: {
          network: 'base-sepolia',
          address: penaltyAddress.getId(),
          amount: `${judgment.penalty} ETH`,
          memo: `Penalty for frivolous Case #${caseData.id}`
        },
        qrCode: `ethereum:${penaltyAddress.getId()}?value=${ethers.parseEther(judgment.penalty.toString())}`
      };
    } catch (error) {
      console.error('Penalty initiation error:', error);
      throw error;
    }
  }

// In settlementService.js - Update checkSettlementDeposit method
async checkSettlementDeposit(caseId) {
  const settlement = this.pendingSettlements.get(caseId);
  if (!settlement) throw new Error('Settlement not found');
  
  try {
    // Try to get wallet balance
    let ethBalance = 0;
    
    try {
      const balance = await walletManager.getWalletBalance(`case_${caseId}`);
      ethBalance = parseFloat(balance.ETH || '0');
    } catch (balanceError) {
      console.log(`Could not get balance from wallet manager, using 0`);
      // If we can't get the balance, assume 0 for now
      ethBalance = 0;
    }
    
    console.log(`💰 Case ${caseId} escrow balance: ${ethBalance} ETH`);
    
    // Check if deadline has passed
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
    throw error;
  }
}

  async checkPenaltyDeposit(caseId) {
    const penalty = this.penalties.get(caseId);
    if (!penalty) throw new Error('Penalty not found');
    
    try {
      const balance = await walletManager.getWalletBalance(`penalty_${caseId}`);
      const ethBalance = parseFloat(balance.ETH || '0');
      
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
      throw error;
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
      
      // Prepare distribution
      const totalAmount = parseFloat(settlement.requiredAmount);
      const distributions = [
        {
          recipient: settlement.plaintiff,
          amount: totalAmount * 0.75, // 75% to plaintiff
          reason: 'Damages awarded'
        },
        {
          recipient: process.env.COURT_TREASURY_ADDRESS,
          amount: totalAmount * 0.15, // 15% to court
          reason: 'Court fees'
        },
        {
          recipient: process.env.JURY_POOL_ADDRESS,
          amount: totalAmount * 0.05, // 5% to jury pool
          reason: 'Jury incentives'
        },
        {
          recipient: process.env.PRECEDENT_FUND_ADDRESS,
          amount: totalAmount * 0.05, // 5% to precedent fund
          reason: 'Legal precedent rewards'
        }
      ];
      
      // Execute transfers
      const transactions = [];
      for (const dist of distributions) {
        try {
          const tx = await walletManager.transferFromCaseWallet(
            caseId,
            dist.recipient,
            dist.amount.toString()
          );
          transactions.push({
            to: dist.recipient,
            amount: dist.amount,
            reason: dist.reason,
            txHash: tx.hash,
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
      
      // Update settlement status
      settlement.status = 'distributed';
      settlement.distributedAt = new Date().toISOString();
      settlement.distributions = distributions;
      settlement.transactions = transactions;
      
      // Save updated settlement to disk
      await this.saveSettlementToDisk(caseId, settlement);
      
      // Remove from memory and disk after successful distribution
      this.pendingSettlements.delete(caseId);
      await this.removeSettlementFromDisk(caseId);
      
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
          recipient: process.env.COURT_TREASURY_ADDRESS,
          amount: penalty.distribution.courtTreasury,
          reason: 'Court penalty fees'
        },
        {
          recipient: penalty.defendantAddress,
          amount: penalty.distribution.defendantCompensation,
          reason: 'Compensation for frivolous lawsuit'
        }
      ];
      
      const transactions = [];
      for (const dist of distributions) {
        try {
          const tx = await walletManager.transferFromCaseWallet(
            `penalty_${caseId}`,
            dist.recipient,
            dist.amount.toString()
          );
          transactions.push({
            to: dist.recipient,
            amount: dist.amount,
            reason: dist.reason,
            txHash: tx.hash,
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
      const depositStatus = await this.checkSettlementDeposit(caseId);
      
      return {
        ...settlement,
        currentBalance: depositStatus.balance,
        remainingAmount: depositStatus.remaining,
        isFullyFunded: depositStatus.funded,
        deadlinePassed: depositStatus.deadlinePassed,
        daysRemaining: depositStatus.daysRemaining
      };
    }
    
    return settlement;
  }

  async getPenaltyStatus(caseId) {
    const penalty = this.penalties.get(caseId);
    if (!penalty) return null;
    
    if (penalty.status === 'pending_payment') {
      const depositStatus = await this.checkPenaltyDeposit(caseId);
      
      return {
        ...penalty,
        currentBalance: depositStatus.balance,
        remainingAmount: depositStatus.remaining,
        isPaid: depositStatus.paid,
        deadlinePassed: depositStatus.deadlinePassed,
        daysRemaining: depositStatus.daysRemaining
      };
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