# Firebase Credentials Troubleshooting Guide

## Summary

This document helps troubleshoot Firebase Admin SDK credential issues.

---

## Current Environment Variables

The app checks these env vars in priority order:

1. **`FIREBASE_ADMIN_BASE64`** - Base64-encoded JSON (RECOMMENDED - most reliable)
2. **`FIREBASE_ADMIN_JSON`** - Raw JSON string
3. **`FIREBASE_SERVICE_ACCOUNT_KEY`** - Legacy var (sometimes accidentally set to file paths)

---

## Common Issues

### Issue: "Failed to parse service account key from Base64"

**Symptoms:**
- Console shows: `Failed to parse service account key from Base64. SyntaxError: Unexpected token 'K'...`
- The decoded content looks like garbled text starting with "K"

**Cause:** 
- `FIREBASE_SERVICE_ACCOUNT_KEY` is set to a file path (e.g., `C:\Users\HP\Downloads\...`) instead of actual credentials
- The valid credentials are in `FIREBASE_ADMIN_BASE64` but it's checked AFTER the invalid var

**Fix (Already Applied):**
The code now prioritizes `FIREBASE_ADMIN_BASE64` over `FIREBASE_SERVICE_ACCOUNT_KEY`.

---

## How to Set Up Credentials

### Option 1: Base64-encoded (RECOMMENDED)

1. Get your service account JSON from Firebase Console
2. Encode to Base64:
   
```
powershell
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content service-account.json -Raw)))
   
```
3. Add to `.env.local`:
   
```
   FIREBASE_ADMIN_BASE64=<your-base64-string>
   
```

### Option 2: Raw JSON

Add to `.env.local`:
```
FIREBASE_ADMIN_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----..."}
```

### Option 3: Local file

Place `service-account.json` in project root.

---

## Diagnostic Script

Run this to check your environment:
```
bash
npx tsx scripts/diagnose-firebase-credentials.ts
```

---

## Files Updated

- `src/firebase/server-client.ts` - Fixed priority order for env vars
- `src/firebase/admin.ts` - Fixed priority order for env vars
- `scripts/diagnose-firebase-credentials.ts` - New diagnostic script
