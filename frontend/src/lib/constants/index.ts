// src/lib/constants.ts
// frontend/src/lib/constants/index.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://judgemind-production.up.railway.app';

// Ensure URL has protocol and no trailing slash
export const getApiUrl = () => {
  let url = API_URL;
  
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  return url;
};

export const PRICING = {
  '/api/cases/file': '$10.00',
  '/api/cases/*/judge': '$5.00',
  '/api/precedents/search': '$0.50',
  '/api/precedents/full/*': '$5.00',
  '/api/cases/*/appeal': '$25.00',
  '/api/analytics/report': '$15.00',
  '/api/judge/priority': '$20.00',
  '/api/precedents/bulk': '$50.00'
};
export const CHAIN_ID = 84532; // Base Sepolia
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';