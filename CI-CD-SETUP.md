# 🚀 CI/CD Setup Guide - Automated Deployment

This guide will help you set up automated deployment for all your applications.

## 📋 Overview

Your applications will deploy automatically when you push code:

| Branch | Environment | Auto-Deploy | Approval Required |
|--------|-------------|-------------|-------------------|
| `develop` | Dev | ✅ Yes | ❌ No |
| `qa` | Staging/QA | ✅ Yes | ❌ No |
| `main` | Production | ✅ Yes (after approval) | ✅ Yes |

---

## 🔧 Step 1: Set Up Vercel (Frontend Apps)

### 1.1 Create Vercel Account
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Authorize Vercel to access your repositories

### 1.2 Create Frontend Projects
Create 3 projects in Vercel (one for each app):

#### Customer App
1. New Project → Import Git Repository
2. Select: `eagleincloud/redeem-rocket`
3. **Framework Preset**: Vite
4. **Root Directory**: `customer-app/frontend`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://api-dev.redeem-rocket.com (for preview)
   ```
6. Deploy

#### Business App
1. New Project → Import Git Repository
2. Select: `eagleincloud/redeem-rocket`
3. **Framework Preset**: Vite
4. **Root Directory**: `business-app/frontend`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://api-dev.redeem-rocket.com (for preview)
   ```
6. Deploy

#### Admin App
1. New Project → Import Git Repository
2. Select: `eagleincloud/redeem-rocket`
3. **Framework Preset**: Vite
4. **Root Directory**: `admin-app/frontend`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://api-dev.redeem-rocket.com (for preview)
   ```
6. Deploy

### 1.3 Get Vercel Secrets
After creating projects, get these values:

```bash
# From Vercel Account Settings
VERCEL_ORG_ID = [Your organization ID]
VERCEL_TOKEN = [Personal access token from Settings → Tokens]

# From each project (Vercel Dashboard → Project Settings)
VERCEL_PROJECT_ID_CUSTOMER = [customer-app project ID]
VERCEL_PROJECT_ID_BUSINESS = [business-app project ID]
VERCEL_PROJECT_ID_ADMIN = [admin-app project ID]
```

---

## 🚂 Step 2: Set Up Railway (Backend)

### 2.1 Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub account
3. Authorize Railway to access your repositories

### 2.2 Create Django Backend Services

#### Development Environment
1. New Project
2. Add Service → GitHub Repo
3. Select: `eagleincloud/redeem-rocket`
4. Confirm and create
5. Select `backend/` as root directory
6. Add PostgreSQL service:
   - Click "Add Service" → Database → PostgreSQL
7. Add Redis service (optional):
   - Click "Add Service" → Database → Redis

#### Environment Variables for Dev
```
DEBUG=True
SECRET_KEY=django-insecure-dev-key-change-in-production
DB_ENGINE=django.db.backends.postgresql
DB_NAME=redeem_rocket_dev
DB_USER=postgres
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### Staging Environment (QA)
1. Clone dev project or create new one
2. Set `DEBUG=True` (for staging debugging)
3. Update database name: `redeem_rocket_qa`

#### Production Environment
1. Clone QA project or create new one
2. Set environment variables:
```
DEBUG=False
SECRET_KEY=generate-a-secure-key-here
DB_ENGINE=django.db.backends.postgresql
DB_NAME=redeem_rocket_prod
CORS_ALLOWED_ORIGINS=https://customer.redeem-rocket.com,https://business.redeem-rocket.com,https://admin.redeem-rocket.com
ALLOWED_HOSTS=api.redeem-rocket.com
```

### 2.3 Get Railway Secrets

```bash
# From Railway Account Settings
RAILWAY_TOKEN = [Personal access token from Settings → Tokens]

# From each Railway service (Service → Settings)
RAILWAY_SERVICE_ID_DEV = [development service ID]
RAILWAY_SERVICE_ID_QA = [qa service ID]
RAILWAY_SERVICE_ID_PROD = [production service ID]
```

---

## 🔐 Step 3: Add GitHub Actions Secrets

### 3.1 Navigate to GitHub Secrets
1. Go to: https://github.com/eagleincloud/redeem-rocket/settings/secrets/actions
2. Click "New repository secret"

### 3.2 Add All Secrets

Add these secrets one by one:

**Vercel Secrets**:
```
VERCEL_ORG_ID = [value]
VERCEL_TOKEN = [value]
VERCEL_PROJECT_ID_CUSTOMER = [value]
VERCEL_PROJECT_ID_BUSINESS = [value]
VERCEL_PROJECT_ID_ADMIN = [value]
```

**Railway Secrets**:
```
RAILWAY_TOKEN = [value]
RAILWAY_SERVICE_ID_DEV = [value]
RAILWAY_SERVICE_ID_QA = [value]
RAILWAY_SERVICE_ID_PROD = [value]
```

---

## 🛡️ Step 4: Update Branch Protection Rules

### 4.1 Navigate to Branch Settings
1. Go to: https://github.com/eagleincloud/redeem-rocket/settings/branches
2. Click "Add rule"

### 4.2 Configure `develop` Branch
1. **Branch name pattern**: `develop`
2. ✓ **Require status checks to pass before merging**
   - Select status checks: `test` (all required)
3. ✗ **Require approval** (unchecked - auto-deploy)
4. ✓ **Dismiss stale pull request approvals when new commits are pushed**
5. Save

