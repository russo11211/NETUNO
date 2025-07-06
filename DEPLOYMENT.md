# 🚀 NETUNO Deployment Guide

## 📋 Deployment Architecture

### **Production Stack**
- **Frontend**: Vercel (Next.js 15)
- **Backend**: Render (Node.js/Express)
- **Database**: Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions

### **Free Tier Limits**
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Render**: 512MB RAM, sleeps after 15min inactivity
- **Supabase**: 500MB database, 2 projects

## 🛠️ Setup Instructions

### **1. Prerequisites**
```bash
# Install dependencies
npm install

# Copy environment files
cp .env.netuno.example .env
cp netuno-frontend/.env.example netuno-frontend/.env.local
```

### **2. Database Setup (Supabase)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings > Database
4. Run migration:
```bash
cd netuno-backend
DATABASE_URL="your_supabase_url" node database/migrate.js
```

### **3. Backend Deployment (Render)**
1. Create account at [render.com](https://render.com)
2. Connect GitHub repository
3. Create new Web Service:
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment**: Node.js
   - **Plan**: Free

4. Set environment variables:
```bash
NODE_ENV=production
DATABASE_URL=your_supabase_connection_string
HELIUS_API_KEY=your_helius_api_key
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key
SOLANA_RPC_FALLBACK_URL=https://rpc.helius.xyz/?api-key=your_helius_api_key
BIRDEYE_API_KEY=282d8b071fcf4aebb40c2ec773586e1a
COINMARKETCAP_API_KEY=b9b0b001-2690-4af6-87e0-9ecd1b673926
```

### **4. Frontend Deployment (Vercel)**
1. Create account at [vercel.com](https://vercel.com)
2. Import project from GitHub
3. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `netuno-frontend`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

4. Set environment variables:
```bash
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

### **5. CI/CD Setup (GitHub Actions)**
1. Add repository secrets:
```bash
# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Render
RENDER_SERVICE_ID=your_service_id
RENDER_API_KEY=your_api_key

# Database
DATABASE_URL=your_supabase_connection_string
```

2. Push to main branch triggers automatic deployment

## 🔧 Configuration Files

### **Backend Configuration**
- `Dockerfile` - Container configuration
- `render.yaml` - Render deployment settings
- `database/migrate.js` - Database migration script
- `database/dbAdapter.js` - Database abstraction layer

### **Frontend Configuration**
- `vercel.json` - Vercel deployment settings
- `next.config.ts` - Next.js configuration with API proxy

### **CI/CD Configuration**
- `.github/workflows/deploy.yml` - Automated deployment pipeline

## 🌍 Environment URLs

### **Production**
- **Frontend**: `https://netuno-frontend.vercel.app`
- **Backend**: `https://netuno-backend.onrender.com`
- **Health Check**: `https://netuno-backend.onrender.com/health`

### **Development**
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:4000`
- **Health Check**: `http://localhost:4000/health`

## 📊 Monitoring

### **Health Checks**
- Backend health endpoint: `/health`
- Automatic uptime monitoring via GitHub Actions
- Database connection validation

### **Logging**
- Render provides automatic logging
- Vercel provides real-time function logs
- Database query logging in development

## 🔐 Security

### **CORS Configuration**
- Production: Limited to Vercel domains
- Development: Localhost only

### **Rate Limiting**
- 100 requests per 15 minutes (general)
- 10 requests per minute (expensive endpoints)

### **Environment Variables**
- All secrets stored in platform-specific env vars
- No sensitive data in code repository

## 🚨 Troubleshooting

### **Common Issues**

1. **Render App Sleeping**
   - Free tier sleeps after 15min inactivity
   - First request may take 30-60 seconds

2. **Database Connection Issues**
   - Check Supabase connection string
   - Verify SSL settings in production

3. **CORS Errors**
   - Ensure frontend domain is in CORS whitelist
   - Check environment-specific origins

4. **Build Failures**
   - Verify Node.js version (18+)
   - Check package.json dependencies

### **Deployment Checklist**
- [ ] Database migrated successfully
- [ ] Backend health check responding
- [ ] Frontend loading without errors
- [ ] API endpoints accessible
- [ ] Environment variables configured
- [ ] CI/CD pipeline passing

## 📱 Scaling Options

### **Paid Upgrades**
- **Vercel Pro**: $20/month - Custom domains, advanced analytics
- **Render Starter**: $7/month - Always-on, more RAM
- **Supabase Pro**: $25/month - More storage, backups

### **Performance Optimization**
- Enable Vercel Edge Functions for API routes
- Use Render's autoscaling for backend
- Implement Redis caching for price data

## 🔄 Maintenance

### **Regular Tasks**
- Monitor database usage (Supabase dashboard)
- Review application logs (Render/Vercel)
- Update dependencies monthly
- Check API rate limits

### **Backup Strategy**
- Database: Supabase automatic backups
- Code: GitHub repository
- Environment configs: Documented in this guide