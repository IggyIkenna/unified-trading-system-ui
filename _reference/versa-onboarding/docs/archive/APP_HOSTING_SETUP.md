# Firebase App Hosting Setup Guide

## Current Status

✅ Firebase App Hosting has been initialized in this project
✅ Configuration files created:

- `firebase.json` - Updated to use App Hosting
- `apphosting.yaml` - Backend configuration

## Next Steps Required

Firebase App Hosting requires a backend to be created. This can be done in two ways:

### Option 1: Create Backend via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/project/central-element-323112/apphosting)
2. Click "Create Backend"
3. Select your web app: `1:1060025368044:web:95b700e83573c9a05a94c9`
4. Choose region: `europe-west2`
5. Connect to GitHub repository (optional, but recommended for CI/CD)
   - Or select "Deploy from local source" if available

### Option 2: Create Backend via CLI (Interactive)

Run this command and follow the prompts:

```bash
firebase apphosting:backends:create
```

You'll be prompted to:

- Select or create a web app
- Choose a region
- Optionally connect to GitHub

## After Backend Creation

Once the backend is created, you can deploy:

```bash
# Build the app
npm run build

# Deploy to App Hosting
firebase apphosting:backends:deploy <backend-id>
```

Or if using GitHub integration:

- Push to your repository
- App Hosting will automatically build and deploy

## Alternative: Direct Cloud Run (If App Hosting Setup is Complex)

If App Hosting setup is taking too long, you can use Direct Cloud Run deployment which solves the same cookie issues:

```bash
# This will deploy directly to Cloud Run (single origin, no cookie issues)
./scripts/deploy-cloudrun.sh
```

## Benefits of App Hosting vs Current Setup

| Feature          | Current (frameworksBackend) | App Hosting           |
| ---------------- | --------------------------- | --------------------- |
| Cookie Issues    | ❌ Domain mismatch          | ✅ Single origin      |
| Setup Complexity | Low                         | Medium                |
| CDN              | ✅ Yes                      | ✅ Yes                |
| Auto Deploy      | ❌ Manual                   | ✅ GitHub integration |
| Performance      | Good                        | Excellent             |

## Important Notes

- App Hosting requires a **Blaze (pay-as-you-go) billing plan**
- The backend must be created before first deployment
- Once created, deployments are straightforward
- All requests go to the same domain (no cookie issues!)
