# Complete Deployment Setup Guide

This guide covers the full end-to-end deployment setup for Redeem Rocket with Vercel, Railway, and GitHub Actions.

## Overview

- **Frontend**: 3 React apps deployed to Vercel (customer, business, admin)
- **Backend**: Django REST API deployed to Railway
- **Database**: PostgreSQL on Railway
- **Cache**: Redis on Railway
- **Environments**: Development (develop), QA (qa), Production (main)

## Phase 1: Vercel Projects Setup

### Customer App Project
1. Go to https://vercel.com/new
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Choose: `eagleincloud/redeem-rocket`
5. **Configure Project**:
   - Project Name: `redeem-rocket-customer`
   - Framework Preset: Vite
   - Root Directory: `./customer-app/frontend`
   - Environment Variables (optional for now)
6. Click "Deploy"
7. After deployment, go to **Settings → General**:
   - Copy the **Project ID** → Save as `VERCEL_PROJECT_ID_CUSTOMER`

### Business App Project
Repeat the same process:
- Project Name: `redeem-rocket-business`
- Root Directory: `./business-app/frontend`
- Copy Project ID → `VERCEL_PROJECT_ID_BUSINESS`

### Admin App Project
Repeat the same process:
- Project Name: `redeem-rocket-admin`
- Root Directory: `./admin-app/frontend`
- Copy Project ID → `VERCEL_PROJECT_ID_ADMIN`

## Phase 2: Vercel Account Credentials

1. Go to https://vercel.com/account/settings
2. Scroll to "Tokens" section
3. Click "Create Token"
4. Name: `GitHub Actions CI/CD`
5. Copy token → Save as `VERCEL_TOKEN`
6. Go to https://vercel.com/account/general
7. Find **Team ID** (or Org ID) → Save as `VERCEL_ORG_ID`

**Credentials Collected:**
```
VERCEL_ORG_ID = [your-org-id]
VERCEL_TOKEN = [your-token]
VERCEL_PROJECT_ID_CUSTOMER = [proj-id-1]
VERCEL_PROJECT_ID_BUSINESS = [proj-id-2]
VERCEL_PROJECT_ID_ADMIN = [proj-id-3]
```

## Phase 3: Railway Setup

### Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Authorize and select: `eagleincloud/redeem-rocket`
5. Click "Deploy Now"

### Add Services

#### PostgreSQL Service
1. In Railway, click "New"
2. Select "Database" → "PostgreSQL"
3. Configure:
   - Name: `postgres`
   - Version: Latest
4. Note the connection details

#### Redis Service
1. Click "New"
2. Select "Database" → "Redis"
3. Configure:
   - Name: `redis`
   - Version: Latest

#### Backend Service
1. Click "New"
2. Select "GitHub Repo"
3. Select the redeem-rocket repo
4. Configure:
   - Name: `backend`
   - Root Directory: `/backend`
   - Environment: Add from Railway variables

### Create Environments

1. In Railway, go to **Settings** → **Environments**
2. Create 3 environments:
   - `development` - linked to develop branch
   - `staging` - linked to qa branch
   - `production` - linked to main branch

### Get Railway Credentials

1. Go to https://railway.app/account/tokens
2. Create new token: `GitHub Actions`
3. Copy token → Save as `RAILWAY_TOKEN`

For each service and environment:
1. Click on the service
2. Go to Settings
3. Copy the **Service ID** → Save as:
   - `RAILWAY_SERVICE_ID_DEV` (development environment)
   - `RAILWAY_SERVICE_ID_QA` (staging environment)
   - `RAILWAY_SERVICE_ID_PROD` (production environment)

**Credentials Collected:**
```
RAILWAY_TOKEN = [your-railway-token]
RAILWAY_SERVICE_ID_DEV = [service-id-dev]
RAILWAY_SERVICE_ID_QA = [service-id-qa]
RAILWAY_SERVICE_ID_PROD = [service-id-prod]
```

## Phase 4: GitHub Secrets Configuration

1. Go to: https://github.com/eagleincloud/redeem-rocket/settings/secrets/actions
2. Click "New repository secret" for each:

