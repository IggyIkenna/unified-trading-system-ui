# Custom Domain Setup for odum-research.co.uk

## Current Setup

Your app is deployed to:

- **Cloud Run**: `https://odum-portal-cldtjniqvq-ez.a.run.app`
- **Firebase Hosting**: `https://central-element-323112.web.app` (proxies to Cloud Run)

## Option 1: Firebase Hosting Custom Domain (Recommended)

Firebase Hosting has built-in custom domain support that's easier to configure.

### Steps:

1. **Add Custom Domain in Firebase Console:**
   - Go to: https://console.firebase.google.com/project/central-element-323112/hosting
   - Click "Add custom domain"
   - Enter: `odum-research.co.uk`
   - Follow the verification steps

2. **Update Squarespace DNS:**

   Firebase will provide you with DNS records. Typically you'll need:

   **For the root domain (@):**
   - Type: `A`
   - Host: `@`
   - TTL: `4 hrs` (or default)
   - Data: `151.101.1.195` (Firebase will provide the actual IP)
   - OR use the CNAME provided by Firebase

   **For www subdomain:**
   - Type: `CNAME`
   - Host: `www`
   - TTL: `4 hrs`
   - Data: `odum-research.co.uk` (or the Firebase provided value)

3. **Remove/Update Old Records:**
   - Remove or update the old `@` A record pointing to `34.102.136.180`
   - Keep the `www` CNAME pointing to your root domain

### After DNS Update:

- Wait 24-48 hours for DNS propagation
- Firebase will automatically provision SSL certificates
- Your site will be available at `https://odum-research.co.uk` and `https://www.odum-research.co.uk`

---

## Option 2: Direct Cloud Run Domain Mapping

If you prefer to use Cloud Run directly (without Firebase Hosting):

1. **Verify Domain in Google Cloud:**
   - Go to: https://console.cloud.google.com/run/domains?project=central-element-323112
   - Click "Add Mapping"
   - Enter: `odum-research.co.uk`
   - Follow domain verification steps

2. **Get DNS Records from Cloud Run:**
   - After verification, Cloud Run will provide DNS records
   - Usually includes A records or CNAME records

3. **Update Squarespace DNS:**
   - Replace the `@` A record with Cloud Run's provided records
   - Update `www` CNAME if needed

---

## Current Squarespace DNS Settings

Based on your current setup, you should:

1. **Keep these records:**
   - Google verification records (pcckh5tawumk, hklilpz32kky) - don't delete these

2. **Update these records:**
   - `@` A record: Change from `34.102.136.180` to Firebase/Cloud Run provided IP
   - `www` CNAME: Keep pointing to root domain or update as needed

3. **Remove (if not needed):**
   - `_domainconnect` CNAME (only if you're not using Squarespace domain connect)

---

## Quick Reference

**Firebase Hosting Console:**
https://console.firebase.google.com/project/central-element-323112/hosting

**Cloud Run Console:**
https://console.cloud.google.com/run?project=central-element-323112

**Current Service URL:**
https://odum-portal-cldtjniqvq-ez.a.run.app

---

## Troubleshooting

- **DNS Propagation**: Can take 24-48 hours
- **SSL Certificates**: Firebase/Cloud Run automatically provisions SSL (may take a few hours)
- **Verification**: Make sure domain ownership is verified before DNS changes
- **TTL**: Lower TTL (like 4 hrs) helps with faster updates during setup
