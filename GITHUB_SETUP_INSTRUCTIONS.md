# GitHub Setup & Deployment Instructions

## Step 1: Create GitHub Repository

1. Go to **https://github.com/new**
2. Fill in the form:
   - **Repository name**: `redeem-rocket` (or your preferred name)
   - **Description**: "Business App with Enhanced Onboarding, Admin Dashboard, and Customer App"
   - **Visibility**: Private (or Public, your choice)
   - **Initialize repository**: Do NOT check anything (we have code locally)
3. Click **Create repository**

## Step 2: Add Remote and Push Code

After creating the repo, you'll see instructions. Run these commands:

```bash
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2

# Add the GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/redeem-rocket.git

# Push all branches to GitHub
git push -u origin main
git push -u origin qa
git push -u origin develop

# Verify all branches are pushed
git branch -a
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Configure GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret** and add these:

### Required Secrets

```
VERCEL_TOKEN
Values: Get from https://vercel.com/account/tokens
- Click "Create Token"
- Copy the token
- Paste in GitHub secret

VERCEL_ORG_ID
Values: Get from Vercel dashboard or vercel.json
- Go to https://vercel.com/account/overview
- Copy the Team ID or Org ID

VERCEL_PROJECT_ID
Values: Get from your Vercel project settings
- Go to Vercel project → Settings → Project ID
- Copy and paste

VERCEL_SCOPE
Values: Your GitHub username or organization name
- Usually your GitHub username

VITE_SUPABASE_URL
Values: From your Supabase project
- Go to Supabase dashboard
- Copy Project URL

VITE_SUPABASE_ANON_KEY
Values: From your Supabase project
- Go to Supabase dashboard
- Copy anon/public API key

VITE_SUPABASE_URL_QA (Optional)
Values: QA Supabase project URL (if using separate)

VITE_SUPABASE_ANON_KEY_QA (Optional)
Values: QA Supabase project anon key (if using separate)
```

## Step 4: Configure Branch Protection Rules

1. Go to **Settings → Branches**
2. Click **Add rule** for branch `main`:
   - Branch name pattern: `main`
   - ✅ Require a pull request before merging
   - ✅ Require approvals (2 reviewers)
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - Click **Create**

3. Add another rule for `qa`:
   - Branch name pattern: `qa`
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 reviewer)
   - Click **Create**

4. Add rule for `develop`:
   - Branch name pattern: `develop`
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass
   - Click **Create**

## Step 5: Connect to Vercel

### Option A: Automatic (Recommended)
1. Go to **https://vercel.com**
2. Click **New Project**
3. Connect your GitHub repository
4. Select the `redeem-rocket` repository
5. Vercel will auto-detect settings
6. Add environment variables from GitHub Secrets
7. Click **Deploy**

### Option B: Manual
1. Go to your Vercel project settings
2. Navigate to **Integrations → GitHub**
3. Connect your repository
4. Add environment variables

## Step 6: Test the CI/CD Pipeline

1. Create a test feature branch:
```bash
git checkout develop
git checkout -b feature/test-ci
echo "# Test" >> test.txt
git add test.txt
git commit -m "test: ci/cd pipeline"
git push origin feature/test-ci
```

2. Create a **Pull Request** on GitHub:
   - From `feature/test-ci` → `develop`
   - GitHub Actions will run automatically
   - Watch the workflow run in **Actions** tab

3. If tests pass, merge the PR:
   - Click **Merge pull request**
   - Development branch will auto-deploy

4. Promote to QA:
```bash
git checkout qa
git pull origin qa
git merge develop
git push origin qa
```

## Step 7: Verify Deployments

Check these URLs after each push:

- **Development**: https://dev-vercel-domain.vercel.app
- **QA**: https://qa-vercel-domain.vercel.app
- **Production**: https://yourdomain.com

Replace with your actual Vercel domains.

## Troubleshooting

### GitHub Actions Failing
- Check the **Actions** tab for error details
- Common issues:
  - Missing secrets → Add to Settings → Secrets
  - Node version mismatch → Update in workflow files
  - Build error → Check `npm run build:business` locally

### Vercel Deployment Failing
- Check Vercel dashboard for build logs
- Verify environment variables are set
- Ensure branches are up to date

### Branch Protection Issues
- If PR is blocked, check required status checks
- Make sure all CI checks pass before merging
- Get required number of approvals

## Quick Reference

### Push new feature to development:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
# Create PR on GitHub from feature/my-feature → develop
```

### Promote from develop to QA:
```bash
# Create PR from develop → qa on GitHub
# After approval, merge
```

### Promote from QA to production:
```bash
# Create PR from qa → main on GitHub
# After 2+ approvals, merge
# Production deployment happens automatically
```

## Environment Variables by Branch

| Branch | Env | Supabase | Vercel |
|--------|-----|----------|--------|
| develop | development | Dev project | Preview |
| qa | qa | QA project (opt) | Preview |
| main | production | Prod project | Production |

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Push code to GitHub
3. ✅ Add secrets to GitHub
4. ✅ Configure branch protection
5. ✅ Connect to Vercel
6. ✅ Run first deployment
7. ✅ Celebrate! 🎉

---

**Your enhanced onboarding feature is now ready for production with proper CI/CD!**

Questions? Check CI_CD_STRATEGY.md or .github/BRANCH_PROTECTION.md
