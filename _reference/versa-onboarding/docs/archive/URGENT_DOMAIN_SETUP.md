# Urgent Domain Setup - Next Hour ⚡

## Immediate Actions Required

### Step 1: Verify Domain in Firebase Console (5 minutes)

1. **Go to Firebase Hosting:**
   https://console.firebase.google.com/project/central-element-323112/hosting

2. **Click "Add custom domain"** (if not already added)
   - Enter: `odum-research.co.uk`
   - Follow verification steps

3. **Check Domain Status:**
   - Look for: ✅ "Verified" or "Connected"
   - If showing "Pending verification", wait 5-10 minutes and refresh

### Step 2: Lower DNS TTL for Faster Updates (2 minutes)

In Squarespace DNS settings, **update TTL to minimum:**

**Current A Record:**

- Host: `odum-research.co.uk`
- Type: `A`
- TTL: Change from `30 mins` to `5 mins` (300 seconds) ⚡
- Data: `199.36.158.100`

**Why this helps:** Lower TTL means DNS changes propagate faster globally.

### Step 3: Force DNS Cache Clear (Optional)

If you have access to test from different locations:

```bash
# Test from Google DNS
dig @8.8.8.8 odum-research.co.uk

# Test from Cloudflare DNS
dig @1.1.1.1 odum-research.co.uk

# Should show: 199.36.158.100
```

### Step 4: Verify DNS Records Are Correct

Your current DNS records look correct:

- ✅ A record: `odum-research.co.uk` → `199.36.158.100`
- ✅ CNAME: `www` → `odum-research.co.uk`
- ✅ TXT: `hosting-site=central-element-323112`
- ✅ TXT: `_acme-challenge.odum-research.co.uk` → (your challenge token)

### Step 5: Check Firebase Hosting Status

After adding domain in Firebase Console, check:

- Domain shows as "Connected" or "Active"
- SSL certificate status (may show "Provisioning" initially)
- No error messages

---

## Alternative: Use Firebase Hosting URL Temporarily

If you need immediate access while DNS propagates:

**Temporary URL:** `https://central-element-323112.web.app`

This works immediately and routes to your Cloud Run service.

---

## Speed Up DNS Propagation

1. **Lower TTL** (already mentioned above)
2. **Use Google DNS or Cloudflare DNS** for faster resolution
3. **Clear local DNS cache:**

   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Or use Google DNS
   # System Preferences → Network → DNS → Add 8.8.8.8
   ```

4. **Test from different networks:**
   - Mobile data (different ISP)
   - Different WiFi network
   - VPN to different location

---

## Expected Timeline

- **DNS Propagation:** 15 minutes - 2 hours (with 5 min TTL)
- **Firebase Verification:** 5-15 minutes (automatic)
- **SSL Certificate:** 15 minutes - 1 hour (automatic)

**Total:** Could be working in 30-60 minutes with optimal setup.

---

## If Still Not Working After 1 Hour

1. **Check Firebase Console for errors**
2. **Verify TXT records are correct:**

   ```bash
   dig TXT odum-research.co.uk
   dig TXT _acme-challenge.odum-research.co.uk
   ```

3. **Contact Firebase Support** (if domain shows errors in console)
4. **Consider using Cloudflare DNS** (faster propagation than Squarespace)

---

## Quick Test Commands

```bash
# Test DNS resolution
dig odum-research.co.uk
# Should show: 199.36.158.100

# Test HTTPS access
curl -I https://odum-research.co.uk
# Should return: 200 OK

# Test www subdomain
curl -I https://www.odum-research.co.uk
# Should return: 200 OK
```

---

## Current Status Checklist

- [ ] Domain added in Firebase Console
- [ ] TTL lowered to 5 minutes
- [ ] TXT records verified
- [ ] Firebase shows domain as "Connected"
- [ ] SSL certificate provisioning (check in console)

Once all checked, your domain should be live within 30-60 minutes!
