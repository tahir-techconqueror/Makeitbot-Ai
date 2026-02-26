# Firebase Credentials Setup Guide

## Error: "Could not load the default credentials"

If you see this error, it means the Firebase Admin SDK cannot find authentication credentials.

## Quick Fix (Choose ONE option):

### **OPTION A: Using Environment Variable (Recommended for Production)**

1. Get your Firebase service account:
   - Go to: https://console.firebase.google.com
   - Select your project → Project Settings (gear icon)
   - Go to "Service Accounts" tab
   - Click "Generate New Private Key"
   - This downloads a JSON file

2. Set environment variable:
   ```bash
   # On Windows (PowerShell):
   $env:FIREBASE_SERVICE_ACCOUNT_KEY = (Get-Content "C:\path\to\service-account.json" -Raw)
   
   # On Windows (Command Prompt):
   set FIREBASE_SERVICE_ACCOUNT_KEY=%cd%\service-account.json
   
   # On macOS/Linux:
   export FIREBASE_SERVICE_ACCOUNT_KEY=$(cat /path/to/service-account.json | base64)
   ```

3. Or add to `.env.local` file:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY=<entire JSON content pasted here>
   FIREBASE_PROJECT_ID=studio-567050101-bc6e8
   ```

### **OPTION B: Local Service Account File (Recommended for Development)**

1. Download service account JSON from Firebase Console
2. Place it in project root as `service-account.json`
   ```
   markitbot-for-brands/
   ├── service-account.json  ← Place here
   ├── src/
   ├── package.json
   └── ...
   ```

### **OPTION C: Google Cloud Application Default Credentials**

```bash
# Install Google Cloud SDK if not already installed
# Then run:
gcloud auth application-default login
```

---

## Files Affected by This Error

These files will fail if credentials are not configured:

- `src/firebase/server-client.ts` - Firebase Admin SDK initialization
- `src/app/onboarding/actions.ts` - User profile saving  
- `src/server/auth/auth.ts` - Authentication checks
- `src/lib/auth-helpers.ts` - User profile retrieval
- Any server action that calls `createServerClient()`

---

## Verify Setup

After setting credentials, restart your dev server:

```bash
npm run dev
```

Check console for:
```
✅ [server-client] LOADED credentials from: ...
   OR
✅ Firebase initialized with Service Account config
```

---

## If Still Getting Error

1. **Check .env files**
   - Delete `.env.local`, `.env`, `next.config.js`
   - Run `npm run dev` again

2. **Check permissions**
   - Ensure service account JSON is readable
   - Ensure you have access to that Firebase project

3. **Check file path**
   - If using file option, confirm `service-account.json` is in project root
   - Not in `src/`, not in any subdirectory

4. **Debug with:**
   ```bash
   node -e "console.log(require('fs').existsSync('./service-account.json'))"
   ```

---

## For Development Without Real Firebase

If you want to bypass Firebase entirely for development:

1. Run the app with the mock auth bypass already enabled (from previous session)
2. The `requireUser()` calls will return mock super_user tokens
3. You won't be able to save to Firestore, but you can develop UI/UX

---

## Support

- Firebase Console: https://console.firebase.google.com
- Firebase Admin SDK Docs: https://firebase.google.com/docs/admin/setup
- Service Account Setup: https://cloud.google.com/docs/authentication/getting-started

