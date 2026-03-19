# Domain Verification - Immediate Steps ⚡

## ✅ Your DNS Records Are Correct!

Based on your Squarespace DNS settings:

- ✅ **A record**: `odum-research.co.uk` → `199.36.158.100` (Firebase IP)
- ✅ **TXT record**: `hosting-site=central-element-323112` (Firebase verification)
- ✅ **TXT record**: `_acme-challenge.odum-research.co.uk` (SSL certificate)
- ✅ **CNAME**: `www` → `odum-research.co.uk`
- ✅ **Old A record removed**: `34.102.136.180` is no longer present

## 🚀 Speed Up Verification (Next 15 Minutes)

### Step 1: Lower TTL Even More (2 minutes)

In Squarespace, update TTL to **minimum possible**:

**Current:**

- A record TTL: `30 mins`
- TXT record TTL: `30 mins`

**Change to:**

- A record TTL: `5 mins` (or minimum available)
- TXT record TTL: `5 mins` (or minimum available)

This helps DNS changes propagate faster globally.

### Step 2: Verify in Firebase Console (5 minutes)

1. **Go to:** https://console.firebase.google.com/project/central-element-323112/hosting
2. **Click on "Custom domains"** tab
3. **Look for `odum-research.co.uk`**
4. **Check status:**
   - Should show: "Verifying" or "Connected"
   - If showing errors, click "Retry verification"

### Step 3: Force DNS Refresh (Optional)

If you have access to different networks:

```bash
# Test from Google DNS (8.8.8.8)
dig @8.8.8.8 odum-research.co.uk
# Should show: 199.36.158.100

# Test TXT record
dig @8.8.8.8 TXT odum-research.co.uk
# Should show: "hosting-site=central-element-323112"
```

### Step 4: Wait for Firebase Verification

Firebase checks DNS records every few minutes. Once verified:

- ✅ Domain status changes to "Connected"
- ✅ SSL certificate starts provisioning (automatic)
- ✅ Site becomes accessible

**Expected time:** 5-15 minutes after DNS records are correct (which they are!)

## 📋 Verification Checklist

- [x] A record points to `199.36.158.100`
- [x] TXT record `hosting-site=central-element-323112` exists
- [x] Old A record `34.102.136.180` removed
- [ ] TTL lowered to 5 minutes (do this now!)
- [ ] Firebase Console shows domain as "Verifying" or "Connected"
- [ ] Wait 5-15 minutes for verification

## 🔍 Test Commands

Once verified, test your domain:

```bash
# Test DNS resolution
dig odum-research.co.uk
# Should return: 199.36.158.100

# Test HTTPS access
curl -I https://odum-research.co.uk
# Should return: 200 OK

# Test www subdomain
curl -I https://www.odum-research.co.uk
# Should return: 200 OK
```

## ⏱️ Timeline

With your current setup:

- **DNS Propagation**: 15-30 minutes (with 5 min TTL)
- **Firebase Verification**: 5-15 minutes (automatic checks)
- **SSL Certificate**: 15-30 minutes (automatic after verification)

**Total: 30-60 minutes** from now if you lower TTL immediately.

## 🆘 If Not Working After 1 Hour

1. **Check Firebase Console** for any error messages
2. **Verify TXT records are visible globally:**

   ```bash
   dig @8.8.8.8 TXT odum-research.co.uk
   dig @1.1.1.1 TXT odum-research.co.uk
   ```

   Both should show: `"hosting-site=central-element-323112"`

3. **Check A record is correct:**

   ```bash
   dig @8.8.8.8 odum-research.co.uk
   ```

   Should show: `199.36.158.100`

4. **Contact Firebase Support** if domain shows errors in console

## ✅ Current Status

Your DNS is **correctly configured**. The only thing needed is:

1. Lower TTL to 5 minutes (speeds up propagation)
2. Wait for Firebase to verify (5-15 minutes)
3. Wait for SSL certificate (15-30 minutes after verification)

**You're almost there!** Just need to wait for Firebase's automatic verification process.
