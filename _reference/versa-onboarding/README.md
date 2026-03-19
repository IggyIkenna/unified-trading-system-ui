## Odum Presentation Portal

Next.js app with Firebase Auth + Firestore and secure presentation access via a GCS proxy.

### Getting the latest code

The Git repository lives inside `presentations-portal`. To pull the latest changes:

```bash
cd presentations-portal   # or cd /path/to/odum_website/presentations-portal
git pull
```

### Local setup

1. Populate `.env.local` with Firebase Admin credentials:

```
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

If the private key is multi-line, replace newlines with `\n`.

2. Install dependencies and run:

```
npm install
npm run dev
```

Open `http://localhost:3000`.

### Mock presentations (testing)

Two mock HTML files live in `mock-presentations/`. Upload to your GCS bucket to test access:

```
gsutil cp mock-presentations/*.html gs://central-element-323112.appspot.com/presentations/demo/
```

Or use the helper script:

```
PRESENTATIONS_BUCKET=central-element-323112.appspot.com ./scripts/upload_mock_presentations.sh
```

Seed Firestore with matching presentations and a demo group:

```
node scripts/seed_firestore.mjs
```

Create matching Firestore documents:

- `presentations/demo_intro` → `gcsPath: presentations/demo/demo_intro.html`
- `presentations/demo_strategy` → `gcsPath: presentations/demo/demo_strategy.html`

Assign access via the admin panel.

### Password reset

For forgot-password / reset-password to work, configure Firebase:

1. **Firebase Console** → Authentication → Settings → **Authorized domains**
   - Add your domain (e.g. `localhost` for dev, your production domain for prod).

2. **Firebase Console** → Authentication → Templates → **Password reset**
   - Click the pencil icon → **Customize action URL**
   - Set to: `https://your-domain.com/reset-password` (or `http://localhost:3000/reset-password` for local dev).

### Admin role

Set the initial admin by updating the user document in Firestore:

- `users/{uid}` → `role: "admin"`

Or run the helper script:

```
node scripts/set_admins.mjs
```

### Firebase Hosting Deployment

The project includes `firebase.json` and `firestore.rules` for Firebase Hosting + Firestore.

**Quick Deploy:**

```bash
npm run deploy
```

**Full deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

**Deployment methods:**

1. **Manual**: `npm run deploy` (runs pre-deployment checks first)
2. **CI/CD**: Push to `main` branch (GitHub Actions auto-deploys)
3. **Direct**: `firebase deploy --only hosting`

**Pre-deployment checks:**

- Type checking: `npm run type-check`
- Linting: `npm run lint`
- Build: `npm run build`
- All: `npm run predeploy` (runs before `npm run deploy`)

# Triggering rebuild 1769567032
