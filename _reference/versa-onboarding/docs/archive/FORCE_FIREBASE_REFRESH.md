# Force Firebase to Use Correct IP Address

## Problem

Firebase is still trying to verify your domain using the **old IP address** `34.102.136.180` instead of the new one `199.36.158.100`.

This prevents SSL certificate provisioning because Firebase can't complete the ACME challenge.

## Root Cause

Firebase has **cached the old DNS result** and hasn't refreshed its DNS lookup yet.

## Solution: Remove and Re-add Domain

You need to **force Firebase to do a fresh DNS lookup** by removing and re-adding the domain.

### Step-by-Step Instructions

1. **Go to Firebase Console**
   - URL: https://console.firebase.google.com/project/central-element-323112/hosting
   - Click **"Custom domains"** in the left sidebar

2. **Remove the Domain**
   - Find `odum-research.co.uk` in the list
   - Click the **three dots (⋮)** next to it
   - Click **"Remove domain"** or **"Delete"**
   - Confirm the removal

3. **Wait 5-10 Minutes** ⏰
   - This is critical - Firebase needs time to clear its cache
   - Don't re-add immediately

4. **Re-add the Domain**
   - Click **"Add custom domain"** button
   - Enter: `odum-research.co.uk`
   - Click **"Continue"**
   - Firebase will now do a **fresh DNS lookup** and should see `199.36.158.100`

5. **Verify DNS Records**
   - Firebase will show you the required DNS records
   - Make sure they match what you have in Squarespace:
     - A record: `199.36.158.100` (NOT `34.102.136.180`)
     - TXT record: `hosting-site=central-element-323112`

6. **Wait for Verification**
   - Firebase will verify the domain (should take 5-15 minutes)
   - Then it will provision the SSL certificate (can take 1-24 hours)

## Before You Start

**CRITICAL: Verify DNS is correct first!**

Run this command to make absolutely sure the old IP is gone:

```bash
cd /Users/Femi_1/Documents/odum/odum_website/presentations-portal
./check-old-ip.sh
```

**You should see ONLY `199.36.158.100`, NOT `34.102.136.180`**

If you see the old IP, you need to delete that A record in Squarespace first!

## Why This Works

- Removing the domain clears Firebase's DNS cache for that domain
- Re-adding forces Firebase to query DNS fresh
- Firebase will now see the correct IP (`199.36.158.100`)
- ACME challenge will work correctly
- SSL certificate can be provisioned

## After Re-adding

1. **Check the status** in Firebase Console
   - Should show "Verifying" or "Provisioning SSL"
   - Should NOT show the old IP error

2. **Monitor progress**
   - Domain verification: 5-15 minutes
   - SSL provisioning: 1-24 hours

3. **Test the domain**

   ```bash
   # Should resolve to correct IP
   dig odum-research.co.uk

   # Should eventually work (after SSL is ready)
   curl -I https://odum-research.co.uk
   ```

## If It Still Shows Old IP

If after removing and re-adding, Firebase still tries to use `34.102.136.180`:

1. **Double-check Squarespace DNS**
   - Make absolutely sure NO A record points to `34.102.136.180`
   - You should have ONLY ONE A record: `199.36.158.100`

2. **Wait longer**
   - DNS propagation can take up to 48 hours globally
   - Even if your local DNS shows correct, Firebase's DNS servers might be cached

3. **Check from Google's DNS**

   ```bash
   dig @8.8.8.8 odum-research.co.uk
   # Should show: 199.36.158.100
   ```

4. **Contact Firebase Support**
   - If DNS is correct everywhere but Firebase still sees old IP
   - They can manually clear the cache or verify

## Quick Checklist

Before removing/re-adding:

- [ ] DNS shows ONLY `199.36.158.100` (check with `./check-old-ip.sh`)
- [ ] NO A record points to `34.102.136.180` in Squarespace
- [ ] TXT record `hosting-site=central-element-323112` exists

After removing/re-adding:

- [ ] Wait 5-10 minutes before re-adding
- [ ] Firebase shows correct IP during verification
- [ ] No more "34.102.136.180" errors
- [ ] Status changes to "Verifying" or "Provisioning SSL"

---

**The key is: Remove the domain, wait 5-10 minutes, then re-add it. This forces Firebase to do a fresh DNS lookup.**
