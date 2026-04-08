# CI/CD Strategy & Branching Model

## Overview
This project uses a three-tier branching strategy with automated CI/CD pipelines for each environment.

---

## Branching Strategy

### 1. **Main Branch** (Production)
- **Protection**: Yes, requires pull requests and status checks
- **Deployment**: Automatic to Vercel Production
- **Audience**: Live users
- **Requirements**:
  - All tests must pass
  - Code review required
  - Build successful
- **When to use**: Only stable, tested code ready for production

### 2. **QA Branch** (Staging/Quality Assurance)
- **Protection**: Yes, requires pull requests
- **Deployment**: Automatic to Vercel Preview (QA environment)
- **Audience**: QA team and stakeholders
- **Requirements**:
  - Tests and linting must pass
  - Build successful
  - Code review from dev team
- **When to use**: Features ready for testing before production

### 3. **Develop Branch** (Development)
- **Protection**: Yes, squash commits on merge
- **Deployment**: Automatic to Vercel Preview (Dev environment)
- **Audience**: Development team
- **Requirements**:
  - Build must succeed
  - Linting checks pass
- **When to use**: Daily development, feature branches merge here

---

## Workflow

### Creating a New Feature

1. **Create feature branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/enhanced-onboarding
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: add enhanced onboarding features"
   git push origin feature/enhanced-onboarding
   ```

3. **Create Pull Request to `develop`**:
   - Go to GitHub
   - Create PR from `feature/enhanced-onboarding` → `develop`
   - Wait for CI checks to pass
   - Merge when approved

4. **Deploy to QA**:
   - Create PR from `develop` → `qa`
   - QA team tests the features
   - Once approved, merge to `qa`

5. **Deploy to Production**:
   - Create PR from `qa` → `main`
   - Final review and sign-off
   - Merge to `main` for production deployment

---

## CI/CD Pipelines

### Development Pipeline (develop branch)
```
Code Push → Lint Check → Build → Auto Deploy to Dev
```

### QA Pipeline (qa branch)
```
Code Push → Lint Check → Unit Tests → Build → Auto Deploy to Staging
```

### Production Pipeline (main branch)
```
Code Push → Lint Check → Unit Tests → Build → Auto Deploy to Production
```

---

## Environment Configuration

### Development (develop)
- URL: `https://dev.yourdomain.com` (Vercel preview)
- Database: Development Supabase project
- Logging: Verbose
- Analytics: Development

### QA (qa)
- URL: `https://qa.yourdomain.com` (Vercel preview)
- Database: QA Supabase project (optional, can use dev)
- Logging: Standard
- Analytics: Staging

### Production (main)
- URL: `https://yourdomain.com` (Vercel production)
- Database: Production Supabase project
- Logging: Errors only
- Analytics: Live

---

## GitHub Secrets Required

Add these secrets to GitHub repository settings:

```
VERCEL_TOKEN              # Vercel API token
VERCEL_ORG_ID             # Vercel organization ID
VERCEL_PROJECT_ID         # Vercel project ID
VERCEL_SCOPE              # Vercel team scope
VITE_SUPABASE_URL         # Development/Production Supabase URL
VITE_SUPABASE_ANON_KEY    # Development/Production Supabase anon key
VITE_SUPABASE_URL_QA      # QA Supabase URL (optional)
VITE_SUPABASE_ANON_KEY_QA # QA Supabase anon key (optional)
```

---

## Best Practices

### Commits
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Keep commits small and focused
- Write meaningful commit messages

### Pull Requests
- One feature per PR
- Add description of changes
- Link related issues
- Include testing notes

### Code Review
- At least 1 approval required before merge
- Address all comments
- Ensure CI checks pass

### Testing
- Write tests for new features
- Run tests locally before pushing
- Ensure at least 70% code coverage

---

## Deployment Checklist

### Before Merging to QA
- [ ] Feature complete and tested
- [ ] Code reviewed by peer
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Documentation updated

### Before Merging to Production
- [ ] QA testing completed
- [ ] Product owner approval
- [ ] Performance check
- [ ] Security review
- [ ] Migration tested (if DB changes)

---

## Rollback Procedure

If issues occur in production:

1. **Immediate**: Check error logs in Vercel dashboard
2. **Minor Bug**:
   - Create hotfix branch from `main`
   - Fix the issue
   - Create PR to `main`
   - Merge and redeploy
3. **Critical Issue**:
   - Revert the latest commit: `git revert <commit-hash>`
   - Push to `main` for automatic rollback

---

## Monitoring

### Vercel Dashboard
- Monitor deployment status
- Check build logs
- Review analytics

### Supabase Dashboard
- Monitor database performance
- Check error logs
- Review API usage

---

## Team Guidelines

- Only maintainers can merge PRs
- Code review is mandatory
- Squash commits on merge to keep history clean
- Tag releases on `main` branch
- Update CHANGELOG.md with each release

---

## Emergency Procedures

### Production Down
1. Check Vercel status page
2. Check Supabase status
3. Review recent deployments
4. If new deployment caused issue, revert immediately
5. Notify stakeholders

### Database Issues
1. Check Supabase logs
2. Verify migrations ran correctly
3. Check for failed queries
4. Contact Supabase support if needed

---

## Useful Commands

```bash
# View branch history
git log --oneline --graph --all

# See what's different between branches
git diff develop..qa
git diff qa..main

# Sync local branch with remote
git fetch origin
git pull origin main

# Create release tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# View deployment logs
vercel logs --since 1h
```

---

## Support

- GitHub Issues: For bug reports and feature requests
- Discussions: For questions and discussions
- PRs: For code contributions

---

**Last Updated**: April 8, 2026
**Version**: 1.0
