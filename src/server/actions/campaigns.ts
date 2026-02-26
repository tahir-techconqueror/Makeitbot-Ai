// src\server\actions\campaigns.ts
'use server';

import { createServerClient } from '@/firebase/server-client';
import { getAdminFirestore } from '@/firebase/admin';
import { requireUser } from '@/server/auth/auth';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

export interface Campaign {
  id?: string;
  name: string;
  goal: string;
  audience: string;
  channel: string;
  subject: string;
  content: string;
  status: 'scheduled' | 'sent' | 'draft';
  orgId?: string;
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CampaignDeliveryRecord {
  id: string;
  email: string;
  fromEmail?: string;
  status: 'pending' | 'sent' | 'failed';
  subject?: string;
      createdAt?: Date;
  scheduledFor?: Date;
  sentAt?: Date;
  attemptedAt?: Date;
  error?: string;
}

export async function createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
  const user = await requireUser(['brand', 'super_user']);
  
  const { firestore: db } = await createServerClient();
  const adminDb = getAdminFirestore();
  const orgId = user.brandId || user.currentOrgId || user.uid;
  const organizationId = user.uid;
  const isDevBypassUser = user.uid === 'bypass-user-id-dev' || user.email === 'dev-user@markitbot.com';
  
  const campaign = {
    ...campaignData,
    status: 'scheduled',
    orgId,
    recipientCount: 0,
    sentCount: 0,
    failedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: user.uid,
  };
  const campaignFromEmail =
    process.env.CAMPAIGN_FROM_EMAIL ||
    process.env.MAILJET_SENDER_EMAIL ||
    process.env.SENDGRID_FROM_EMAIL ||
    'orders@markitbot.com';
  const campaignFromName =
    process.env.CAMPAIGN_FROM_NAME ||
    process.env.MAILJET_SENDER_NAME ||
    process.env.SENDGRID_FROM_NAME ||
    'markitbot AI';
  
  const docRef = await db.collection('organizations').doc(organizationId).collection('campaigns').add(campaign);

  // Queue email deliveries so /api/cron/scheduled-emails can process them.
  if (campaignData.channel === 'email') {
    const recipients = await getCampaignRecipients(
      adminDb,
      orgId,
      organizationId,
      campaignData.audience,
      isDevBypassUser
    );
    const uniqueRecipients = Array.from(new Set(recipients.map(r => r.email.toLowerCase())))
      .map(email => recipients.find(r => r.email.toLowerCase() === email))
      .filter((r): r is { email: string; name?: string } => Boolean(r?.email));

    if (uniqueRecipients.length > 0) {
      const batch = adminDb.batch();
      const now = new Date();

      uniqueRecipients.forEach((recipient) => {
        const emailRef = adminDb.collection('scheduled_emails').doc();
        batch.set(emailRef, {
          type: 'campaign_email',
          campaignId: docRef.id,
          organizationId,
          orgId,
          email: recipient.email,
          firstName: recipient.name || '',
          subject: campaignData.subject,
          content: campaignData.content,
          fromEmail: campaignFromEmail,
          fromName: campaignFromName,
          status: 'pending',
          scheduledFor: now,
          createdAt: now,
          updatedAt: now,
        });
      });

      const campaignRef = adminDb
        .collection('organizations')
        .doc(organizationId)
        .collection('campaigns')
        .doc(docRef.id);

      batch.update(campaignRef, {
        recipientCount: uniqueRecipients.length,
        updatedAt: now,
      });

      await batch.commit();
    } else {
      await adminDb
        .collection('organizations')
        .doc(organizationId)
        .collection('campaigns')
        .doc(docRef.id)
        .update({
          status: 'draft',
          updatedAt: new Date(),
        });
      logger.warn('[Campaigns] No recipients found for campaign', {
        campaignId: docRef.id,
        orgId,
        audience: campaignData.audience,
      });
    }
  }
  
  revalidatePath('/dashboard/agents/craig');
  
  return { success: true, id: docRef.id };
}

export async function getCampaigns(): Promise<Campaign[]> {
  const user = await requireUser(['brand', 'super_user']);

  try {
    const { firestore: db } = await createServerClient();

    const snapshot = await db
      .collection('organizations')
      .doc(user.uid)
      .collection('campaigns')
      .orderBy('createdAt', 'desc')
      .get();

    const campaigns: Campaign[] = [];

    snapshot.forEach((doc) => {
      campaigns.push({
        id: doc.id,
        ...doc.data(),
      } as Campaign);
    });

    return campaigns;
  } catch (error: any) {
    logger.error('[Campaigns] Failed to load campaigns', {
      userId: user.uid,
      error: error?.message || String(error),
      code: error?.code,
    });
    return [];
  }
}

export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  const user = await requireUser(['brand', 'super_user']);
  try {
    const { firestore: db } = await createServerClient();

    const doc = await db
      .collection('organizations')
      .doc(user.uid)
      .collection('campaigns')
      .doc(campaignId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Campaign;
  } catch (error: any) {
    logger.error('[Campaigns] Failed to load campaign by id', {
      userId: user.uid,
      campaignId,
      error: error?.message || String(error),
      code: error?.code,
    });
    return null;
  }
}

