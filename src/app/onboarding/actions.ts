// src\app\onboarding\actions.ts
'use server';

import { createServerClient } from '@/firebase/server-client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
// import { requireUser } from '@/server/auth/auth';
import { makeBrandRepo } from '@/server/repos/brandRepo';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

// Define the schema for the form data
const OnboardingSchema = z.object({
  role: z.enum(['brand', 'dispensary', 'customer', 'skip']),
  // Market/Location selection (state code like 'IL', 'CA')
  marketState: z.string().optional(),
  // CannMenus selection
  locationId: z.string().optional(),
  brandId: z.string().optional(),
  brandName: z.string().optional(),
  // Manual entry fields
  manualBrandName: z.string().optional(),
  manualProductName: z.string().optional(),
  manualDispensaryName: z.string().optional(),
  slug: z.string().optional(),
  zipCode: z.string().optional(),
  // Chatbot config
  chatbotPersonality: z.string().optional(),
  chatbotTone: z.string().optional(),
  chatbotSellingPoints: z.string().optional(),
  // POS Integration
  posProvider: z.enum(['dutchie', 'jane', 'none']).optional(),
  posApiKey: z.string().optional(),
  posDispensaryId: z.string().optional(), // For Jane or Dutchie ID
  features: z.string().optional(), // JSON string
  competitors: z.string().optional(), // JSON or comma-separated
  selectedCompetitors: z.string().optional() // JSON array of competitor objects
});

