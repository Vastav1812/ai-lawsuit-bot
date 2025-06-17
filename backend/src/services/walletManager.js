import { Wallet } from "@coinbase/coinbase-sdk";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WalletManager {
  constructor() {
    this.wallets = new Map();
    this.walletsDir = path.join(__dirname, '../../wallets');
    this.initialized = false;
  }

  async initialize() {
    try {
      // Create wallets directory if it doesn't exist
      await fs.mkdir(this.walletsDir, { recursive: true });
      
      // Load or create system wallets
      console.log('🏦 Initializing wallet system...');
      
      this.wallets.set('treasury', await this.loadOrCreateWallet('treasury'));
      this.wallets.set('escrow', await this.loadOrCreateWallet('escrow'));
      this.wallets.set('juryPool', await this.loadOrCreateWallet('juryPool'));
      this.wallets.set('precedentFund', await this.loadOrCreateWallet('precedentFund'));
      
      // Log wallet addresses
      console.log('✅ System wallets initialized:');
      for (const [name, wallet] of this.wallets) {
        const address = await wallet.getDefaultAddress();
        console.log(`   ${name}: ${address}`);
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Wallet initialization error:', error);
      throw error;
    }
  }

  async loadOrCreateWallet(walletName) {
    const walletPath = path.join(this.walletsDir, `${walletName}.json`);
    const seedPath = path.join(this.walletsDir, `${walletName}.seed`);
    
    try {
      // Try to load existing wallet
      console.log(`📂 Loading existing ${walletName} wallet...`);
      const walletData = await fs.readFile(walletPath, 'utf8');
      const { walletId } = JSON.parse(walletData);
      
      const wallet = await Wallet.fetch(walletId);
      await wallet.loadSeedFromFile(seedPath);
      
      return wallet;
    } catch (error) {
      // Create new wallet if doesn't exist
      console.log(`🆕 Creating new ${walletName} wallet...`);
      const wallet = await Wallet.create({ networkId: "base-sepolia" });
      
      // Save wallet metadata
      const walletData = {
        walletId: wallet.getId(),
        name: walletName,
        createdAt: new Date().toISOString()
      };
      
      await fs.writeFile(walletPath, JSON.stringify(walletData, null, 2));
      
      // Save wallet seed separately
      await wallet.saveSeedToFile(seedPath, true); // Encrypted
      
      return wallet;
    }
  }

  async createCaseWallet(caseId) {
    const walletName = `case_${caseId}`;
    const wallet = await Wallet.create({ networkId: "base-sepolia" });
    
    this.wallets.set(walletName, wallet);
    
    // Save case wallet info
    const caseWalletPath = path.join(this.walletsDir, 'cases', `${walletName}.json`);
    const caseSeedPath = path.join(this.walletsDir, 'cases', `${walletName}.seed`);
    await fs.mkdir(path.dirname(caseWalletPath), { recursive: true });
    
    const walletData = {
      walletId: wallet.getId(),
      caseId,
      address: await wallet.getDefaultAddress(),
      createdAt: new Date().toISOString()
    };
    
    await fs.writeFile(caseWalletPath, JSON.stringify(walletData, null, 2));
    await wallet.saveSeedToFile(caseSeedPath, true);
    
    return wallet;
  }

  async getWalletBalance(walletName) {
    const wallet = this.wallets.get(walletName);
    if (!wallet) throw new Error(`Wallet ${walletName} not found`);
    
    const balances = await wallet.getBalances();
    return balances;
  }

  async fundWallet(walletName, amount) {
    const wallet = this.wallets.get(walletName);
    if (!wallet) throw new Error(`Wallet ${walletName} not found`);
    
    // For testnet, use faucet
    if (amount === 'faucet') {
      console.log(`🚰 Requesting faucet funds for ${walletName}...`);
      const faucetTx = await wallet.faucet();
      console.log(`✅ Faucet transaction: ${faucetTx.getTransactionHash()}`);
      return faucetTx;
    }
    
    // For production, would implement actual funding logic
    throw new Error('Manual funding not implemented yet');
  }

  async transferFunds(fromWallet, toAddress, amount, assetId = 'eth') {
    const wallet = this.wallets.get(fromWallet);
    if (!wallet) throw new Error(`Wallet ${fromWallet} not found`);
    
    console.log(`💸 Transferring ${amount} ${assetId} from ${fromWallet} to ${toAddress}`);
    
    const transfer = await wallet.createTransfer({
      amount: amount,
      assetId: assetId,
      destination: toAddress,
      gasless: false // Set to true for gasless transfers
    });
    
    await transfer.wait();
    console.log(`✅ Transfer complete: ${transfer.getTransactionHash()}`);
    
    return transfer;
  }

  async distributeSettlement(caseId, verdict) {
    const caseWallet = this.wallets.get(`case_${caseId}`);
    if (!caseWallet) throw new Error(`Case wallet ${caseId} not found`);
    
    const totalAmount = verdict.awardedDamages;
    
    // Calculate distributions (matching smart contract percentages)
    const distributions = {
      plaintiff: totalAmount * 0.75,      // 75% to plaintiff
      courtFee: totalAmount * 0.15,       // 15% to court
      juryPool: totalAmount * 0.05,       // 5% to jury
      precedentFund: totalAmount * 0.05   // 5% to precedent fund
    };
    
    console.log(`⚖️ Distributing settlement for case ${caseId}:`);
    console.log(`   Total: ${totalAmount} ETH`);
    console.log(`   Plaintiff: ${distributions.plaintiff} ETH`);
    console.log(`   Court: ${distributions.courtFee} ETH`);
    
    const transfers = [];
    
    // Transfer to plaintiff
    if (verdict.plaintiffAddress) {
      transfers.push(
        this.transferFunds(
          `case_${caseId}`,
          verdict.plaintiffAddress,
          distributions.plaintiff
        )
      );
    }
    
    // Transfer to court treasury
    const treasuryAddress = await this.wallets.get('treasury').getDefaultAddress();
    transfers.push(
      this.transferFunds(
        `case_${caseId}`,
        treasuryAddress,
        distributions.courtFee
      )
    );
    
    // Transfer to jury pool
    const juryAddress = await this.wallets.get('juryPool').getDefaultAddress();
    transfers.push(
      this.transferFunds(
        `case_${caseId}`,
        juryAddress,
        distributions.juryPool
      )
    );
    
    // Transfer to precedent fund
    const precedentAddress = await this.wallets.get('precedentFund').getDefaultAddress();
    transfers.push(
      this.transferFunds(
        `case_${caseId}`,
        precedentAddress,
        distributions.precedentFund
      )
    );
    
    // Execute all transfers
    const results = await Promise.all(transfers);
    
    return {
      caseId,
      distributions,
      transactions: results.map(t => t.getTransactionHash())
    };
  }

  async getSystemWalletAddresses() {
    const addresses = {};
    
    for (const [name, wallet] of this.wallets) {
      if (['treasury', 'escrow', 'juryPool', 'precedentFund'].includes(name)) {
        addresses[name] = await wallet.getDefaultAddress();
      }
    }
    
    return addresses;
  }

  async exportWalletInfo() {
    const info = {
      system: {},
      cases: []
    };
    
    for (const [name, wallet] of this.wallets) {
      const address = await wallet.getDefaultAddress();
      const balances = await wallet.getBalances();
      
      if (name.startsWith('case_')) {
        info.cases.push({
          name,
          address,
          balances
        });
      } else {
        info.system[name] = {
          address,
          balances
        };
      }
    }
    
    return info;
  }
}

// Create singleton instance
export const walletManager = new WalletManager();