# Create Firebase App Hosting Backend - Step by Step

## Quick Console Method (Recommended - 2 minutes)

### Step 1: Open Firebase Console

Click this link or copy-paste into your browser:

```
https://console.firebase.google.com/project/central-element-323112/apphosting
```

### Step 2: Create Backend

1. Click the **"Create Backend"** button (or "Get Started" if first time)
2. You'll see a list of your web apps
3. Select: **"odum research"** (App ID: `1:1060025368044:web:95b700e83573c9a05a94c9`)
4. Click **"Continue"**

### Step 3: Configure Backend

1. **Region**: Select `europe-west2` (or your preferred region)
2. **GitHub Connection** (Optional):
   - You can skip this for now by clicking "Skip" or "Continue without GitHub"
   - You can always connect GitHub later for automatic deployments
3. Click **"Create Backend"**

### Step 4: Wait for Creation

- Backend creation takes 1-2 minutes
- You'll see a progress indicator
- Once complete, you'll see the backend listed

### Step 5: Note the Backend ID

- After creation, note the **Backend ID** (it will be something like `backend-xxxxx`)
- You'll need this for deployment

---

## CLI Method (Alternative)

If you prefer CLI, run this command and follow the prompts:

```bash
cd presentations-portal
firebase apphosting:backends:create --app 1:1060025368044:web:95b700e83573c9a05a94c9
```

**Prompts you'll see:**

1. **Select region**: Type `europe-west2` or choose from the list
2. **Connect to GitHub?**: Type `n` to skip (you can add later)
3. **Backend name**: Press Enter for default, or type a custom name

---

## After Backend Creation

Once the backend is created, verify it:

```bash
firebase apphosting:backends:list
```

You should see your backend listed with:

- Backend ID
- Repository (if connected)
- URL (once deployed)
- Primary Region
- Updated Date

---

## Deploy After Backend Creation

Once the backend exists, you can deploy:

```bash
# Option 1: Use the setup script (interactive)
npm run deploy:apphosting

# Option 2: Manual deployment
npm run build
firebase apphosting:backends:deploy <backend-id>
```

---

## Troubleshooting

### "App Hosting is not available"

- Ensure you have a **Blaze (pay-as-you-go) billing plan**
- Check: https://console.firebase.google.com/project/central-element-323112/settings/usage

### "Backend creation failed"

- Check your billing account is active
- Ensure you have necessary permissions
- Try again after a few minutes

### "Cannot find web app"

- Verify the app ID: `1:1060025368044:web:95b700e83573c9a05a94c9`
- Check: `firebase apps:list WEB`

---

## Next Steps After Backend Creation

1. ✅ Backend created
2. 🔨 Build: `npm run build`
3. 🚀 Deploy: `firebase apphosting:backends:deploy <backend-id>`
4. ✅ Test authentication (should work without cookie issues!)
