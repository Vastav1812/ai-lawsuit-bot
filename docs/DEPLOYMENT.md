# Deployment Guide

This document provides step-by-step instructions for deploying the AI Lawsuit Bot project.

## Prerequisites
- Node.js and npm
- Environment variables for backend and frontend
- Access to Base Sepolia testnet (or mainnet)
- (Optional) Smart contract deployment tools (e.g., Hardhat)

## Backend Setup
1. Install dependencies: `npm install`
2. Configure `.env` file with required variables (see example in backend directory)
3. Run backend server: `npm start` or `npm run dev`

## Frontend Setup
1. Install dependencies: `npm install`
2. Configure `.env.local` with required variables (see example in frontend directory)
3. Run frontend: `npm run dev`

## Smart Contract Deployment
- Use Hardhat scripts in `backend/contracts` if you need to deploy contracts
- Update contract addresses in backend config

## Troubleshooting
- Check logs for errors
- Ensure all environment variables are set
- Verify blockchain network connectivity 