
// src\firebase\server-client.ts
import {
  getApps,
  initializeApp,
  App,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { DomainUserProfile } from "@/types/domain";

let app: App;

function getProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT
  );
}

function getServiceAccount() {
  let serviceAccountKey =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_ADMIN_BASE64 ||
    process.env.FIREBASE_ADMIN_JSON;
  console.log('Initializing Firebase Admin. Key present:', !!serviceAccountKey);

  if (!serviceAccountKey && process.env.NODE_ENV !== 'production') {
    try {
      // Fallback for local development
      const fs = require('fs');
      const path = require('path');
      const cwd = process.cwd();
      console.log(`[server-client] Current working directory: ${cwd}`);

      // Search paths for service-account.json
      const searchPaths = [
        path.resolve(cwd, 'service-account.json'),
        path.resolve(cwd, '..', 'service-account.json'),
        path.resolve(cwd, '..', '..', 'service-account.json'),
      ];

      for (const tryPath of searchPaths) {
        console.log(`[server-client] Checking for SA at: ${tryPath}`);
        if (fs.existsSync(tryPath)) {
          serviceAccountKey = fs.readFileSync(tryPath, 'utf-8');
          console.log(`[server-client] LOADED credentials from: ${tryPath}`);
          break;
        }
      }
    } catch (e) {
      console.warn('[server-client] Failed to check for local service-account.json:', e);
    }
  } else {
    console.log('[server-client] Using Firebase service account env credentials');
  }

  if (!serviceAccountKey) {
    console.warn("Firebase service account env not set and no local file found. Using default credentials.");
    return null;
  }

  let serviceAccount;

  try {
    // First try to parse as raw JSON
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (e) {
    try {
      const json = Buffer.from(serviceAccountKey, "base64").toString("utf8");
      serviceAccount = JSON.parse(json);
    } catch (decodeError) {
      console.error("Failed to parse service account key from Base64.", decodeError);
      throw new Error("Firebase service account key is not a valid JSON string or Base64-encoded JSON string.");
    }
  }

  // Sanitize private_key to prevent "Unparsed DER bytes" errors
  // Sanitize private_key to prevent "Unparsed DER bytes" errors
  if (serviceAccount && typeof serviceAccount.private_key === 'string') {
    const rawKey = serviceAccount.private_key;

    // Pattern to capture Header (group 1), Body (group 2), Footer (group 3)
    const pemPattern = /(-+BEGIN\s+.*PRIVATE\s+KEY-+)([\s\S]+?)(-+END\s+.*PRIVATE\s+KEY-+)/;
    const match = rawKey.match(pemPattern);

    if (match) {
      const header = "-----BEGIN PRIVATE KEY-----";
      const footer = "-----END PRIVATE KEY-----";
      const bodyRaw = match[2];
      let bodyClean = bodyRaw.replace(/[^a-zA-Z0-9+/=]/g, '');

      // 4n+1 length invalid. Try 1 byte (xx==).
      if (bodyClean.length % 4 === 1) {
        console.log(`[src/firebase/server-client.ts] Truncating 4n+1 and forcing double padding: ${bodyClean.length} -> 1628 (xx==)`);
        bodyClean = bodyClean.slice(0, -1);
        bodyClean = bodyClean.slice(0, -2) + '==';
      }

      // Fix Padding
      while (bodyClean.length % 4 !== 0) {
        bodyClean += '=';
      }

      const bodyFormatted = bodyClean.match(/.{1,64}/g)?.join('\n') || bodyClean;
      serviceAccount.private_key = `${header}\n${bodyFormatted}\n${footer}\n`;

      console.log(`[src/firebase/server-client.ts] Key Normalized. BodyLen: ${bodyClean.length}`);
    } else {
      serviceAccount.private_key = rawKey.trim().replace(/\\n/g, '\n');
    }
  }

  return serviceAccount;
}

/**
 * Creates a server-side Firebase client (admin SDK).
 * This function is idempotent, ensuring the app is initialized only once.
 */
// function getServiceAccount is defined above, let's use it.

export async function createServerClient() {
  // **DEV MODE**: If NO_AUTH is set, return complete stubs to bypass all Firebase operations
  if (process.env.NEXT_PUBLIC_NO_AUTH === 'true' || process.env.NO_AUTH === 'true') {
    console.log('[createServerClient] NO_AUTH mode enabled — returning stub Firebase client');
    
    const authStub: any = {
      verifyIdToken: async (token: string) => ({ uid: 'dev-user', email: 'dev@localhost', name: 'Dev User', email_verified: true }),
      getUser: async (uid: string) => ({ uid, customClaims: {}, email: 'dev@localhost' }),
      setCustomUserClaims: async (_uid: string, _claims: any) => { return; },
      createUser: async (_params: any) => ({ uid: 'dev-user' }),
      deleteUser: async (_uid: string) => { return; }
    };

    const makeDoc = (id?: string) => ({
      id: id || 'dev-doc',
      async get() { return { exists: false, id: id || 'dev-doc', data: () => null, ref: {} }; },
      async set(_data: any, _opts?: any) { return; },
      async update(_data: any) { return; },
      async delete() { return; },
      collection: (/* path */) => makeCollection()
    });

    const makeCollection = () => ({
      doc: (docId?: string) => makeDoc(docId),
      where: (/* field, op, value */) => makeCollection(),
      orderBy: (/* field, direction */) => makeCollection(),
      limit: (/* n */) => makeCollection(),
      offset: (/* n */) => makeCollection(),
      async get() { return { empty: true, docs: [], forEach: (_cb: any) => {}, size: 0 }; },
      async add(_data: any) { return { id: `dev-${Date.now()}` }; },
      count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) })
    });

    const firestoreStub: any = {
      collection: (_path: string) => makeCollection(),
      doc: (_path: string) => makeDoc(),
      runTransaction: async (fn: any) => { return fn({ get: async () => ({ exists: false }), set: async () => {}, update: async () => {}, delete: async () => {} }); },
      batch: () => ({ set: () => {}, update: () => {}, delete: () => {}, commit: async () => {} }),
      settings: () => {}
    };

    return { auth: authStub, firestore: firestoreStub };
  }

  // Ensure we use a unique app name to avoid "already exists" errors or race conditions
  // with other parts of the app that usually initialize the [DEFAULT] app.
  const appName = 'server-client-app';
  const existingApps = getApps().filter(a => a.name === appName);

  if (existingApps.length === 0) {
    // USE THE ROBUST HELPER FUNCTION
    const serviceAccountObj = getServiceAccount();

    if (serviceAccountObj) {
      app = initializeApp({
        credential: cert(serviceAccountObj)
      }, appName);
      console.log('Firebase initialized with Service Account config (isolated app)');
    } else {
      // Try to use Application Default Credentials
      try {
        console.log('Using Application Default Credentials (isolated app)');
        app = initializeApp({
          credential: applicationDefault(),
          projectId: getProjectId()
        }, appName);
      } catch (initError: any) {
        // If Application Default Credentials fail, provide a clear error message
        const msg = initError?.message || String(initError);
        if (msg.includes('Could not load the default credentials') || msg.includes('Firebase credentials')) {
          console.error('❌ Firebase Credentials Error: Could not load application default credentials.');
          console.error('   To fix, do ONE of the following:');
          console.error('   A) Set FIREBASE_SERVICE_ACCOUNT_KEY env var with your service account JSON (get it from Firebase Console > Project Settings > Service Accounts)');
          console.error('   B) Place service-account.json in the project root: ./service-account.json');
          console.error('   C) Run: gcloud auth application-default login');
          console.error('');
          console.error('   For now, pages that need Firebase will fail. Pages without auth bypass (like home/landing) should still load.');
        }
        throw initError;
      }
    }
  } else {
    app = existingApps[0]!;
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  try {
    firestore.settings({ ignoreUndefinedProperties: true, preferRest: true });
  } catch (e) {
    // Ignore if settings already applied
  }
  return { auth, firestore };
}