```
VERCEL_ORG_ID = [paste value]
VERCEL_TOKEN = [paste value]
VERCEL_PROJECT_ID_CUSTOMER = [paste value]
VERCEL_PROJECT_ID_BUSINESS = [paste value]
VERCEL_PROJECT_ID_ADMIN = [paste value]
RAILWAY_TOKEN = [paste value]
RAILWAY_SERVICE_ID_DEV = [paste value]
RAILWAY_SERVICE_ID_QA = [paste value]
RAILWAY_SERVICE_ID_PROD = [paste value]
```

## Phase 5: Branch Protection Rules

1. Go to: https://github.com/eagleincloud/redeem-rocket/settings/branches
2. Add rule for `develop` branch:
   - Require status checks to pass
   - Require branches to be up to date
   - ✓ Allow auto-merge
   - ✓ Auto-deploy on push

3. Add rule for `qa` branch:
   - Require status checks to pass
   - Require branches to be up to date
   - ✓ Allow auto-merge
   - ✓ Auto-deploy on push

4. Add rule for `main` branch:
   - Require status checks to pass
   - **Require 1 approval before merge**
   - Require branches to be up to date
   - ✓ Manual approval needed before deploy

## Phase 6: Deployment Testing

### Test Development Deployment
1. Create a new branch from `develop`
2. Make a small change (e.g., update README)
3. Push and create a PR
4. After approval, GitHub Actions should:
   - ✅ Run tests
   - ✅ Build frontend projects
   - ✅ Deploy to Vercel (development)
   - ✅ Deploy backend to Railway (dev environment)

### Test QA Deployment
1. Merge PR into `qa` branch
2. GitHub Actions should automatically:
   - ✅ Run all tests
   - ✅ Build all projects
   - ✅ Deploy all to Vercel (staging)
   - ✅ Deploy backend to Railway (qa environment)

### Test Production Deployment
1. Create a PR from `qa` to `main`
2. Request approval
3. After approval, GitHub Actions should:
   - ✅ Run all tests
   - ✅ Build all projects
   - ✅ Deploy all to Vercel (production)
   - ✅ Deploy backend to Railway (production environment)

## Environment Variables

### Customer App (.env)
```
VITE_API_URL=https://api.redeemrocket.com
VITE_APP_NAME=Redeem Rocket
```

### Business App (.env)
```
VITE_API_URL=https://api.redeemrocket.com
VITE_APP_NAME=Redeem Rocket Business
```

### Admin App (.env)
```
VITE_API_URL=https://api.redeemrocket.com
VITE_APP_NAME=Redeem Rocket Admin
```

### Backend (.env)
```
DEBUG=False
SECRET_KEY=[generate-secure-key]
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/redeem_rocket
REDIS_URL=redis://[user]:[password]@[host]:6379
ALLOWED_HOSTS=api.redeemrocket.com,localhost
CORS_ALLOWED_ORIGINS=https://customer.redeemrocket.com,https://business.redeemrocket.com,https://admin.redeemrocket.com
```

## Troubleshooting

### Vercel Build Fails
- Check **Vercel Project Settings** → **Build & Development Settings**
- Ensure Root Directory is correctly set to the app folder
- Verify environment variables are added

### Railway Deployment Issues
- Check Railway logs: Project → Services → Logs
- Verify PostgreSQL and Redis are running
- Check environment variable configuration

### GitHub Actions Failures
- View **Actions** tab for workflow logs
- Check that all 9 secrets are added
- Verify branch names match (develop, qa, main)

## Dashboard URLs

After setup, access your deployments at:

- **Customer App (Dev)**: `https://redeem-rocket-customer.vercel.app`
- **Business App (Dev)**: `https://redeem-rocket-business.vercel.app`
- **Admin App (Dev)**: `https://redeem-rocket-admin.vercel.app`
- **Railway Dashboard**: `https://railway.app`
- **Vercel Dashboard**: `https://vercel.com`

## Next Steps

1. ✅ Configure all secrets (Phase 4)
2. ✅ Set up branch protection (Phase 5)
3. ✅ Test deployment pipeline (Phase 6)
4. Monitor logs and metrics
5. Configure custom domains (optional)
6. Set up monitoring alerts

---

**Last Updated**: April 9, 2026
**Status**: Ready for Deployment
