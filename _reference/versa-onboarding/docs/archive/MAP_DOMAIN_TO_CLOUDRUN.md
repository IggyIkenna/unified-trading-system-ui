# Map Custom Domain Directly to Cloud Run

## Goal

Make `odum-research.co.uk` show the content from `https://odum-portal-cldtjniqvq-ez.a.run.app/` **without changing the URL in the browser**.

## Current Situation

- ✅ Cloud Run service is working: `odum-portal` in `europe-west4`
- ✅ DNS is correct: `odum-research.co.uk` → `199.36.158.100`
- ❌ Firebase Hosting domain verification is stuck (still seeing old IP)

## Solution: Map Domain Directly to Cloud Run

Instead of going through Firebase Hosting, map the domain **directly to Cloud Run**. This is faster and simpler.

### Step 1: Add Custom Domain in Cloud Run Console

1. **Go to Cloud Run Console:**
   - URL: https://console.cloud.google.com/run?project=central-element-323112
   - Select region: **europe-west4**
   - Click on service: **odum-portal**

2. **Add Custom Domain:**
   - Click the **"Custom domains"** tab
   - Click **"Add mapping"** or **"Map domain"**
   - Enter: `odum-research.co.uk`
   - Click **"Continue"**

3. **Update DNS Records:**
   - Cloud Run will show you the **new DNS records** needed
   - **Important:** These will be DIFFERENT from Firebase Hosting records
   - You'll likely need to update the A record to point to a different IP

### Step 2: Update Squarespace DNS

Cloud Run will provide you with:

- **A record** or **CNAME record** to add
- The exact values will be shown in the Cloud Run console

**Update your Squarespace DNS:**

1. Remove the current A record pointing to `199.36.158.100` (Firebase Hosting IP)
2. Add the new A/CNAME record provided by Cloud Run
3. Keep the TXT records if Cloud Run requires them

### Step 3: Wait for Verification

- Cloud Run will verify the domain (usually 5-15 minutes)
- SSL certificate will be automatically provisioned (1-24 hours)
- Once verified, `odum-research.co.uk` will show your Cloud Run service

## Alternative: Use Firebase Hosting (Current Setup)

If you want to keep using Firebase Hosting with Cloud Run rewrites:

1. **Remove domain from Firebase Console:**
   - Go to: https://console.firebase.google.com/project/central-element-323112/hosting
   - Remove `odum-research.co.uk`
   - Wait 10 minutes

2. **Re-add domain:**
   - Add `odum-research.co.uk` again
   - This forces Firebase to do a fresh DNS lookup
   - Should now see `199.36.158.100` instead of old IP

3. **Wait for verification:**
   - Domain verification: 5-15 minutes
   - SSL provisioning: 1-24 hours

## Which Approach to Use?

### ✅ Direct Cloud Run Mapping (Recommended for Speed)

- **Pros:**
  - Faster setup (no Firebase Hosting verification delays)
  - Simpler architecture
  - Direct connection to your service
  - URL stays as `odum-research.co.uk`

- **Cons:**
  - Lose Firebase Hosting CDN (but Cloud Run has CDN too)
  - Need to update DNS records

### ⚠️ Firebase Hosting + Rewrites (Current Setup)

- **Pros:**
  - Keep Firebase Hosting benefits
  - Unified Firebase management

- **Cons:**
  - Slower (verification issues)
  - More complex setup
  - Currently stuck on verification

## Quick Decision

**For immediate results:** Use **Direct Cloud Run Mapping** (Option 1)

**For long-term Firebase integration:** Fix Firebase Hosting verification (Option 2)

## After Mapping to Cloud Run

Once the domain is mapped:

- `odum-research.co.uk` will show your Next.js app
- URL stays as `odum-research.co.uk` (no redirects)
- All routes work: `/`, `/login`, `/admin`, `/api/*`, etc.
- SSL certificate automatically provisioned

## Current Cloud Run Service

- **Service:** `odum-portal`
- **Region:** `europe-west4`
- **URL:** `https://odum-portal-cldtjniqvq-ez.a.run.app/`
- **Status:** ✅ Working and accessible

---

**Recommendation: Map the domain directly to Cloud Run for fastest results!**
