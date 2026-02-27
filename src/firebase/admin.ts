// src\firebase\admin.ts
import 'server-only';
import { config } from 'dotenv';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Ensure local/dev scripts and server runtimes can read both env files.
config({ path: '.env.local' });
config({ path: '.env' });

function isAuthCredentialError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error || '');
    const lower = message.toLowerCase();
    return (
        lower.includes('invalid authentication credentials') ||
        lower.includes('expected oauth 2 access token') ||
        lower.includes('unauthenticated') ||
        lower.includes('could not load the default credentials')
    );
}

function createFirestoreStub() {
    const makeDoc = (id?: string) => ({
        id: id || 'dev-doc',
        async get() { return { exists: false, id: id || 'dev-doc', data: () => null, ref: {} as any }; },
        async set(_data: any, _opts?: any) { return; },
        async update(_data: any) { return; },
        async delete() { return; },
        collection: () => makeCollection()
    });

    const makeCollection = () => ({
        doc: (docId?: string) => makeDoc(docId),
        where: () => makeCollection(),
        orderBy: () => makeCollection(),
        limit: () => makeCollection(),
        offset: () => makeCollection(),
        count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) }),
        async add(_data: any) { return { id: `dev-${Date.now()}` }; },
        async get() { return { empty: true, docs: [], forEach: (_cb: any) => {}, size: 0 }; }
    });

    return {
        collection: (_path: string) => makeCollection(),
        doc: (_path: string) => makeDoc(),
        runTransaction: async (fn: any) => {
            return fn({
                get: async () => ({ exists: false }),
                set: async () => {},
                update: async () => {},
                delete: async () => {}
            });
        },
        batch: () => ({ set: () => {}, update: () => {}, delete: () => {}, commit: async () => {} }),
        settings: () => {}
    } as any;
}

function createAuthStub() {
    return {
        verifyIdToken: async (_token: string) => ({ uid: 'dev-user', email: 'dev@localhost', email_verified: true }),
        getUser: async (uid: string) => ({ uid, customClaims: {}, email: 'dev@localhost' }),
        setCustomUserClaims: async (_uid: string, _claims: any) => { return; },
        createUser: async (_params: any) => ({ uid: 'dev-user' }),
        deleteUser: async (_uid: string) => { return; }
    } as any;
}

function shouldUseLocalCredentialFallback(error: unknown): boolean {
    return process.env.NODE_ENV !== 'production' && isAuthCredentialError(error);
}

function getServiceAccount() {
    // Check which env var has valid data - prioritize ones that actually contain data
    // FIREBASE_SERVICE_ACCOUNT_KEY often gets set to file paths accidentally
    let serviceAccountKey =
        process.env.FIREBASE_ADMIN_BASE64 ||
        process.env.FIREBASE_ADMIN_JSON ||
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
    console.log('[Firebase Admin] Key present:', !!serviceAccountKey);
    
    // Debug: show which env var is being used
    if (process.env.FIREBASE_ADMIN_BASE64) {
        console.log('[Firebase Admin] Using FIREBASE_ADMIN_BASE64');
    } else if (process.env.FIREBASE_ADMIN_JSON) {
        console.log('[Firebase Admin] Using FIREBASE_ADMIN_JSON');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log('[Firebase Admin] Using FIREBASE_SERVICE_ACCOUNT_KEY');
        // Validate it looks like JSON or base64, not a file path
        const val = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (val && val.length < 100 && !val.includes('{')) {
            console.warn('[Firebase Admin] WARNING: FIREBASE_SERVICE_ACCOUNT_KEY looks like a file path, not credentials!');
        }
    }

    // Local file fallback for non-production environments
    if (!serviceAccountKey && process.env.NODE_ENV !== 'production') {
        try {
            const fs = require('fs');
            const path = require('path');
            const localSaPath = path.resolve(process.cwd(), 'service-account.json');
            if (fs.existsSync(localSaPath)) {
                serviceAccountKey = fs.readFileSync(localSaPath, 'utf-8');
                console.log('[Firebase Admin] Loaded credentials from local service-account.json');
            }
        } catch (err) {
            console.warn('[Firebase Admin] Failed to read local service-account.json', err);
        }
    }

    if (!serviceAccountKey) {
        return null;
    }

    let serviceAccount;
    try {
        // First try to parse as raw JSON
        serviceAccount = JSON.parse(serviceAccountKey);
    } catch (e) {
        // If not valid JSON, try base64 decoding
        try {
            const json = Buffer.from(serviceAccountKey, "base64").toString("utf8");
            serviceAccount = JSON.parse(json);
        } catch (decodeError) {
            console.error("Failed to parse service account key from Base64 or JSON.", decodeError);
            return null;
        }
    }

    // Keep private key handling conservative: only normalize escaped newlines.
    // Over-aggressive body rewriting can corrupt valid keys.
    if (serviceAccount && typeof serviceAccount.private_key === 'string') {
        const rawKey = serviceAccount.private_key;
        serviceAccount.private_key = rawKey.trim().replace(/\\n/g, '\n');
    }

    return serviceAccount;
}

function getProjectId() {
    return (
        process.env.FIREBASE_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.GCLOUD_PROJECT
    );
}

function getOrInitAdminApp() {
    const existing = getApps()[0];
    if (existing) return existing;

    const serviceAccount = getServiceAccount();
    if (serviceAccount) {
        return initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id || getProjectId(),
        });
    }

    return initializeApp({
        credential: applicationDefault(),
        projectId: getProjectId(),
    });
}

export function getAdminFirestore() {
    try {
        const app = getOrInitAdminApp();
        const firestore = getFirestore(app);
        try {
            firestore.settings({ ignoreUndefinedProperties: true, preferRest: true } as any);
        } catch (_e) {
            // Ignore if settings were already initialized
        }
        return firestore;
    } catch (error) {
        if (shouldUseLocalCredentialFallback(error)) {
            console.warn('[Firebase Admin] Falling back to local Firestore stub due to credential error.');
            return createFirestoreStub();
        }
        console.error('[Firebase Admin] Error in getAdminFirestore:', error);
        throw error;
    }
}

export function getAdminAuth() {
    try {
        const app = getOrInitAdminApp();
        return getAuth(app);
    } catch (error) {
        if (shouldUseLocalCredentialFallback(error)) {
            console.warn('[Firebase Admin] Falling back to local Auth stub due to credential error.');
            return createAuthStub();
        }
        console.error('[Firebase Admin] Error in getAdminAuth:', error);
        throw error;
    }
}

export function getAdminStorage() {
    try {
        const app = getOrInitAdminApp();
        return getStorage(app);
    } catch (error) {
        console.error('[Firebase Admin] Error in getAdminStorage:', error);
        throw error;
    }
}
