# 🚀 AI Lawsuit Bot - Deployment Guide

## 📋 Prerequisites

- [GitHub Account](https://github.com)
- [Vercel Account](https://vercel.com) (Free tier available)
- [Railway Account](https://railway.app) (Free tier available)
- [Coinbase Cloud Account](https://cloud.coinbase.com)
- [AWS Account](https://aws.amazon.com) (for Bedrock AI)

## 🎯 Deployment Strategy

### Frontend: Vercel
- **Framework**: Next.js 13+ (optimized)
- **Domain**: Custom domain support
- **SSL**: Automatic HTTPS
- **CDN**: Global edge network

### Backend: Railway
- **Runtime**: Node.js 20
- **Database**: PostgreSQL
- **Storage**: Persistent volumes
- **Scaling**: Auto-scaling

## 📦 Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Environment Variables
Create these files in your repository:

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

#### Backend (.env.production)
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=eu-north-1
BEDROCK_MODEL_ID=arn:aws:bedrock:eu-north-1:500746600818:inference-profile/eu.amazon.nova-micro-v1:0
USE_FALLBACK_AI=true

# Blockchain Configuration
NETWORK=base-sepolia
BASE_SEPOLIA_RPC=https://sepolia.base.org
PRIVATE_KEY=your_private_key

# Court System Addresses
COURT_CONTRACT_ADDRESS=0x0B4d7c01105DD615EFD404b0C8d0d7b84dE596a0
COURT_TREASURY_ADDRESS=0x1df1a76d28fA28715D39EB2bE58c40af07075F63
JURY_POOL_ADDRESS=0xe4b665E8cCb6bd327B70BDdD58014a54A29807fa
PRECEDENT_FUND_ADDRESS=0x1A8f01AFbbdafA6C801a66c60a0c2179269eDC81
AI_JUDGE_ADDRESS=0x6c0313Be8E8DFDF3a9fc720ccAd9BEE5Ea3DaCBc

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# API Keys
COINBASE_API_KEY_PATH=./coinbase_cloud_api_key.json
```

## 🚀 Step 2: Deploy Backend to Railway

### 2.1 Connect Railway to GitHub
1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### 2.2 Configure Backend Service
1. **Service Name**: `ai-lawsuit-bot-backend`
2. **Root Directory**: `backend`
3. **Build Command**: `npm ci && npm run build`
4. **Start Command**: `npm start`

### 2.3 Add Environment Variables
In Railway dashboard, add all environment variables from `.env.production`

### 2.4 Add PostgreSQL Database
1. Click "New" → "Database" → "PostgreSQL"
2. Copy the `DATABASE_URL` to your environment variables
3. Run database migrations:
```bash
npx prisma migrate deploy
```

### 2.5 Deploy
1. Railway will automatically build and deploy
2. Wait for deployment to complete
3. Copy the generated URL (e.g., `https://ai-lawsuit-bot-backend-production.up.railway.app`)

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Connect Vercel to GitHub
1. Go to [Vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository

### 3.2 Configure Frontend
1. **Framework Preset**: Next.js
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### 3.3 Environment Variables
Add these in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`: Your Railway backend URL

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-project.vercel.app`

## 🔧 Step 4: Configure Domain & SSL

### 4.1 Custom Domain (Optional)
1. In Vercel: Add custom domain
2. In Railway: Add custom domain
3. Configure DNS records

### 4.2 SSL Certificates
- Vercel: Automatic HTTPS
- Railway: Automatic HTTPS

## 📊 Step 5: Monitoring & Analytics

### 5.1 Vercel Analytics
- Enable Vercel Analytics in dashboard
- Track performance and user behavior

### 5.2 Railway Monitoring
- View logs in Railway dashboard
- Set up alerts for errors

### 5.3 External Monitoring
- [UptimeRobot](https://uptimerobot.com) for uptime monitoring
- [Sentry](https://sentry.io) for error tracking

## 🔒 Step 6: Security & Backup

### 6.1 Security Headers
Add to `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

### 6.2 Database Backup
- Railway: Automatic daily backups
- Manual backup: Export PostgreSQL data

### 6.3 Environment Security
- Use Railway's secret management
- Rotate API keys regularly
- Monitor access logs

## 🚀 Step 7: Post-Deployment

### 7.1 Test Your Deployment
1. **Frontend**: Visit your Vercel URL
2. **Backend**: Test API endpoints
3. **Database**: Verify connections
4. **Blockchain**: Test wallet connections

### 7.2 Performance Optimization
1. **Frontend**: Enable Vercel edge caching
2. **Backend**: Monitor Railway performance
3. **Database**: Optimize queries
4. **CDN**: Configure caching headers

### 7.3 SEO & Marketing
1. **Meta Tags**: Add proper meta tags
2. **Sitemap**: Generate sitemap.xml
3. **Robots.txt**: Configure search engine access
4. **Analytics**: Add Google Analytics

## 📈 Step 8: Scaling & Maintenance

### 8.1 Auto-scaling
- Railway: Automatic scaling based on load
- Vercel: Automatic edge scaling

### 8.2 Updates & Maintenance
1. **Regular Updates**: Keep dependencies updated
2. **Security Patches**: Monitor for vulnerabilities
3. **Performance Monitoring**: Track metrics
4. **Backup Verification**: Test restore procedures

## 🆘 Troubleshooting

### Common Issues
1. **Build Failures**: Check logs in deployment platform
2. **Environment Variables**: Verify all required vars are set
3. **Database Connection**: Test connection strings
4. **CORS Issues**: Configure allowed origins

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Next.js Documentation](https://nextjs.org/docs)

## 🎉 Success!

Your AI Lawsuit Bot is now deployed and ready for production use!

**Frontend**: https://your-project.vercel.app
**Backend**: https://your-backend.railway.app
**Database**: Railway PostgreSQL
**Blockchain**: Base Sepolia Testnet

---

**Next Steps:**
1. Test all functionality
2. Set up monitoring
3. Configure custom domain
4. Plan for scaling
5. Market your application! 