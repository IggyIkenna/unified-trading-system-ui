# versa-onboarding — Odum Research Client Onboarding Portal

## What this is
Client onboarding flow: document uploads, KYC progress tracking, IMA signing, account setup.

## Stack
Next.js 15 + React 19 + TypeScript + Firebase + Google Cloud Storage

## Scope
- Client onboarding checklist (step-by-step progress)
- Document upload (IMA, KYC docs, proof of funds)
- Document status tracking (submitted / under review / approved)
- Intro/referral tracking (Max, Blue Coast)
- Account activation status

## Current client documents
9 clients, IMAs stored at `/Documents/Onboarding/IMAs/` locally.
8/9 IMA files located. PR IMA still to be confirmed.

## For Versa
Onboarding is first impression for clients — needs to feel:
- Professional and trust-building
- Clear progress indicators (step 1/5, document uploaded ✓)
- Mobile-friendly for clients uploading docs on phone
- Firebase auth for secure document access
- Odum branding throughout

## Run
```bash
npm install && npm run dev:mock     # mock mode (default — no Firebase credentials needed)
npm run dev:cloud                   # real Firebase — requires .env.cloud.local
```

## Cloud setup
Copy `.env.cloud` → `.env.cloud.local` (gitignored), fill in your Firebase Console values:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```
Then `npm run dev:cloud` — zero code changes needed.
