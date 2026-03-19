# Domain Alias Options for Cloud Run

## The Question

Can you use a CNAME alias to map `odum-research.co.uk` to Cloud Run?

## Short Answer

**It depends on what Cloud Run provides and what Squarespace supports:**

### Option 1: www Subdomain (CNAME Works ✅)

- **Map:** `www.odum-research.co.uk` to Cloud Run
- **DNS:** Use CNAME record (fully supported)
- **Squarespace:** Supports CNAME for subdomains
- **Result:** Users visit `www.odum-research.co.uk`

### Option 2: Apex Domain (ALIAS/A Record)

- **Map:** `odum-research.co.uk` (apex/root domain)
- **DNS:**
  - Standard CNAME **doesn't work** at apex (DNS limitation)
  - Need **ALIAS record** (ANAME/CNAME flattening) OR **A records**
- **Squarespace:**
  - ✅ Supports A records
  - ❓ May or may not support ALIAS records (check their docs)

## What Cloud Run Provides

When you map a domain in Cloud Run, it will tell you exactly what DNS records to add:

1. **For www subdomain:**
   - Usually provides: `CNAME www -> ghs.googlehosted.com` (or similar)
   - ✅ Works with Squarespace CNAME records

2. **For apex domain:**
   - May provide: A records (IP addresses)
   - May provide: ALIAS target (if your DNS supports it)
   - ✅ A records work with Squarespace
   - ❓ ALIAS depends on Squarespace support

## Recommended Approach

### Best Option: Use www Subdomain

1. Map `www.odum-research.co.uk` to Cloud Run
2. Add CNAME in Squarespace: `www -> [Cloud Run target]`
3. Optionally redirect `odum-research.co.uk` → `www.odum-research.co.uk`

### Alternative: Use Apex Domain

1. Map `odum-research.co.uk` to Cloud Run
2. Cloud Run will show you the required DNS records
3. If it's A records → Add them to Squarespace ✅
4. If it's ALIAS → Check if Squarespace supports it

## How to Check

1. **Try mapping in Cloud Run Console:**
   - Go to: https://console.cloud.google.com/run
   - Add custom domain mapping
   - Cloud Run will show you the exact DNS records needed

2. **Check Squarespace DNS Support:**
   - Squarespace definitely supports: A, CNAME, TXT records
   - Check Squarespace docs for ALIAS/ANAME support

## Current Setup

You currently have:

- A record: `odum-research.co.uk -> 199.36.158.100` (Firebase Hosting)

**If Cloud Run provides A records**, you can:

- Replace the A record with Cloud Run's A records
- This will work immediately ✅

**If Cloud Run provides a CNAME target**, you have two options:

1. Use `www` subdomain (CNAME works)
2. Check if Squarespace supports ALIAS for apex domain

## Quick Test

Try mapping the domain in Cloud Run Console first - it will show you exactly what DNS records you need, then we can determine if Squarespace supports them.

---

**Bottom line:** CNAME works for `www` subdomain. For apex domain, Cloud Run will tell you what's needed (likely A records, which Squarespace supports).
