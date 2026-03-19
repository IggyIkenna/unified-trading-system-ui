# DNS Configuration Status ✅

## Current DNS Records (Squarespace)

Your DNS records are correctly configured:

### ✅ Root Domain (odum-research.co.uk)

- **Type**: A
- **Host**: odum-research.co.uk
- **TTL**: 30 mins
- **Data**: `199.36.158.100` (Firebase Hosting IP)
- **Status**: ✅ Correct

### ✅ WWW Subdomain

- **Type**: CNAME
- **Host**: www
- **TTL**: 4 hrs
- **Data**: `odum-research.co.uk`
- **Status**: ✅ Correct

### ✅ Firebase Hosting Verification

- **Type**: TXT
- **Host**: odum-research.co.uk
- **Data**: `hosting-site=central-element-323112`
- **Status**: ✅ Correct (verifies domain ownership)

### ✅ SSL Certificate Verification

- **Type**: TXT
- **Host**: \_acme-challenge.odum-research.co.uk
- **Data**: `yQAdONgRRSXy9qqzcsg6pDUL6INzlA9kU6zs4qOU5Io`
- **Status**: ✅ Correct (for automatic SSL certificate)

### ✅ Google Verification Records

- Keep these records (for Google Workspace/verification)

---

## What Happens Next

1. **DNS Propagation**: 24-48 hours
   - Your DNS changes need to propagate globally
   - Lower TTL (30 mins) helps with faster updates

2. **Firebase Verification**: Automatic
   - Firebase checks the TXT record
   - Once verified, domain is activated

3. **SSL Certificate**: Automatic (2-24 hours)
   - Firebase automatically provisions SSL certificates
   - Uses Let's Encrypt via the `_acme-challenge` TXT record

4. **Domain Activation**: Complete
   - Once DNS propagates and SSL is ready, your site will be live

---

## Verify Status

Check your domain status in Firebase Console:
https://console.firebase.google.com/project/central-element-323112/hosting

Look for:

- ✅ Domain verified
- ✅ SSL certificate active
- ✅ Domain status: "Connected" or "Active"

---

## Testing

Once DNS propagates, test your site:

```bash
# Test root domain
curl -I https://odum-research.co.uk

# Test www subdomain
curl -I https://www.odum-research.co.uk
```

Both should return `200 OK` and show your site.

---

## Troubleshooting

### If domain doesn't work after 48 hours:

1. **Check DNS propagation:**

   ```bash
   dig odum-research.co.uk
   # Should show 199.36.158.100
   ```

2. **Verify in Firebase Console:**
   - Go to Hosting → Custom domains
   - Check for any error messages
   - Verify domain status

3. **Check SSL certificate:**
   - Firebase automatically provisions SSL
   - If issues, check the `_acme-challenge` TXT record is correct

4. **Common issues:**
   - DNS not fully propagated (wait longer)
   - TXT records not verified (check Firebase console)
   - SSL certificate pending (wait for automatic provisioning)

---

## Current Configuration

- **Firebase Hosting**: Proxies all requests to Cloud Run service
- **Cloud Run Service**: `odum-portal` in `europe-west4`
- **Service URL**: `https://odum-portal-cldtjniqvq-ez.a.run.app`
- **Firebase Hosting URL**: `https://central-element-323112.web.app`

Your custom domain will route through Firebase Hosting → Cloud Run, ensuring:

- ✅ Single origin (no cookie issues)
- ✅ Automatic SSL
- ✅ CDN benefits
- ✅ Proper authentication

---

## No Changes Needed

Your DNS records are **correctly configured**. Just wait for:

1. DNS propagation (24-48 hours)
2. SSL certificate provisioning (automatic)

Your site will be live at `https://odum-research.co.uk` once these complete!
