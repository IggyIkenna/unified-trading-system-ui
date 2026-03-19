# Root Cause Analysis: Authentication Cookie Issues

## The Problem

When using Firebase Hosting with `frameworksBackend`, requests flow like this:

```
Browser → Firebase Hosting (central-element-323112.web.app)
         → Cloud Function (ssrcentralelement323112-cldtjniqvq-nw.a.run.app)
```

**The Issue**:

- Cookies are set by the Cloud Function (different domain)
- But the browser makes requests to Firebase Hosting (different domain)
- Even though they're proxied, cookie domain/path settings can cause issues
- The proxy layer may not preserve all cookie attributes correctly

## Why This Happens

1. **Domain Mismatch**:
   - Hosting: `central-element-323112.web.app`
   - Function: `ssrcentralelement323112-cldtjniqvq-nw.a.run.app`
   - Cookies set on `.run.app` may not be sent to `.web.app`

2. **Proxy Layer Complexity**:
   - Firebase Hosting proxies requests to Cloud Function
   - Cookie headers may be modified or stripped during proxying
   - SameSite cookie restrictions apply differently

3. **Cookie Path Issues**:
   - Cookies set with `path: "/"` should work, but proxy can interfere
   - HttpOnly cookies may not be preserved correctly

## Solutions Ranked by Effectiveness

### ✅ Solution 1: Firebase App Hosting (BEST)

**Why it works**: Single origin - everything on the same domain

- No proxy layer
- No domain mismatches
- Native cookie handling

**Migration**:

```bash
# Update firebase.json to use appHosting instead of hosting
# Then deploy
firebase apphosting:backends:deploy
```

**Status**: Requires Firebase App Hosting to be enabled for your project

---

### ✅ Solution 2: Direct Cloud Run Deployment (GOOD)

**Why it works**: Single origin - direct access to Cloud Run service

- No Firebase Hosting proxy
- Cookies set and read from same domain
- Full control over cookie settings

**Migration**:

```bash
# Enable standalone output
# Update next.config.ts: output: "standalone"
npm run build
./scripts/deploy-cloudrun.sh
```

**Trade-off**: Lose Firebase Hosting CDN for static assets (but Cloud Run has CDN too)

---

### ⚠️ Solution 3: Fix Current Setup (COMPLEX)

**Possible fixes**:

1. Explicitly set cookie domain to match Hosting domain
2. Use custom domain that points to Cloud Run
3. Configure cookie settings in the proxy layer

**Status**: More complex, may not fully resolve issues

---

## Recommended Action Plan

### Step 1: Test Direct Cloud Run (Quick Test)

This will prove if the issue is with `frameworksBackend`:

```bash
# 1. Enable standalone output
# Edit next.config.ts, uncomment: output: "standalone"

# 2. Build
npm run build

# 3. Deploy to Cloud Run
./scripts/deploy-cloudrun.sh

# 4. Test authentication
# Visit the Cloud Run URL and test login
# If cookies work here → issue is with frameworksBackend
# If cookies don't work → issue is in the code
```

### Step 2: Choose Permanent Solution

**If Cloud Run works**:

- ✅ Use Direct Cloud Run deployment (simpler)
- OR
- ✅ Migrate to Firebase App Hosting (better long-term)

**If Cloud Run doesn't work**:

- Debug cookie settings in the code
- Check SameSite cookie restrictions
- Verify cookie domain/path settings

---

## Quick Comparison

| Method                          | Cookie Issues | Setup Complexity | Performance | Cost       |
| ------------------------------- | ------------- | ---------------- | ----------- | ---------- |
| **Current (frameworksBackend)** | ❌ Yes        | Low              | Good        | Low        |
| **App Hosting**                 | ✅ No         | Low              | Excellent   | Low        |
| **Direct Cloud Run**            | ✅ No         | Medium           | Excellent   | Low-Medium |

---

## Next Steps

1. **Test Cloud Run deployment** to verify root cause
2. **If successful**, choose between:
   - App Hosting (if available)
   - Direct Cloud Run (always available)
3. **Update deployment scripts** accordingly
4. **Update documentation** with new deployment method

---

## Files Created

- `Dockerfile` - For Cloud Run deployment
- `.cloudbuild.yaml` - Cloud Build configuration
- `scripts/deploy-cloudrun.sh` - Deployment script
- `firebase-apphosting.json` - App Hosting configuration (alternative)
- `DEPLOYMENT_ALTERNATIVES.md` - Full comparison document
