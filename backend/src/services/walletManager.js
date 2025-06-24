import { Wallet } from "@coinbase/coinbase-sdk";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WalletManager {
  constructor() {
    this.wallets = new Map();
    this.walletsDir = path.join(process.cwd(), 'wallets');
    this.initialized = false;
    this.deploymentInfo = this.loadDeploymentInfo();
  }

  loadDeploymentInfo() {
    try {
      const deploymentPath = path.join(process.cwd(), 'deployment-info.json');
      const data = readFileSync(deploymentPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('⚠️  Could not load deployment-info.json, using environment variables');
      return {
        walletSeeds: {
          courtTreasury: process.env.TREASURY_SEED || "5c4fb5f8-f578-42c4-9173-9ede02bad5ad",
          juryPool: process.env.JURY_POOL_SEED || "3eb9f183-f0a4-4c7e-a192-a60bd1894b2e",
          precedentFund: process.env.PRECEDENT_FUND_SEED || "f11bbce1-ca2b-4fe5-a612-376fc8b9e9e0",
          aiJudge: process.env.AI_JUDGE_SEED || "f0f9ce7a-7d63-4d74-be97-f1c78a8a7172"
        }
      };
    }
  }

  // Map wallet names to deployment-info seed names
  getSeedForWallet(walletName) {
    const seedMapping = {
      'treasury': 'courtTreasury',
      'escrow': 'courtTreasury', // Use same as treasury for now
      'juryPool': 'juryPool', 
      'precedentFund': 'precedentFund'
    };
    
    const seedKey = seedMapping[walletName];
    if (!seedKey) return null;
    
    const seed = this.deploymentInfo?.walletSeeds?.[seedKey];
    console.log(`🔑 Using seed for ${walletName}: ${seed ? '✅ Found' : '❌ Missing'}`);
    return seed;
  }

  async initialize() {
    try {
      // Create wallets directory if it doesn't exist
      await fs.mkdir(this.walletsDir, { recursive: true });
      
      // Load or create system wallets
      console.log('🏦 Initializing wallet system...');
      console.log('📋 Available seeds:', Object.keys(this.deploymentInfo?.walletSeeds || {}));
      
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
      
      console.log(`✅ Loaded existing ${walletName} wallet`);
      return wallet;
    } catch (error) {
      // Create new wallet if doesn't exist
      console.log(`🆕 Creating new ${walletName} wallet...`);
      
      const seed = this.getSeedForWallet(walletName);
      let wallet;
      
      if (seed) {
        try {
          console.log(`🌱 Using predefined seed for ${walletName}`);
          
          // Try different seed formats that Coinbase SDK might expect
          const seedFormats = [
            seed,                                    // Original UUID format
            seed.replace(/-/g, ''),                 // Remove dashes
            `0x${seed.replace(/-/g, '')}`,          // Hex prefix
            Buffer.from(seed.replace(/-/g, ''), 'hex').toString('base64'), // Base64
            seed.padEnd(64, '0'),                   // Pad to 64 chars
          ];
          
          for (const seedFormat of seedFormats) {
            try {
              console.log(`🔄 Trying seed format for ${walletName}...`);
              wallet = await Wallet.createWithSeed({
                networkId: "base-sepolia",
                seed: seedFormat
              });
              console.log(`✅ Success with seed format for ${walletName}`);
              break;
            } catch (seedError) {
              console.log(`❌ Seed format failed for ${walletName}:`, seedError.message);
              continue;
            }
          }
          
          if (!wallet) {
            throw new Error('All seed formats failed');
          }
          
        } catch (seedError) {
          console.warn(`⚠️  Seed creation failed for ${walletName}, falling back to random wallet`);
          console.error('Seed error details:', seedError);
          wallet = await Wallet.create({ networkId: "base-sepolia" });
        }
      } else {
        console.log(`🎲 No seed found for ${walletName}, creating random wallet`);
        wallet = await Wallet.create({ networkId: "base-sepolia" });
      }
      
      // Save wallet metadata
      const walletData = {
        walletId: wallet.getId(),
        name: walletName,
        createdAt: new Date().toISOString(),
        usedSeed: !!seed,
        seedSource: seed ? 'deployment-info' : 'random'
      };
      
      await fs.writeFile(walletPath, JSON.stringify(walletData, null, 2));
      
      // Save wallet seed separately
      await wallet.saveSeedToFile(seedPath, true); // Encrypted
      
      console.log(`✅ Created ${walletName} wallet: ${wallet.getId()}`);
      return wallet;
    }
  }

  async createCaseWallet(caseId) {
    const walletName = `case_${caseId}`;
    
    // Case wallets don't need seeds - they're one-time use
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
      createdAt: new Date().toISOString(),
      type: 'case-wallet'
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
      cases: [],
      deploymentInfo: {
        seedsAvailable: !!this.deploymentInfo?.walletSeeds,
        seedKeys: Object.keys(this.deploymentInfo?.walletSeeds || {})
      }
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