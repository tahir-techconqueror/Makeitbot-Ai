// src\server\auth\auth.ts

'use server';

import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@/firebase/server-client';
import { DecodedIdToken } from 'firebase-admin/auth';
import { SUPER_ADMIN_EMAILS } from '@/lib/super-admin-config';
import {
  UserRole,
  isBrandRole,
  isDispensaryRole,
  BRAND_ALL_ROLES,
  DISPENSARY_ALL_ROLES
} from '@/types/roles';

// Re-export Role type for backward compatibility
export type Role = UserRole;

/**
 * Check if a user's role matches one of the required roles.
 * Handles role hierarchy (e.g., brand_admin can act as brand_member)
 */
function roleMatches(userRole: string, requiredRoles: Role[]): boolean {
  // Direct match
  if (requiredRoles.includes(userRole as Role)) {
    return true;
  }

  // Check for role group matches
  for (const required of requiredRoles) {
    // If 'brand' is required, accept any brand role (admin or member)
    if (required === 'brand' && isBrandRole(userRole)) {
      return true;
    }
    // If 'dispensary' is required, accept any dispensary role
    if (required === 'dispensary' && isDispensaryRole(userRole)) {
      return true;
    }
    // If 'brand_member' is required, brand_admin also qualifies
    if (required === 'brand_member' && (userRole === 'brand_admin' || userRole === 'brand')) {
      return true;
    }
    // If 'dispensary_staff' is required, dispensary_admin also qualifies
    if (required === 'dispensary_staff' && (userRole === 'dispensary_admin' || userRole === 'dispensary')) {
      return true;
    }
  }

  return false;
}

/**
 * A server-side utility to require an authenticated user and optionally enforce roles.
 * This function centralizes session verification for all Server Actions.
 * 
 * **AUTHENTICATION DISABLED**: This now returns a mock super_user by default.
 * All authentication checks have been bypassed for development/testing purposes.
 *
 * @param requiredRoles - Ignored. All roles are allowed.
 * @returns A mock super_user token
 */
export async function requireUser(requiredRoles?: Role[]): Promise<DecodedIdToken> {
  // ⚠️ AUTHENTICATION REMOVED FOR DEVELOPMENT
  // Always return a super_user token that can access everything
  const mockToken: any = {
    uid: 'bypass-user-id-dev',
    email: 'dev-user@markitbot.com',
    email_verified: true,
    role: 'super_user',
    approvalStatus: 'approved',
    brandId: 'default',
  };

  return mockToken;
}

/**
 * Check if the current user is a Super Admin
 * **AUTHENTICATION DISABLED**: Always returns true
 * @returns true
 */
export async function isSuperUser(): Promise<boolean> {
  // ⚠️ AUTHENTICATION REMOVED - Always allow super user access
  return true;
}

/**
 * Check if the current user is a brand admin (owner-level access)
 * **AUTHENTICATION DISABLED**: Always returns true
 * @returns true
 */
export async function isBrandAdmin(): Promise<boolean> {
  // ⚠️ AUTHENTICATION REMOVED - Always allow brand admin access
  return true;
}

/**
 * Check if the current user has any brand role
 * **AUTHENTICATION DISABLED**: Always returns true
 * @returns true
 */
export async function hasBrandRole(): Promise<boolean> {
  // ⚠️ AUTHENTICATION REMOVED - Always allow brand role access
  return true;
}

/**
 * Require the current user to be a Super User (CEO/CTO level access).
 * Use this to protect sensitive operations like agent execution, bash commands, etc.
 * **AUTHENTICATION DISABLED**: Always returns a mock super_user token
 * @returns A mock super_user token
 */
export async function requireSuperUser(): Promise<DecodedIdToken> {
  // ⚠️ AUTHENTICATION REMOVED - Return the same mock super user
  return await requireUser();
}