### 4.3 Configure `qa` Branch
1. **Branch name pattern**: `qa`
2. ✓ **Require status checks to pass before merging**
3. ✗ **Require approval** (unchecked - auto-deploy)
4. ✓ **Dismiss stale pull request approvals**
5. Save

### 4.4 Configure `main` Branch (Production)
1. **Branch name pattern**: `main`
2. ✓ **Require status checks to pass before merging**
3. ✓ **Require a pull request before merging**
4. ✓ **Require approvals**: Set to `1`
5. ✓ **Dismiss stale pull request approvals**
6. ✓ **Require status checks to pass before merging**
7. ✓ **Include administrators** (if you want admins to follow rules too)
8. Save

---

## 🚀 Step 5: Test the CI/CD Pipeline

### 5.1 Test Development Deploy
```bash
cd /tmp/redeem-rocket

# Switch to develop
git checkout develop

# Make a test commit
echo "# CI/CD Test" >> TEST.md
git add TEST.md
git commit -m "test: trigger CI/CD pipeline for development"

# Push to develop (auto-deploys)
git push origin develop

# Watch: GitHub Actions
# Go to: https://github.com/eagleincloud/redeem-rocket/actions
# You should see "Deploy Frontend Apps" and "Deploy Backend to Railway" workflows running
```

### 5.2 Test QA Deploy
```bash
# Create PR: develop → qa
git checkout qa
git merge develop
git push origin qa

# Watch for automatic deployment to QA environment
```

### 5.3 Test Production Deploy (with approval)
```bash
# Create PR: qa → main
# GitHub will show "Changes requested" if approvals are required

# Request approval in PR
# After 1 approval, merge will be allowed
# Automatic deployment to production

# Go to: https://github.com/eagleincloud/redeem-rocket/pulls
# Create PR: qa → main
# Add description and request review
# Wait for 1 approval
# Merge PR
# Watch deployment to production
```

---

## 📊 Deployment Flow Diagram

```
Feature Branch
    ↓
Create PR: feature → develop
    ↓
GitHub Actions Tests Run ✓
    ↓
Auto-Merge to develop
    ↓
Auto-Deploy to DEV (Vercel + Railway)
    ↓
Create PR: develop → qa
    ↓
Tests Run ✓
    ↓
Auto-Merge to qa
    ↓
Auto-Deploy to QA/STAGING (Vercel + Railway)
    ↓
Create PR: qa → main
    ↓
Tests Run ✓
    ↓
Request Approval (1 required)
    ↓
After Approval: Auto-Merge to main
    ↓
Auto-Deploy to PRODUCTION (Vercel + Railway)
    ↓
✅ Live!
```

---

## 🔍 Verify Deployment

### 5.1 Check Vercel Deployments
1. Go to: https://vercel.com/dashboard
2. Click each project
3. Should see deployments for each push

### 5.2 Check Railway Deployments
1. Go to: https://railway.app
2. Select each service
3. Check "Deployments" tab for deployment history

### 5.3 Check GitHub Actions
1. Go to: https://github.com/eagleincloud/redeem-rocket/actions
2. Watch workflows run automatically on push

---

## 🐛 Troubleshooting

### Deployment Failed
**Solution**:
1. Check GitHub Actions: https://github.com/eagleincloud/redeem-rocket/actions
2. Click failed workflow
3. View logs for error message
4. Common issues:
   - Missing environment variables → Add to GitHub Secrets
   - Invalid credentials → Verify Vercel/Railway tokens
   - Build failed → Check npm/pip logs

### Secrets Not Working
**Solution**:
1. Verify secrets are spelled correctly in workflows
2. Re-add secrets if changed
3. GitHub sometimes requires waiting a few minutes

### Build Failures
**Solution**:
1. Run locally first: `npm install && npm run build`
2. Check for TypeScript errors: `npm run type-check`
3. Verify all dependencies are in package.json

### Database Migrations Failed
**Solution**:
1. SSH into Railway service
2. Run manually: `python manage.py migrate`
3. Check Railway logs for specific error

---

## ✅ Verification Checklist

- [ ] Vercel projects created and connected
- [ ] Railway services created and connected
- [ ] GitHub secrets added (all 8 secrets)
- [ ] Branch protection rules configured
- [ ] Test commit pushed to develop
- [ ] Workflow ran and deployed to dev
- [ ] Test PR created and deployed to qa
- [ ] Production PR created and requires approval
- [ ] After approval, deployed to production

---

## 🎯 Once Everything Is Set Up

**You can now**:
1. ✅ Push to `develop` → Auto-deploys to dev
2. ✅ Push to `qa` → Auto-deploys to qa/staging
3. ✅ Push to `main` → Requires approval, then auto-deploys to production

**Workflow**:
```bash
# Make changes
git checkout -b feature/my-feature
git commit -m "feat: my feature"
git push origin feature/my-feature

# Create PR to develop
# After merge → Auto-deploys to DEV ✅

# Create PR to qa
# After merge → Auto-deploys to QA ✅

# Create PR to main
# Get 1 approval → Auto-deploys to PROD ✅
```

---

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs: https://github.com/eagleincloud/redeem-rocket/actions
2. Check Vercel deployment logs: https://vercel.com/dashboard
3. Check Railway logs: https://railway.app

---

**Your CI/CD pipeline is now fully automated! 🚀**