export async function getCampaignDeliveryLog(
  campaignId: string,
  limit: number = 200
): Promise<CampaignDeliveryRecord[]> {
  const user = await requireUser(['brand', 'super_user']);
  try {
    const adminDb = getAdminFirestore();

    const snapshot = await adminDb
      .collection('scheduled_emails')
      .where('type', '==', 'campaign_email')
      .where('campaignId', '==', campaignId)
      .where('organizationId', '==', user.uid)
      .limit(limit)
      .get();

    const rows: CampaignDeliveryRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
      email: String(data.email || ''),
      fromEmail: data.fromEmail,
      status: (data.status || 'pending') as CampaignDeliveryRecord['status'],
        subject: data.subject,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        scheduledFor: data.scheduledFor?.toDate?.() || data.scheduledFor,
        sentAt: data.sentAt?.toDate?.() || data.sentAt,
        attemptedAt: data.attemptedAt?.toDate?.() || data.attemptedAt,
        error: data.error,
      };
    });

    rows.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });

    return rows;
  } catch (error: any) {
    logger.error('[Campaigns] Failed to load delivery log', {
      userId: user.uid,
      campaignId,
      error: error?.message || String(error),
      code: error?.code,
    });
    return [];
  }
}

async function getCampaignRecipients(
  db: FirebaseFirestore.Firestore,
  orgId: string,
  organizationId: string,
  audience: string,
  allowDevGlobalFallback: boolean = false
): Promise<Array<{ email: string; name?: string }>> {
  const normalizedAudience = (audience || 'all').toLowerCase();
  const orgCandidates = Array.from(new Set([orgId, organizationId].filter(Boolean)));

  const customerRecipients = await getCustomerRecipients(
    db,
    orgCandidates,
    normalizedAudience,
    allowDevGlobalFallback
  );
  if (customerRecipients.length > 0) {
    return customerRecipients;
  }

  // Fallback to captured leads if customers collection is empty.
  const recipients: Array<{ email: string; name?: string }> = [];
  const leadQueries = await Promise.all(
    orgCandidates.flatMap((candidate) => ([
      db.collection('email_leads')
        .where('brandId', '==', candidate)
        .where('emailConsent', '==', true)
        .limit(500)
        .get(),
      db.collection('email_leads')
        .where('dispensaryId', '==', candidate)
        .where('emailConsent', '==', true)
        .limit(500)
        .get(),
    ]))
  );

  leadQueries.forEach((snap) => {
    snap.forEach((doc) => {
      const data = doc.data();
      if (typeof data.email === 'string' && data.email.trim()) {
        recipients.push({
          email: data.email.trim().toLowerCase(),
          name: data.firstName || undefined,
        });
      }
    });
  });

  if (recipients.length === 0 && allowDevGlobalFallback) {
    // Dev fallback: when auth is bypassed and org mapping is not real, sample opted-in leads globally.
    const globalLeads = await db
      .collection('email_leads')
      .where('emailConsent', '==', true)
      .limit(500)
      .get();

    globalLeads.forEach((doc) => {
      const data = doc.data();
      if (typeof data.email === 'string' && data.email.trim()) {
        recipients.push({
          email: data.email.trim().toLowerCase(),
          name: data.firstName || undefined,
        });
      }
    });
  }

  if (recipients.length === 0) {
    const testRecipients = (process.env.CAMPAIGN_TEST_RECIPIENTS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'));

    if (testRecipients.length > 0) {
      testRecipients.forEach((email) => {
        recipients.push({ email, name: 'Test Recipient' });
      });
      logger.warn('[Campaigns] Using CAMPAIGN_TEST_RECIPIENTS fallback', {
        orgId,
        organizationId,
        recipientCount: testRecipients.length,
      });
    }
  }

  return recipients;
}

async function getCustomerRecipients(
  db: FirebaseFirestore.Firestore,
  orgCandidates: string[],
  audience: string,
  allowDevGlobalFallback: boolean = false
): Promise<Array<{ email: string; name?: string }>> {
  const results = await Promise.all(
    orgCandidates.map(async (candidate) => {
      let query: FirebaseFirestore.Query = db.collection('customers').where('orgId', '==', candidate);

      if (audience === 'new') {
        query = query.where('segment', '==', 'new');
      } else if (audience === 'loyal') {
        query = query.where('segment', 'in', ['loyal', 'vip', 'frequent', 'high_value']);
      } else if (audience === 'churned') {
        query = query.where('segment', 'in', ['at_risk', 'slipping', 'churned']);
      }

      return query.limit(500).get();
    })
  );
  const recipients: Array<{ email: string; name?: string }> = [];

  results.forEach((snap) => {
    snap.forEach((doc) => {
      const data = doc.data();
      if (typeof data.email === 'string' && data.email.trim()) {
        recipients.push({
          email: data.email.trim().toLowerCase(),
          name: data.displayName || data.firstName || undefined,
        });
      }
    });
  });

  if (recipients.length === 0 && allowDevGlobalFallback) {
    // Dev fallback: allow testing campaign sends even without tenant-bound orgId in claims.
    const globalCustomers = await db.collection('customers').limit(500).get();
    globalCustomers.forEach((doc) => {
      const data = doc.data();
      if (typeof data.email === 'string' && data.email.trim()) {
        recipients.push({
          email: data.email.trim().toLowerCase(),
          name: data.displayName || data.firstName || undefined,
        });
      }
    });
  }

  return recipients;
}
