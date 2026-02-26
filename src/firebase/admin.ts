// src\firebase\admin.ts
import 'server-only';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

function getServiceAccount() {
    let serviceAccountKey =
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
        process.env.FIREBASE_ADMIN_BASE64 ||
        process.env.FIREBASE_ADMIN_JSON;

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
                // console.log(`[src/firebase/admin.ts] Truncating 4n+1...`); // reduced log noise
                bodyClean = bodyClean.slice(0, -1);
                bodyClean = bodyClean.slice(0, -2) + '==';
            }

            // Fix Padding
            while (bodyClean.length % 4 !== 0) {
                bodyClean += '=';
            }

            const bodyFormatted = bodyClean.match(/.{1,64}/g)?.join('\n') || bodyClean;
            serviceAccount.private_key = `${header}\n${bodyFormatted}\n${footer}\n`;
        } else {
            serviceAccount.private_key = rawKey.trim().replace(/\\n/g, '\n');
        }
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
        console.error('[Firebase Admin] Error in getAdminFirestore:', error);
        throw error;
    }
}

export function getAdminAuth() {
    try {
        const app = getOrInitAdminApp();
        return getAuth(app);
    } catch (error) {
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


