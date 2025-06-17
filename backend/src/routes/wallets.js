import express from 'express';
import { walletManager } from '../services/walletManager.js';
import { verifyPayment } from '../middleware/x402pay.js';

const router = express.Router();

/**
 * Get system wallet addresses
 */
router.get('/system', async (req, res) => {
  try {
    const addresses = await walletManager.getSystemWalletAddresses();
    
    res.json({
      success: true,
      wallets: addresses,
      network: "base-sepolia"
    });
    
  } catch (error) {
    console.error('System wallet error:', error);
    res.status(500).json({ error: "Failed to get system wallets" });
  }
});

/**
 * Get all wallet balances
 */
router.get('/balances', async (req, res) => {
  try {
    const info = await walletManager.exportWalletInfo();
    
    res.json({
      success: true,
      system: info.system,
      cases: info.cases,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: "Failed to get balances" });
  }
});

/**
 * Fund a wallet from faucet (testnet only)
 */
router.post('/fund/:walletName', verifyPayment, async (req, res) => {
  try {
    const { walletName } = req.params;
    
    if (!['treasury', 'escrow', 'juryPool', 'precedentFund'].includes(walletName)) {
      return res.status(400).json({ error: "Invalid wallet name" });
    }
    
    const result = await walletManager.fundWallet(walletName, 'faucet');
    
    res.json({
      success: true,
      wallet: walletName,
      transaction: result.getTransactionHash(),
      message: "Faucet funds requested"
    });
    
  } catch (error) {
    console.error('Funding error:', error);
    res.status(500).json({ error: "Failed to fund wallet" });
  }
});

/**
 * Transfer funds between wallets
 */
router.post('/transfer', verifyPayment, async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    
    const result = await walletManager.transferFunds(from, to, amount);
    
    res.json({
      success: true,
      transaction: result.getTransactionHash(),
      from,
      to,
      amount
    });
    
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: "Failed to transfer funds" });
  }
});

export default router;