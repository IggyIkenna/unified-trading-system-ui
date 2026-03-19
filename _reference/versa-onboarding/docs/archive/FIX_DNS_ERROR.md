# Fix Firebase DNS Verification Error

## Problem

Firebase is still seeing the old IP address `34.102.136.180` when trying to verify your domain.

## Root Cause

Either:

1. The old A record still exists in Squarespace (not fully deleted)
2. DNS caching is showing the old IP to Firebase's servers
3. Multiple A records exist (old + new)

## Immediate Fix Steps

### Step 1: Verify Squarespace DNS (CRITICAL)

In your Squarespace DNS settings, you should have **EXACTLY ONE** A record for `odum-research.co.uk`:

**✅ CORRECT Setup:**

```
Host: odum-research.co.uk
Type: A
TTL: 5 mins (or minimum)
Data: 199.36.158.100
```

**❌ WRONG - If you see this, DELETE it:**

```
Host: odum-research.co.uk
Type: A
Data: 34.102.136.180  ← DELETE THIS!
```

### Step 2: Check for Duplicate Records

In Squarespace DNS:

1. Look for **ALL** A records with host `odum-research.co.uk`
2. **DELETE** any that point to `34.102.136.180`
3. **KEEP ONLY** the one pointing to `199.36.158.100`

### Step 3: Lower TTL to Minimum

Set TTL to **5 minutes** (or minimum available) on:

- A record
- TXT records

This helps changes propagate faster.

### Step 4: Wait 10-15 Minutes

After deleting the old record:

1. Wait 10-15 minutes for DNS to update
2. Test DNS resolution:
   ```bash
   dig odum-research.co.uk
   # Should ONLY show: 199.36.158.100
   ```

### Step 5: Retry Verification in Firebase

1. Go to: https://console.firebase.google.com/project/central-element-323112/hosting
2. Click on your custom domain
3. Click **"Retry verification"** or **"Verify domain"**
4. Wait 5-10 minutes for Firebase to re-check

## Verification Checklist

Before retrying in Firebase, verify:

- [ ] Only ONE A record exists for `odum-research.co.uk`
- [ ] That A record points to `199.36.158.100` (NOT `34.102.136.180`)
- [ ] TTL is set to 5 minutes (minimum)
- [ ] TXT record `hosting-site=central-element-323112` exists
- [ ] Old A record `34.102.136.180` is completely removed

## Test Commands

After making changes, test:

```bash
# Should show ONLY 199.36.158.100
dig odum-research.co.uk

# Should NOT show 34.102.136.180
dig odum-research.co.uk | grep "34.102.136.180" && echo "❌ OLD IP STILL EXISTS!" || echo "✅ Old IP removed"

# Test from Google DNS
dig @8.8.8.8 odum-research.co.uk
# Should show: 199.36.158.100
```

## If Still Not Working

### Option 1: Remove and Re-add Domain in Firebase

1. In Firebase Console, **remove** the custom domain
2. Wait 5 minutes
3. **Add it again** with fresh verification

### Option 2: Use Different DNS Provider

If Squarespace DNS is slow:

- Consider using Cloudflare (free, faster propagation)
- Or Google Cloud DNS
- Point your domain's nameservers to the new provider

### Option 3: Contact Firebase Support

If DNS is correct but Firebase still sees old IP after 30 minutes:

- Contact Firebase Support
- Provide DNS query results showing only `199.36.158.100`
- They can manually verify or clear their cache

## Current Required DNS Records

**A Record (ONE ONLY):**

```
Host: odum-research.co.uk
Type: A
TTL: 5 mins
Data: 199.36.158.100
```

**TXT Records:**

```
Host: odum-research.co.uk
Type: TXT
Data: hosting-site=central-element-323112

Host: _acme-challenge.odum-research.co.uk
Type: TXT
Data: yQAdONgRRSXy9qqzcsg6pDUL6INzlA9kU6zs4qOU5Io
```

**CNAME:**

```
Host: www
Type: CNAME
Data: odum-research.co.uk
```

## Quick Fix Summary

1. **Go to Squarespace DNS**
2. **Delete ALL A records** for `odum-research.co.uk` that point to `34.102.136.180`
3. **Ensure ONLY ONE A record** exists pointing to `199.36.158.100`
4. **Set TTL to 5 minutes**
5. **Wait 10-15 minutes**
6. **Retry verification in Firebase Console**

The error will persist until Firebase's DNS lookup returns ONLY `199.36.158.100`.
