// src/lib/constants.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://judgemind-production.up.railway.app';

// Remove any trailing slashes
export const getApiUrl = () => {
  const url = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  return url;
};
export const CHAIN_ID = 84532; // Base Sepolia
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';