# ✅ Deployment Setup Checklist

Complete these steps to set up automated deployment.

## 🎯 Quick Setup (15 minutes)

### Phase 1: Vercel Setup (5 min)

- [ ] Create Vercel account at https://vercel.com
- [ ] Connect GitHub repository `eagleincloud/redeem-rocket`
- [ ] Create 3 Vercel projects:
  - [ ] `redeem-rocket-customer` (root: `customer-app/frontend`)
  - [ ] `redeem-rocket-business` (root: `business-app/frontend`)
  - [ ] `redeem-rocket-admin` (root: `admin-app/frontend`)
- [ ] Copy secrets:
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_TOKEN` (from Settings → Tokens)
  - [ ] `VERCEL_PROJECT_ID_CUSTOMER`
  - [ ] `VERCEL_PROJECT_ID_BUSINESS`
  - [ ] `VERCEL_PROJECT_ID_ADMIN`

### Phase 2: Railway Setup (5 min)

- [ ] Create Railway account at https://railway.app
- [ ] Create 3 services (dev, qa, prod):
  - [ ] Import GitHub repo `eagleincloud/redeem-rocket`
  - [ ] Set root directory to `backend/`
  - [ ] Add PostgreSQL service
  - [ ] Add Redis service (optional)
  - [ ] Configure environment variables (see CI-CD-SETUP.md)
- [ ] Copy secrets:
  - [ ] `RAILWAY_TOKEN` (from Settings → Tokens)
  - [ ] `RAILWAY_SERVICE_ID_DEV`
  - [ ] `RAILWAY_SERVICE_ID_QA`
  - [ ] `RAILWAY_SERVICE_ID_PROD`

### Phase 3: GitHub Configuration (5 min)

- [ ] Add GitHub Actions Secrets:
  - Go to: https://github.com/eagleincloud/redeem-rocket/settings/secrets/actions
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_PROJECT_ID_CUSTOMER
  - [ ] VERCEL_PROJECT_ID_BUSINESS
  - [ ] VERCEL_PROJECT_ID_ADMIN
  - [ ] RAILWAY_TOKEN
  - [ ] RAILWAY_SERVICE_ID_DEV
  - [ ] RAILWAY_SERVICE_ID_QA
  - [ ] RAILWAY_SERVICE_ID_PROD

- [ ] Configure Branch Protection Rules:
  - Go to: https://github.com/eagleincloud/redeem-rocket/settings/branches
  - [ ] Add rule for `develop`:
    - ✓ Require status checks
    - ✗ Require approvals
  - [ ] Add rule for `qa`:
    - ✓ Require status checks
    - ✗ Require approvals
  - [ ] Add rule for `main`:
    - ✓ Require status checks
    - ✓ Require 1 approval

---

## 🧪 Testing CI/CD (10 minutes)

### Test 1: Development Deploy
```bash
git checkout develop
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: trigger dev deployment"
git push origin develop

# Watch: GitHub Actions (https://github.com/eagleincloud/redeem-rocket/actions)
# Should see workflows running and deploying to dev
```

### Test 2: QA Deploy
```bash
git checkout qa
git merge develop
git push origin qa

# Watch deployment to QA
```

### Test 3: Production Deploy
```bash
git checkout main
git merge qa
git push origin main

# IMPORTANT: This requires approval on GitHub
# Go to: https://github.com/eagleincloud/redeem-rocket/pulls
# Find the PR, get 1 approval, then merge
# Should auto-deploy to production
```

---

## 📊 After Setup - Your Workflow

```
1. Make changes locally
   git checkout -b feature/my-feature
   git commit -m "feat: my change"

2. Push and create PR to develop
   git push origin feature/my-feature

3. GitHub Actions tests run automatically ✓

4. Merge to develop → Auto-deploys to DEV ✓

5. Create PR: develop → qa → Auto-deploys to QA ✓

6. Create PR: qa → main → Requires 1 approval → Auto-deploys to PROD ✓
```

---

## 🎯 Deployment Endpoints

After setup, your apps will be available at:

**Development**:
- Customer App: https://customer-dev.vercel.app
- Business App: https://business-dev.vercel.app
- Admin App: https://admin-dev.vercel.app
- Backend API: https://api-dev.redeem-rocket.railway.app

**Staging/QA**:
- Customer App: https://customer-qa.vercel.app
- Business App: https://business-qa.vercel.app
- Admin App: https://admin-qa.vercel.app
- Backend API: https://api-qa.redeem-rocket.railway.app

**Production**:
- Customer App: https://customer.redeem-rocket.com (custom domain)
- Business App: https://business.redeem-rocket.com (custom domain)
- Admin App: https://admin.redeem-rocket.com (custom domain)
- Backend API: https://api.redeem-rocket.com (custom domain)

---

## 🔍 Monitoring Deployments

### GitHub Actions Dashboard
https://github.com/eagleincloud/redeem-rocket/actions

Watch real-time logs of:
- Linting & type checking
- Build process
- Deployment steps

### Vercel Dashboard
https://vercel.com/dashboard

View:
- Deployment history
- Build logs
- Custom domains
- Environment variables

### Railway Dashboard
https://railway.app

View:
- Service deployments
- Database status
- Redis cache
- Logs

---

## ⚠️ Important Notes

1. **Never commit secrets**: All sensitive data goes in GitHub Secrets
2. **Environment variables**: Use Railway/Vercel UI for prod secrets
3. **Database**: Railway manages PostgreSQL automatically
4. **Logs**: Check GitHub Actions → Vercel → Railway for debugging
5. **Rollback**: Revert commit and push if deployment breaks

---

## 🚀 You're Ready!

Once all checkboxes are complete, your deployment pipeline is live and automated.

Push code → GitHub Actions runs tests → Deploys automatically! 🎉

---

**Questions?** See `CI-CD-SETUP.md` for detailed instructions.
