# SSL Certificate Status

## Current Status

✅ **DNS is correct**: Domain resolves to `199.36.158.100` (Firebase Hosting IP)
❌ **SSL Certificate issue**: Certificate is for `firebaseapp.com`, not `odum-research.co.uk`

## Problem

The SSL certificate currently being served is:

- **Subject**: `CN=firebaseapp.com`
- **Does NOT include**: `odum-research.co.uk` in Subject Alternative Names (SANs)

This means Firebase hasn't finished provisioning the SSL certificate for your custom domain yet.

## What This Means

- DNS is working correctly ✅
- Domain is pointing to Firebase Hosting ✅
- SSL certificate for custom domain is still being provisioned ⏳

## Next Steps

### 1. Check Firebase Console

Go to: https://console.firebase.google.com/project/central-element-323112/hosting

Look at your custom domain `odum-research.co.uk` status:

- **"Verifying"** → Domain verification in progress
- **"Provisioning SSL"** → SSL certificate being created (can take 1-24 hours)
- **"Active"** → Domain is live and working
- **"Error"** → Check error message

### 2. Verify Domain Status

In Firebase Console, check:

- Is the domain showing as "Verified"?
- Is there an SSL certificate status indicator?
- Any error messages?

### 3. Wait for SSL Provisioning

Firebase automatically provisions SSL certificates via Let's Encrypt. This process:

- Can take **1-24 hours** after domain verification
- Requires the domain to be fully verified first
- Happens automatically once verification completes

### 4. If Verification Failed

If you see verification errors:

1. Make sure DNS records are correct:
   - A record: `199.36.158.100`
   - TXT record: `hosting-site=central-element-323112`
2. Wait 15-30 minutes after DNS changes
3. Click "Retry verification" in Firebase Console

## Expected Timeline

1. **DNS Propagation**: ✅ Complete (resolving correctly)
2. **Domain Verification**: ⏳ In progress (check Firebase Console)
3. **SSL Certificate Provisioning**: ⏳ Waiting (happens after verification)
4. **Domain Active**: ⏳ Waiting (happens after SSL is ready)

## How to Check Status

```bash
# Check DNS (should show 199.36.158.100)
dig odum-research.co.uk

# Check SSL certificate (currently shows firebaseapp.com)
echo | openssl s_client -connect odum-research.co.uk:443 -servername odum-research.co.uk 2>/dev/null | openssl x509 -noout -subject

# When ready, it should show:
# subject=CN = odum-research.co.uk
# OR include odum-research.co.uk in SANs
```

## Current Error

When accessing `https://odum-research.co.uk`, browsers will show:

- **SSL Certificate Error**: "Certificate name mismatch"
- **Reason**: Certificate is for `firebaseapp.com`, not `odum-research.co.uk`

This is **normal** during SSL provisioning. Once Firebase finishes provisioning, the certificate will include your custom domain and the error will disappear.

## What to Do Now

1. **Check Firebase Console** for domain verification status
2. **Wait for SSL provisioning** (can take up to 24 hours)
3. **Monitor the status** - Firebase will update when ready

The domain is correctly configured, it's just waiting for Firebase to finish the SSL certificate setup.
