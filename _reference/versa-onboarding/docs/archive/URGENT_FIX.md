# URGENT: Fix Firebase DNS Error ⚡

## Error Message

```
One or more of Hosting's HTTP GET request for the ACME challenge failed:
34.102.136.180: Request failed
```

## Problem

Firebase is still trying to verify using the **old IP address** `34.102.136.180` instead of the new one `199.36.158.100`.

## Immediate Actions (Next 10 Minutes)

### Step 1: Double-Check Squarespace DNS

**Go to Squarespace DNS settings and verify:**

1. **Look for ALL A records** with host `odum-research.co.uk`
2. **You should see ONLY ONE A record:**

   ```
   Host: odum-research.co.uk
   Type: A
   TTL: 5 mins
   Data: 199.36.158.100
   ```

3. **If you see ANY A record pointing to `34.102.136.180`:**
   - **DELETE IT IMMEDIATELY**
   - This is the problem!

4. **If you see MULTIPLE A records:**
   - Delete all except the one pointing to `199.36.158.100`
   - Keep only ONE A record

### Step 2: Verify No Old Record Exists

Run this command to check:

```bash
cd /Users/Femi_1/Documents/odum/odum_website/presentations-portal
./check-old-ip.sh
```

If it shows the old IP (`34.102.136.180`), you need to delete that record in Squarespace.

### Step 3: Force Firebase to Re-Check

**Option A: Remove and Re-add Domain (Recommended)**

1. Go to: https://console.firebase.google.com/project/central-element-323112/hosting
2. Click "Custom domains"
3. Find `odum-research.co.uk`
4. Click the **three dots (⋮)** → **"Remove domain"**
5. Wait 5 minutes
6. Click **"Add custom domain"** again
7. Enter: `odum-research.co.uk`
8. Firebase will do a fresh DNS check

**Option B: Retry Verification**

1. In Firebase Console, click on the domain
2. Click **"Retry verification"** or **"Verify again"**
3. Wait 10-15 minutes

### Step 4: Wait for DNS Propagation

After ensuring only the correct A record exists:

- Wait 10-15 minutes for DNS to update globally
- Firebase checks DNS every few minutes
- Lower TTL (5 mins) helps speed this up

## Verification Checklist

Before retrying in Firebase:

- [ ] **ONLY ONE** A record exists for `odum-research.co.uk`
- [ ] That A record points to `199.36.158.100` (NOT `34.102.136.180`)
- [ ] **NO** A record points to `34.102.136.180`
- [ ] TTL is set to 5 minutes (minimum)
- [ ] TXT record `hosting-site=central-element-323112` exists
- [ ] Run `./check-old-ip.sh` - should NOT show old IP

## Quick Test

After fixing DNS, test:

```bash
# Should show ONLY 199.36.158.100
dig odum-research.co.uk

# Should NOT find old IP
dig odum-research.co.uk | grep "34.102.136.180"
# If this returns anything, the old record still exists!
```

## Why This Happens

Firebase's DNS lookup is still returning the old IP because:

1. The old A record still exists in Squarespace (most likely)
2. DNS caching hasn't expired yet
3. Multiple A records exist (old + new)

## Solution

**The fix is simple:**

1. Delete the old A record (`34.102.136.180`) from Squarespace
2. Keep only the new A record (`199.36.158.100`)
3. Wait 10-15 minutes
4. Remove and re-add domain in Firebase Console

This will force Firebase to do a fresh DNS lookup and see only the correct IP.

---

## If Still Not Working After 30 Minutes

1. **Verify DNS is correct globally:**

   ```bash
   dig @8.8.8.8 odum-research.co.uk
   dig @1.1.1.1 odum-research.co.uk
   ```

   Both should show ONLY `199.36.158.100`

2. **Contact Firebase Support** with:
   - Screenshot of your Squarespace DNS (showing only correct A record)
   - Output of `dig odum-research.co.uk` showing only `199.36.158.100`
   - Ask them to manually verify or clear their DNS cache

3. **Alternative:** Use Cloudflare DNS (faster propagation) instead of Squarespace

---

**The key is: Make absolutely sure the old A record (`34.102.136.180`) is completely deleted from Squarespace DNS!**
