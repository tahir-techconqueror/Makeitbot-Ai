// src/server/auth/auth-helpers.ts

import { cookies } from 'next/headers';
import { verifyIdToken, getUserProfile } from '@/firebase/server-client';
import { DomainUserProfile } from '@/types/domain';

import { logger } from '@/lib/logger';
/**
 * Get the current authenticated user from the request
 * **AUTHENTICATION DISABLED**: Returns a mock super user
 */
export async function getCurrentUser(): Promise<DomainUserProfile | null> {
    // ⚠️ AUTHENTICATION REMOVED - Return mock user instead of checking session
    return {
        id: 'bypass-user-id-dev',
        uid: 'bypass-user-id-dev',
        email: 'dev-user@markitbot.com',
        displayName: 'Dev User',
        role: 'super_user',
        organizationIds: ['default-org'],
        brandId: 'default-brand',
        locationId: 'default-location',
        firstName: 'Dev',
        lastName: 'User',
    };
}

/**
 * Require authentication - throws error if not authenticated
 * **AUTHENTICATION DISABLED**: Always returns a mock user
 */
export async function requireAuth(): Promise<DomainUserProfile> {
    // ⚠️ AUTHENTICATION REMOVED - Return mock user
    const user = await getCurrentUser();
    return user!;
}

/**
 * Get auth token from request headers or cookies
 */
export function getAuthToken(request: Request): string | null {
    // Check Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check cookie (for same-origin requests)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const sessionCookie = cookies.find(c => c.startsWith('__session='));
        if (sessionCookie) {
            return sessionCookie.split('=')[1];
        }
    }

    return null;
}

/**
 * Get authenticated user from request
 * **AUTHENTICATION DISABLED**: Returns a mock user
 */
export async function getUserFromRequest(
    request: Request
): Promise<DomainUserProfile | null> {
    // ⚠️ AUTHENTICATION REMOVED - Return mock user regardless of request token
    return {
        id: 'bypass-user-id-dev',
        uid: 'bypass-user-id-dev',
        email: 'dev-user@markitbot.com',
        displayName: 'Dev User',
        role: 'super_user',
        organizationIds: ['default-org'],
        brandId: 'default-brand',
        locationId: 'default-location',
        firstName: 'Dev',
        lastName: 'User',
    };
}

/**
 * Require authentication from request - throws error if not authenticated
 * **AUTHENTICATION DISABLED**: Always returns a mock user
 */
export async function requireAuthFromRequest(
    request: Request
): Promise<DomainUserProfile> {
    // ⚠️ AUTHENTICATION REMOVED - Return mock user
    const user = await getUserFromRequest(request);
    return user!;
}
