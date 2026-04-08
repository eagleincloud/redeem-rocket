# GitHub Branch Protection Rules

Configure these branch protection rules in your GitHub repository settings.

## For Main Branch (Production)

Settings → Branches → Add rule for `main`

- [x] Require a pull request before merging
  - [x] Require approvals: 2
  - [x] Require status checks to pass before merging
    - [x] Deploy to Production
    - [x] Test (from prod-deploy workflow)
  - [x] Require conversation resolution before merging
  - [x] Require status checks from the base repository only
  - [x] Require branches to be up to date before merging
  - [x] Require deployment reviews
    - Select: Production environment
- [x] Require code reviews
- [x] Restrict who can push to matching branches
  - Allow: Administrators only

## For QA Branch (Staging)

Settings → Branches → Add rule for `qa`

- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Require status checks to pass before merging
    - [x] Deploy to QA
    - [x] Test (from qa-deploy workflow)
  - [x] Require conversation resolution before merging
- [x] Require code reviews
- [ ] Restrict who can push (allow all developers)

## For Develop Branch (Development)

Settings → Branches → Add rule for `develop`

- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Require status checks to pass before merging
    - [x] Deploy to Development
  - [ ] Require code reviews (optional for dev)
- [ ] Restrict who can push (allow all developers)

## Environment Protection Rules

### Production Environment
- Settings → Environments → Production
- [x] Environment protection rules
  - [x] Require reviewers: Select developers who can approve prod deployments
  - [x] Allow administrators to bypass required reviewers
- [x] Environment secrets
  - Add production-specific secrets if needed

### QA Environment
- Settings → Environments → QA (if using separate)
- [x] Require reviewers: QA lead
- [x] Environment secrets
  - VITE_SUPABASE_URL_QA
  - VITE_SUPABASE_ANON_KEY_QA

---

## Default Branch

Set `main` as the default branch:
- Settings → General → Default branch → Select `main`

---

## Automatic Merge Rules

(Optional) Enable auto-merge for specific branches:
- Allow auto-merge: Enabled
- Default merge method: Squash and merge (for develop)
- Delete head branches: Enabled

---

## Code Owners (Optional)

Create `.github/CODEOWNERS` file:

```
# Global owners for everything
*                    @username1 @username2

# Frontend team
src/business/        @frontend-team
src/app/             @frontend-team

# Backend team
src/admin/           @backend-team
supabase/            @backend-team

# DevOps
.github/workflows/   @devops-team
vercel.json          @devops-team
```

---

## Required Status Checks

From the branch protection rules, these checks must pass:

1. **Lint**: Code quality
2. **Build**: Project builds successfully
3. **Test**: Unit tests pass
4. **Deploy**: Deployment workflow succeeds
5. **Security**: No vulnerabilities detected (optional, requires tool)

---

## Enforcement

- All rules apply to administrators: No (administrators can bypass)
- Include administrators: No (to allow emergency fixes)
- Require authorized actors to approve deployments: Yes

---

**Apply these settings through GitHub UI under:**
Settings → Branches → Branch protection rules
