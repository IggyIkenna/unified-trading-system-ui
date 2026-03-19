# Quick Start: Create App Hosting Backend

## 🚀 Fastest Method: Firebase Console

**Direct Link**: https://console.firebase.google.com/project/central-element-323112/apphosting

### Steps:

1. Click **"Create Backend"** button
2. Select **"odum research"** web app
3. Choose region: **europe-west2**
4. Skip GitHub connection (click "Skip" or "Continue without GitHub")
5. Click **"Create Backend"**
6. Wait 1-2 minutes for creation

**That's it!** Once created, you can deploy.

---

## 📋 Alternative: CLI (Interactive)

Run this command in your terminal:

```bash
cd /Users/Femi_1/Documents/odum/odum_website/presentations-portal
firebase apphosting:backends:create --app 1:1060025368044:web:95b700e83573c9a05a94c9
```

**When prompted:**

- **Region**: Type `europe-west2` or select from list
- **Connect GitHub?**: Type `n` (you can add later)
- **Backend name**: Press Enter for default

---

## ✅ After Backend Creation

1. **Verify backend exists:**

   ```bash
   firebase apphosting:backends:list
   ```

2. **Deploy your app:**

   ```bash
   npm run build
   npm run deploy:apphosting
   ```

   Or manually:

   ```bash
   firebase apphosting:backends:deploy <backend-id>
   ```

3. **Test authentication** - cookies should work perfectly! 🎉

---

## 🔍 Current Configuration

- **Project**: `central-element-323112` ✅
- **Web App**: `odum research` (1:1060025368044:web:95b700e83573c9a05a94c9) ✅
- **Region**: `europe-west2` ✅
- **Billing**: Blaze plan required ✅
- **Backend**: Needs to be created ⏳

---

## 📝 Need Help?

See detailed instructions in: `CREATE_BACKEND_STEPS.md`
