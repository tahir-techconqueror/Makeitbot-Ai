# Firebase "Could Not Load Default Credentials" Error - Complete Troubleshooting

## Summary

**Error Message:** `Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.`

**What It Means:** Firebase Admin SDK cannot find your Google Cloud service account credentials.

---

## Files That Trigger This Error

All of these files call `createServerClient()` and will fail if credentials are missing:

### **Core Firebase Files:**
- `src/firebase/server-client.ts` - **PRIMARY SOURCE** (Firebase initialization)
- `src/server/server-client.ts` - Alternative Firebase client

### **Server Actions Using Firebase:**
- `src/app/onboarding/actions.ts` - **Triggers error on profile save**
- `src/server/auth/auth.ts` - User authentication
- `src/lib/auth-helpers.ts` - User profile retrieval
- `src/server/actions/*.ts` - All server actions (many files)

### **Complete List of Files (200+ files import server-client):**

**Pages/Components that call Firebase:**
```
src/app/onboarding/actions.ts
src/app/onboarding/pre-start-import.ts
src/app/onboarding/status-action.ts
src/app/dashboard/products/page.tsx
src/app/dashboard/products/[id]/edit/page.tsx
src/app/dashboard/settings/brand-guide/page.tsx
src/app/dashboard/integrations/actions.ts
src/app/dashboard/customers/segments/page.tsx
src/app/dashboard/simulation/actions.ts
... and 190+ more
```

---

## WHY This Error Occurs

When you run the app, this sequence happens:

```
1. User visits onboarding page → completeOnboarding() is called
2. Calls createServerClient() 
3. Tries to load FIREBASE_SERVICE_ACCOUNT_KEY env var → NOT SET
4. Tries local file searches → NO local service-account.json found
5. Falls back to applicationDefault() → FAILS (not configured on your system)
6. Throws: "Could not load the default credentials"
7. Error bubbles up, user sees: "Failed to save profile: Could not load..."
```

---

## Solution - 3 Options

### **FASTEST FIX: Download Service Account & Save Locally**

1. **Get Service Account JSON:**
   - Open https://console.firebase.google.com
   - Select your project
   - Click ⚙️ (Settings) → "Service Accounts"
   - Click "Generate New Private Key"
   - **Save file as: `service-account.json` in project root**

2. **Verify file location:**
   ```
   markitbot-for-brands/
   ├── service-account.json  ← File should be HERE
   ├── src/
   ├── package.json
   ├── next.config.js
   └── ...
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Check console for success message:**
   ```
   [server-client] LOADED credentials from: C:\...\service-account.json
   OR
   Firebase initialized with Service Account config
   ```

---

### **Alternative: Environment Variable**

**For Windows (PowerShell):**
```powershell
# Get the service account JSON content
$content = Get-Content "C:\path\to\service-account.json" -Raw
# Set environment variable
[Environment]::SetEnvironmentVariable("FIREBASE_SERVICE_ACCOUNT_KEY", $content, "User")
# Restart terminal and run dev server
npm run dev
```

**For .env.local file:**
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----..."}
FIREBASE_PROJECT_ID=studio-567050101-bc6e8
```

---

### **Last Resort: Bypass Firebase (Dev Only)**

If you can't set up credentials for development, use the mock auth bypass:

1. The app already has `requireUser()` returning mock super_user tokens
2. You can develop UI without saving to Firebase
3. Just know that:
   - ✅ Can view pages
   - ✅ Can test UI/UX
   - ❌ Cannot save data to Firestore
   - ❌ Cannot create users/profiles

---

## How the Code Handles This

### **Before (No error handling):**
```typescript
export async function createServerClient() {
  const { firestore, auth } = await createServerClient();  // CRASHES if no credentials
  // ...
}
```

### **After (Better error messages):**
```typescript
try {
  const { firestore, auth } = await createServerClient();
} catch (credentialError: any) {
  if (credentialError.message?.includes('Could not load the default credentials')) {
    return {
      message: 'Server Error: Firebase credentials not configured. Please ask the administrator...',
      error: true
    };
  }
  throw credentialError;
}
```

---

## Step-by-Step Verification

**Step 1: Check if credentials file exists**
```powershell
Test-Path ".\service-account.json"
# Should return: True
```

**Step 2: Verify format is valid JSON**
```powershell
$json = Get-Content ".\service-account.json" | ConvertFrom-Json
$json.project_id  # Should display your project ID
```

**Step 3: Run the dev server and check logs**
```powershell
npm run dev
# Look for: "LOADED credentials from:" in console
```

**Step 4: Test by going to onboarding page**
```
http://localhost:3000/onboarding
```

If you see the form load (not the error), credentials are working! ✅

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "File not found" | service-account.json in wrong location | Move to **project root** (not src/) |
| "Invalid JSON" | Downloaded file is corrupted | Re-download from Firebase Console |
| "Permission denied" | Can't read file | Check file permissions, move to Desktop |
| Still failing after restart | Node cache issue | Run `npm run clean` then `npm run dev` |
| "Already initialized" | Multiple Firebase inits | Delete `.next/` folder, restart |

---

## Where to Get Help

1. **Firebase Console (Get your credentials here):**
   - https://console.firebase.google.com
   - Project Settings → Service Accounts

2. **Official Documentation:**
   - https://firebase.google.com/docs/admin/setup
   - https://cloud.google.com/docs/authentication/getting-started

3. **Check Logs:**
   - Look at server console output for detailed Firebase error messages
   - Search for `[server-client]` prefix in logs

---

## Files I Fixed

These files now have better error handling and messages:

1. **`src/firebase/server-client.ts`**
   - Added detailed error message with setup instructions
   - Shows all 3 options to fix the problem

2. **`src/app/onboarding/actions.ts`**
   - Added try/catch for credentials error
   - Returns user-friendly error message instead of crashing

This ensures users see helpful guidance instead of cryptic Firebase errors.