/**
 * Verify a Firebase ID token
 */
export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  const { auth } = await createServerClient();
  return auth.verifyIdToken(token);
}

/**
 * Get user profile from Firestore by UID
 */
export async function getUserProfile(uid: string): Promise<DomainUserProfile | null> {
  const { firestore } = await createServerClient();
  const userDoc = await firestore.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data() as DomainUserProfile;
}

/**
 * Get custom claims for a user
 */
export async function getUserClaims(uid: string): Promise<Record<string, any>> {
  const { auth } = await createServerClient();
  const user = await auth.getUser(uid);
  return user.customClaims || {};
}

/**
 * Set custom claims for a user (admin only)
 */
export async function setUserClaims(
  uid: string,
  claims: Record<string, any>
): Promise<void> {
  const { auth } = await createServerClient();
  await auth.setCustomUserClaims(uid, claims);
}

/**
 * Set user role (convenience function)
 */
export async function setUserRole(
  uid: string,
  role: 'brand' | 'dispensary' | 'customer' | 'super_user' | 'super_admin',
  additionalData?: { brandId?: string; locationId?: string; tenantId?: string }
): Promise<void> {
  const claims = {
    role,
    tenantId: additionalData?.tenantId || additionalData?.brandId || additionalData?.locationId,
    ...additionalData,
  };
  await setUserClaims(uid, claims);
}

