# Deployment Guide

## Prerequisites

1. **Firebase CLI installed**: `npm install -g firebase-tools`
2. **Authenticated**: `firebase login`
3. **Project selected**: `firebase use central-element-323112`
4. **Environment variables configured** (see below)

## Environment Variables

### Local Development (`.env.local`)

```bash
FIREBASE_CLIENT_EMAIL=your-service-account@central-element-323112.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_PROJECT_ID=central-element-323112
PRESENTATIONS_BUCKET=central-element-323112.appspot.com
```

### Production (Firebase Hosting)

Environment variables are automatically available in Cloud Run via:

- **Application Default Credentials** (recommended for production)
- Or set via Firebase Functions config: `firebase functions:config:set`

For production, the app uses Application Default Credentials, so you typically don't need to set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` unless you want to override.

**Required environment variables for Cloud Run:**

- `PRESENTATIONS_BUCKET` (optional, defaults to `central-element-323112.appspot.com`)
- `GCLOUD_PROJECT` or `FIREBASE_PROJECT_ID` (auto-set by Firebase)

## Deployment Methods

### Method 1: Manual Deployment (Recommended for testing)

```bash
# Pre-deployment checks (type check, lint, build)
npm run predeploy

# Deploy to Firebase Hosting
npm run deploy

# Or deploy everything (hosting + firestore rules)
npm run deploy:all
```

### Method 2: CI/CD with GitHub Actions (Recommended for production)

1. **Set up GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add `FIREBASE_SERVICE_ACCOUNT` with your Firebase service account JSON

2. **Push to main branch:**

   ```bash
   git push origin main
   ```

   - GitHub Actions will automatically:
     - Run type checks
     - Run linting
     - Build the application
     - Deploy to Firebase Hosting

### Method 3: Direct Firebase CLI

```bash
# Build first
npm run build

# Deploy
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

## Pre-Deployment Checklist

- [ ] Run `npm run type-check` - no TypeScript errors
- [ ] Run `npm run lint` - no linting errors
- [ ] Run `npm run build` - build succeeds
- [ ] Test locally: `npm run dev` and verify functionality
- [ ] Check environment variables are set correctly
- [ ] Verify Firebase project: `firebase use`
- [ ] Check Firestore rules: `firebase deploy --only firestore:rules`

## Post-Deployment Verification

1. **Check deployment status:**

   ```bash
   firebase hosting:channel:list
   ```

2. **Test the live site:**
   - Visit: `https://central-element-323112.web.app`
   - Test login flow
   - Test admin panel access
   - Test presentation access

3. **Check Cloud Run logs:**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit 50 --project central-element-323112
   ```

## Troubleshooting

### Build fails

- Check Node.js version (should be 20+)
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`

### Deployment fails

- Verify Firebase CLI is up to date: `npm install -g firebase-tools@latest`
- Check authentication: `firebase login --reauth`
- Verify project: `firebase use central-element-323112`

### Runtime errors in production

- Check Cloud Run logs for errors
- Verify environment variables are set
- Check IAM permissions for Cloud Run service account

## Best Practices

1. **Always test locally first**: `npm run dev`
2. **Use staging channel for testing**: `firebase hosting:channel:deploy staging`
3. **Review changes before deploying**: `git diff`
4. **Keep dependencies updated**: `npm audit` and `npm update`
5. **Monitor deployments**: Check Firebase Console → Hosting → Releases

## Rollback

If deployment causes issues:

```bash
# List recent releases
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:releases:rollback <release-id>
```