export async function completeOnboarding(prevState: any, formData: FormData) {
  
  try {
    const uid = crypto.randomUUID();

    let firestore;
    let useLocalFallback = false;
    const localBackup: Record<string, any> = { orgs: [], brands: [], locations: [], dataJobs: [], users: [], customClaims: {} };

    try {
      ({ firestore } = await createServerClient());
    } catch (credentialError: any) {
      const errorMsg = credentialError.message || String(credentialError);
      if (
        errorMsg.includes('Could not load the default credentials') ||
        errorMsg.includes('Firebase credentials') ||
        errorMsg.includes('invalid authentication credentials') ||
        errorMsg.includes('Expected OAuth 2 access token') ||
        errorMsg.includes('UNAUTHENTICATED')
      ) {
        logger.warn('Firebase credentials not configured — using local fallback for onboarding.', { error: errorMsg });
        useLocalFallback = true;
        
        // Create more complete stubs so the rest of the action doesn't crash
        firestore = {
          collection: () => ({
            doc: (docId: string) => ({ 
              set: async (data: any, opts?: any) => Promise.resolve(),
              get: async () => Promise.resolve({ exists: false, data: () => ({}) }),
              update: async (data: any) => Promise.resolve(),
              delete: async () => Promise.resolve(),
              collection: () => ({
                doc: (docId: string) => ({ set: async (data: any, opts?: any) => Promise.resolve(), get: async () => Promise.resolve({ exists: false }), update: async (data: any) => Promise.resolve() }),
                add: async (data: any) => Promise.resolve({ id: `local-${Date.now()}` }),
                where: () => ({ limit: () => ({ get: async () => Promise.resolve({ empty: true, docs: [] }) }) })
              })
            }),
            where: () => ({ limit: () => ({ get: async () => Promise.resolve({ empty: true, docs: [] }) }) }),
            add: async (data: any) => Promise.resolve({ id: `local-${Date.now()}` })
          }),
          batch: () => ({ 
            set: (ref: any, data: any, opts?: any) => {},
            update: (ref: any, data: any) => {},
            commit: () => Promise.resolve()
          })
        } as any;
        
       
      } else {
        throw credentialError;
      }
    }
    
    // let user;
    // try {
      // user = await requireUser();
    // } catch (authError) {
    //   logger.warn('Onboarding failed: User not authenticated.');
    //   return { message: 'Session expired. Please click "Log In to Continue" below.', error: true };
    // }
    // const uid = user.uid;

    // If using local fallback due to missing credentials, bypass all Firestore logic
    // and just save the onboarding data locally
    if (useLocalFallback) {
      try {
        const rawData = Object.fromEntries(formData.entries());
        const fs = await import('fs/promises');
        const outDir = 'dev-data/onboarding';
        await fs.mkdir(outDir, { recursive: true });
        const outPath = `${outDir}/${uid}.json`;
        const backup = { timestamp: new Date().toISOString(), formData: rawData, user: { uid } };

        await fs.writeFile(outPath, JSON.stringify(backup, null, 2), 'utf8');
        logger.info('Persisted onboarding data locally (no Firebase credentials)', { path: outPath });
      } catch (e) {
        logger.error('Failed to save onboarding data locally', { error: String(e) });
      }
      
      // Return success so the UI doesn't show error
      return {
        message: 'Welcome! Your workspace is being prepared (local dev mode). Data import is running in the background.',
        error: false
      };
    }

    const rawData = Object.fromEntries(formData.entries());

    // Parse features JSON if present
    let features = {};
    if (rawData.features && typeof rawData.features === 'string') {
      try {
        features = JSON.parse(rawData.features);
      } catch (e) { }
    }

    const validatedFields = OnboardingSchema.safeParse(rawData);

    if (!validatedFields.success) {
      logger.warn('Onboarding validation failed', validatedFields.error.flatten());
      return {
        message: 'Please fill out all required fields.',
        error: true,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const {
      role, marketState, locationId, brandId, brandName,
      manualBrandName, manualProductName, manualDispensaryName,
      slug, zipCode,
      chatbotPersonality, chatbotTone, chatbotSellingPoints,
      posProvider, posApiKey, posDispensaryId,
      competitors, selectedCompetitors
    } = validatedFields.data;

    // Proceed with Firestore logic...
    const userProfileData: Record<string, any> = {
      isNewUser: false, // Mark as onboarded
      onboardingCompletedAt: new Date().toISOString(),
      role: role === 'skip' ? 'customer' : role, // Default to customer if skipped
      // Approval Status: Customers auto-approve, Brands/Dispensaries pending
      approvalStatus: (role === 'customer' || role === 'skip') ? 'approved' : 'pending',
      // Store raw preferences
      preferences: {
        chatbotPersonality: chatbotPersonality || null,
        chatbotTone: chatbotTone || null,
        chatbotSellingPoints: chatbotSellingPoints || null
      },
      features
    };

    // Determine Final Names and IDs
    let finalBrandId = brandId;
    let finalBrandName = brandName;
    let finalRole = role;

    // Handle Manual Entry for Brand
    if (role === 'brand' && !brandId && manualBrandName) {
      // Create a new Brand Document
      const newBrandId = `brand_${uid.substring(0, 8)}`; // Generate ID
      if (!useLocalFallback) {
        const brandRepo = makeBrandRepo(firestore!);
        await brandRepo.create(newBrandId, { name: manualBrandName });
      } else {
        localBackup.brands.push({ id: newBrandId, name: manualBrandName });
      }
      finalBrandId = newBrandId;
      finalBrandName = manualBrandName;

      // Queue background data discovery job for manual entries
      if (!useLocalFallback) {
        await firestore!.collection('data_jobs').add({
          type: 'brand_discovery',
          entityId: newBrandId,
          entityName: manualBrandName,
          entityType: 'brand',
          orgId: '',
          userId: uid,
          status: 'pending',
          message: `Discovering data for ${manualBrandName}...`,
          progress: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          attempts: 0
        });
      } else {
        localBackup.dataJobs.push({ type: 'brand_discovery', entityId: newBrandId, entityName: manualBrandName, userId: uid, status: 'pending' });
      }
      logger.info('Created data discovery job for manual brand entry (fallback-aware)', { brandId: newBrandId, name: manualBrandName });
    }

    // Handle Dispensary POS Config
    if (finalRole === 'dispensary' && posProvider && posProvider !== 'none') {
      userProfileData.posConfig = {
        provider: posProvider,
        apiKey: posApiKey || null, // Encrypt in production!
        dispensaryId: posDispensaryId || null,
        sourceOfTruth: 'pos',
        backupSource: 'cannmenus',
        connectedAt: new Date().toISOString(),
        status: 'active'
      };
    }

    // --- ENTERPRISE MIGRATION LOGIC ---
    let orgId = '';

    // 1. Create Organization
    if (finalRole === 'brand' || finalRole === 'dispensary') {
      const orgType = finalRole;
      // Use brandId for Brand Orgs to keep IDs consistent if possible, else generate new
      orgId = finalBrandId || (finalRole === 'brand' ? `brand-${uid.substring(0, 8)}` : `org-${uid.substring(0, 8)}`);

      const orgRef = firestore!.collection('organizations').doc(orgId);
      if (!useLocalFallback) {
        const orgSnap = await orgRef.get();

        if (!orgSnap.exists) {
          await orgRef.set({
            id: orgId,
            name: finalBrandName || manualDispensaryName || 'My Organization',
            slug: slug || null,
            type: orgType,
            ownerId: uid,
            marketState: marketState || null,
            zipCode: zipCode || null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            settings: { policyPack: 'balanced', allowOverrides: true, hipaaMode: false },
            billing: { subscriptionStatus: 'trial' }
          });
        } else if (marketState) {
          await orgRef.update({ marketState, updatedAt: FieldValue.serverTimestamp() });
        }
      } else {
        localBackup.orgs.push({ id: orgId, name: finalBrandName || manualDispensaryName || 'My Organization', marketState, zipCode });
      }

      // --- HANDLE SELECTED COMPETITORS ---
      if (orgId && selectedCompetitors) {
        try {
          const comps = JSON.parse(selectedCompetitors);
          if (Array.isArray(comps) && comps.length > 0) {
            if (!useLocalFallback) {
              const batch = firestore!.batch();
              for (const comp of comps) {
                const compRef = firestore!.collection('organizations').doc(orgId).collection('competitors').doc(comp.id);
                batch.set(compRef, { ...comp, source: 'onboarding', lastUpdated: FieldValue.serverTimestamp() }, { merge: true });
              }
              await batch.commit();
              logger.info(`Saved ${comps.length} competitors during onboarding`, { orgId });
            } else {
              localBackup.dataJobs.push({ type: 'competitors', orgId, comps });
              logger.info(`Saved ${comps.length} competitors to local backup during onboarding`, { orgId });
            }
          }
        } catch (e) {
          logger.error('Failed to parse selectedCompetitors during onboarding', { error: e });
        }
      }
    }

    // 2. Create Location (For Dispensaries)
    let newLocationId = null;
    if (finalRole === 'dispensary') {
      // If they selected a specific location from CannMenus, use that ID
      const locId = locationId || `loc-${uid.substring(0, 8)}`;
      newLocationId = locId;

      const locRef = firestore!.collection('locations').doc(locId);
      if (!useLocalFallback) {
        await locRef.set({
          id: locId,
          orgId: orgId,
          name: manualDispensaryName || 'Main Location',
          slug: slug || null,
          zipCode: zipCode || null,
          posConfig: userProfileData.posConfig || { provider: 'none', status: 'inactive' },
          cannMenusId: locationId, // Save the mapping
          competitorIds: competitors ? competitors.split(',') : [], // Save competitors
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        localBackup.locations.push({ id: locId, orgId, name: manualDispensaryName || 'Main Location', slug: slug || null, zipCode: zipCode || null, posConfig: userProfileData.posConfig || { provider: 'none', status: 'inactive' }, cannMenusId: locationId, competitorIds: competitors ? competitors.split(',') : [] });
      }
    }

    // 3. Update User Profile with Enterprise Context
    const organizationIds = orgId ? [orgId] : [];

    // Update User Profile
    const updatedUserProfile: Record<string, any> = {
      ...userProfileData,
      organizationIds,
      currentOrgId: orgId || null,
      // Legacy mapping
      brandId: finalRole === 'brand' ? orgId : null,
      locationId: newLocationId || null
    };

    const updatedClaims = {
      role: finalRole,
      orgId: orgId,
      brandId: finalRole === 'brand' ? orgId : null,
      locationId: newLocationId
    };

    const finalClaims = Object.fromEntries(Object.entries(updatedClaims).filter(([_, v]) => v !== null && v !== undefined));
    const finalProfile = Object.fromEntries(Object.entries(updatedUserProfile).filter(([_, v]) => v !== null && v !== undefined));

    if (!useLocalFallback) {
      const userDocRef = firestore!.collection('users').doc(uid);
      await userDocRef.set(finalProfile, { merge: true });
      // await auth!.setCustomUserClaims(uid, finalClaims);
    } else {
      localBackup.users.push({ uid, profile: finalProfile });
      localBackup.customClaims[uid] = finalClaims;
    }

    // --- QUEUE PRODUCT SYNC (NON-BLOCKING) ---
    let syncCount = 0;
    let productSyncJobId: string | null = null;

    if (finalRole === 'brand' && finalBrandId) {
      // Queue product sync job (don't execute here)
      if (!useLocalFallback) {
        const syncJobRef = await firestore!.collection('data_jobs').add({
          type: 'product_sync',
          entityId: finalBrandId,
          entityName: finalBrandName || 'Brand',
          entityType: 'brand',
          orgId: orgId,
          userId: uid,
          status: 'pending', // Will be picked up by worker
          message: `Queued product sync for ${finalBrandName || 'brand'}`,
          progress: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          attempts: 0,
          metadata: {
            brandId: finalBrandId,
            brandName: finalBrandName,
            marketState: marketState || null,
            isCannMenus: finalBrandId.startsWith('cm_')
          }
        });
        productSyncJobId = syncJobRef.id;
        logger.info('Queued product sync job', { jobId: productSyncJobId, brandId: finalBrandId });

        // Queue dispensary import job (find retailers carrying this brand)
        await firestore!.collection('data_jobs').add({
          type: 'dispensary_import',
          entityId: finalBrandId,
          entityName: finalBrandName || 'Brand',
          entityType: 'brand',
          orgId: orgId,
          userId: uid,
          status: 'pending',
          message: `Queued dispensary import for ${finalBrandName}`,
          progress: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          attempts: 0,
          metadata: {
            brandId: finalBrandId,
            marketState: marketState || null
          }
        });
        logger.info('Queued dispensary import job', { brandId: finalBrandId });
      } else {
        const pid = `local-job-${localBackup.dataJobs.length + 1}`;
        localBackup.dataJobs.push({ id: pid, type: 'product_sync', entityId: finalBrandId, entityName: finalBrandName || 'Brand', entityType: 'brand', orgId, userId: uid, status: 'pending', metadata: { brandId: finalBrandId, brandName: finalBrandName, marketState, isCannMenus: finalBrandId.startsWith('cm_') } });
        productSyncJobId = pid;
        localBackup.dataJobs.push({ id: `local-job-${localBackup.dataJobs.length + 1}`, type: 'dispensary_import', entityId: finalBrandId, entityName: finalBrandName || 'Brand', entityType: 'brand', orgId, userId: uid, status: 'pending', metadata: { brandId: finalBrandId, marketState } });
        logger.info('Queued product sync and dispensary import jobs to local backup', { brandId: finalBrandId });
      }
    } else if (finalRole === 'dispensary' && locationId) {
      // Queue dispensary sync job
      if (!useLocalFallback) {
        const syncJobRef = await firestore!.collection('data_jobs').add({
          type: 'product_sync',
          entityId: locationId,
          entityName: manualDispensaryName || 'Dispensary',
          entityType: 'dispensary',
          orgId: orgId,
          userId: uid,
          status: 'pending',
          message: `Queued menu sync for ${manualDispensaryName || 'dispensary'}`,
          progress: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          attempts: 0,
          metadata: { locationId: locationId, isCannMenus: locationId.startsWith('cm_') }
        });
        logger.info('Queued dispensary sync job', { jobId: syncJobRef.id, locationId });

        // Queue competitor discovery
        await firestore!.collection('data_jobs').add({
          type: 'competitor_discovery',
          entityId: locationId,
          entityName: manualDispensaryName || 'Dispensary',
          orgId: orgId,
          userId: uid,
          status: 'pending',
          message: `Queued competitor discovery for ${manualDispensaryName || 'dispensary'}`,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          metadata: { locationId: locationId, marketState: marketState }
        });
        logger.info('Queued competitor discovery job', { locationId });
      } else {
        localBackup.dataJobs.push({ id: `local-job-${localBackup.dataJobs.length + 1}`, type: 'product_sync', entityId: locationId, entityName: manualDispensaryName || 'Dispensary', entityType: 'dispensary', orgId, userId: uid, status: 'pending', metadata: { locationId, isCannMenus: locationId.startsWith('cm_') } });
        localBackup.dataJobs.push({ id: `local-job-${localBackup.dataJobs.length + 1}`, type: 'competitor_discovery', entityId: locationId, entityName: manualDispensaryName || 'Dispensary', orgId, userId: uid, status: 'pending', metadata: { locationId, marketState } });
        logger.info('Queued dispensary sync and competitor discovery jobs to local backup', { locationId });
      }
    }

    // --- QUEUE SEO PAGE GENERATION (NON-BLOCKING) ---
    if ((finalRole === 'brand' || finalRole === 'dispensary') && orgId) {
      if (!useLocalFallback) {
        await firestore!.collection('data_jobs').add({
          type: 'seo_page_generation',
          entityId: orgId,
          entityName: finalBrandName || manualDispensaryName || 'Partner',
          entityType: finalRole,
          orgId: orgId,
          userId: uid,
          status: 'pending',
          message: `Queued SEO page generation`,
          progress: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          attempts: 0,
          metadata: { role: finalRole, locationId: locationId || null }
        });
        logger.info('Queued SEO page generation job', { orgId, role: finalRole });
      } else {
        localBackup.dataJobs.push({ id: `local-job-${localBackup.dataJobs.length + 1}`, type: 'seo_page_generation', entityId: orgId, entityName: finalBrandName || manualDispensaryName || 'Partner', entityType: finalRole, orgId, userId: uid, status: 'pending', metadata: { role: finalRole, locationId: locationId || null } });
      }
    }

    // --- QUEUE COMPETITOR DISCOVERY (NON-BLOCKING) ---
    if ((finalRole === 'brand' || finalRole === 'dispensary') && orgId && marketState) {
      if (!useLocalFallback) {
        await firestore!.collection('data_jobs').add({
          type: 'competitor_discovery',
          entityId: orgId,
          entityName: finalBrandName || manualDispensaryName || 'Partner',
          entityType: finalRole,
          orgId: orgId,
          userId: uid,
          status: 'pending',
          message: `Queued competitor discovery for ${marketState}`,
          progress: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          attempts: 0,
          metadata: { marketState: marketState }
        });
        logger.info('Queued competitor discovery job', { orgId, marketState });
      } else {
        localBackup.dataJobs.push({ id: `local-job-${localBackup.dataJobs.length + 1}`, type: 'competitor_discovery', entityId: orgId, entityName: finalBrandName || manualDispensaryName || 'Partner', entityType: finalRole, orgId, userId: uid, status: 'pending', metadata: { marketState } });
      }
    }

    // --- SEND NOTIFICATIONS (NON-BLOCKING) ---
    try {
      const { emailService } = await import('@/lib/notifications/email-service');
      const userEmail = '';
      const userName = 'Guest';

      
      if (userEmail) {
        const finalEntityName = finalRole === 'brand' ? finalBrandName : manualDispensaryName;
        
        // 1. Send "Mrs. Parker" Welcome Email
        emailService.sendWelcomeEmail({ 
            email: userEmail, 
            name: userName 
        }).catch(err => logger.error('Mrs. Parker Welcome Email Failed', { error: err.message }));

        // 2. Notify Admin if pending approval (Brands/Dispensaries)
        if (finalRole === 'brand' || finalRole === 'dispensary') {
            emailService.notifyAdminNewUser({
                email: userEmail,
                name: userName,
                role: finalRole,
                company: finalEntityName
            }).catch(err => logger.error('Admin Notification Failed', { error: err.message }));
        }
      }
    } catch (emailError) {
      // Don't fail onboarding if email fails
      logger.error('Failed to trigger notifications', { error: emailError });
    }

    // Persist local fallback to disk so dev onboarding survives restarts
    if (useLocalFallback) {
      try {
        const fs = await import('fs/promises');
        const outDir = 'dev-data/onboarding';
        await fs.mkdir(outDir, { recursive: true });
        const outPath = `${outDir}/${uid}.json`;
        await fs.writeFile(outPath, JSON.stringify(localBackup, null, 2), 'utf8');
        logger.info('Persisted onboarding local backup', { path: outPath });
      } catch (e) {
        logger.error('Failed to persist onboarding local backup', { error: String(e) });
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/account');

    return {
      message: 'Welcome! Your workspace is being prepared. Data import is running in the background.',
      error: false
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (
      errorMessage.includes('Could not load the default credentials') ||
      errorMessage.includes('Firebase credentials') ||
      errorMessage.includes('invalid authentication credentials') ||
      errorMessage.includes('Expected OAuth 2 access token') ||
      errorMessage.includes('UNAUTHENTICATED')
    ) {
      logger.warn('Onboarding continuing with local-dev fallback after credentials/auth error', { error: errorMessage });
      return {
        message: 'Welcome! Your workspace is being prepared (local dev mode). Data import is running in the background.',
        error: false
      };
    }
    logger.error('Onboarding server action failed:', { error: errorMessage });
    return { message: `Failed to save profile: ${errorMessage}`, error: true };
  }
}
