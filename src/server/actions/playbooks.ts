// src\server\actions\playbooks.ts
'use server';

import { createServerClient } from '@/firebase/server-client';
import { requireUser } from '@/server/auth/auth';
import { DEFAULT_PLAYBOOKS } from '@/config/default-playbooks';
import { Playbook, PlaybookStep, PlaybookCategory, PlaybookTrigger } from '@/types/playbook';
import { FieldValue } from 'firebase-admin/firestore';

// Actions that require approval when targeting customers (not logged-in user)
const CUSTOMER_EMAIL_ACTIONS = ['gmail.send', 'gmail.send_batch', 'email.send', 'notify'];

function inferAgentFromPrompt(prompt: string): string {
    const p = prompt.toLowerCase();
    if (/\b(compliance|policy|legal|regulation|warning)\b/.test(p)) return 'deebo';
    if (/\b(price|pricing|margin|discount|promo|revenue|profit)\b/.test(p)) return 'money_mike';
    if (/\b(loyalty|retention|vip|repeat customer|winback)\b/.test(p)) return 'mrs_parker';
    if (/\b(competitor|intel|benchmark|market scan)\b/.test(p)) return 'ezal';
    if (/\b(report|analytics|dashboard|forecast|kpi)\b/.test(p)) return 'pops';
    if (/\b(inventory|stock|menu|product|recommend|cart)\b/.test(p)) return 'smokey';
    if (/\b(campaign|email|sms|content|seo|social|outreach)\b/.test(p)) return 'craig';
    return 'craig';
}

function inferCategoryFromPrompt(prompt: string): PlaybookCategory {
    const p = prompt.toLowerCase();
    if (/\b(compliance|policy|legal|regulation)\b/.test(p)) return 'compliance';
    if (/\b(price|pricing|margin|discount|promo|profit)\b/.test(p)) return 'ops';
    if (/\b(competitor|intel|benchmark|monitor)\b/.test(p)) return 'intel';
    if (/\b(report|analytics|forecast|kpi)\b/.test(p)) return 'reporting';
    if (/\b(seo|ranking|search)\b/.test(p)) return 'seo';
    if (/\b(campaign|email|sms|social|content|lead)\b/.test(p)) return 'marketing';
    if (/\b(inventory|stock|menu|fulfillment|order)\b/.test(p)) return 'ops';
    return 'custom';
}

function inferTriggerFromPrompt(prompt: string): PlaybookTrigger[] {
    const p = prompt.toLowerCase();
    if (/\b(daily|every day|each day)\b/.test(p)) {
        return [{ type: 'schedule', cron: '0 9 * * *', timezone: 'America/Chicago' }];
    }
    if (/\b(weekly|every week)\b/.test(p)) {
        return [{ type: 'schedule', cron: '0 9 * * 1', timezone: 'America/Chicago' }];
    }
    if (/\b(monthly|every month)\b/.test(p)) {
        return [{ type: 'schedule', cron: '0 9 1 * *', timezone: 'America/Chicago' }];
    }
    if (/\b(when|if)\b/.test(p)) {
        if (/\b(stock|inventory)\b/.test(p)) return [{ type: 'event', eventName: 'inventory.low' }];
        if (/\b(order)\b/.test(p)) return [{ type: 'event', eventName: 'order.completed' }];
        if (/\b(lead)\b/.test(p)) return [{ type: 'event', eventName: 'lead.created' }];
    }
    return [{ type: 'manual' }];
}

function derivePlaybookName(prompt: string): string {
    const trimmed = prompt.trim();
    if (!trimmed) return 'New Automation Playbook';
    const cleaned = trimmed
        .replace(/^create\s+(a\s+)?(new\s+)?playbook\s*(for|to)?\s*/i, '')
        .replace(/^build\s+(a\s+)?(new\s+)?(automation|workflow|playbook)\s*(for|to)?\s*/i, '')
        .trim();

    if (!cleaned) return 'Brand Automation Playbook';
    const words = cleaned.split(/\s+/).slice(0, 6);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function buildFallbackPlaybookConfig(prompt: string): {
    name: string;
    description: string;
    agent: string;
    category: PlaybookCategory;
    triggers: PlaybookTrigger[];
    steps: PlaybookStep[];
} {
    const safePrompt = prompt.trim();
    const agent = inferAgentFromPrompt(safePrompt);
    const category = inferCategoryFromPrompt(safePrompt);
    const triggers = inferTriggerFromPrompt(safePrompt);

    return {
        name: derivePlaybookName(safePrompt),
        description: safePrompt || 'Automation generated from user request.',
        agent,
        category,
        triggers,
        steps: [
            {
                id: crypto.randomUUID(),
                action: 'delegate',
                params: {
                    task: safePrompt || 'Run the automation workflow and report results.',
                },
                agent,
                label: 'Execute workflow task',
            },
        ],
    };
}

/**
 * Detect if a playbook requires approval based on customer-facing email steps
 */
export async function detectApprovalRequired(steps: PlaybookStep[]): Promise<boolean> {
    return steps.some(step => {
        // Check if action is customer-facing email
        if (CUSTOMER_EMAIL_ACTIONS.includes(step.action)) {
            // If 'to' param is the current user's email, no approval needed
            const toParam = step.params?.to as string;
            if (toParam === '{{current_user.email}}' || toParam === '{{user.email}}') {
                return false;
            }
            return true; // Customer-facing email requires approval
        }
        return false;
    });
}

/**
 * Helper to convert Firestore timestamps and other non-plan objects to serializable dates
 */
function formatPlaybook(id: string, data: any): Playbook {
    return {
        ...data,
        id,
        agent: data.agent || 'puff',
        category: data.category || 'custom',
        ownerId: data.ownerId || data.createdBy || 'system',
        ownerName: data.ownerName || 'System',
        isCustom: data.isCustom ?? false,
        requiresApproval: data.requiresApproval ?? false,
        triggers: data.triggers || [],
        steps: data.steps || [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        lastRunAt: data.lastRunAt?.toDate ? data.lastRunAt.toDate() : data.lastRunAt,
    } as Playbook;
}

/**
 * Check if user can edit a playbook (owner or admin)
 */
async function canEditPlaybook(userId: string, userRole: string, playbook: Playbook): Promise<boolean> {
    // Admins can edit any playbook
    if (userRole === 'super_user' || userRole === 'super_admin') {
        return true;
    }
    // Otherwise, must be owner
    return playbook.ownerId === userId;
}

/**
 * List all playbooks for a brand.
 * Seeds default playbooks if none exist.
 */
export async function listBrandPlaybooks(brandId: string): Promise<Playbook[]> {
    try {
        const { firestore } = await createServerClient();
        await requireUser();

        if (!brandId) throw new Error('Brand ID is required');

        const collectionRef = firestore.collection('brands').doc(brandId).collection('playbooks');
        const snap = await collectionRef.get();

        if (snap.empty) {
            console.log(`[Playbooks] Seeding default playbooks for brand: ${brandId}`);
            const batch = firestore.batch();
            const seededPlaybooks: Playbook[] = [];

            for (const pb of DEFAULT_PLAYBOOKS) {
                const newDocRef = collectionRef.doc();
                const timestamp = new Date();

                const playbookData = {
                    ...pb,
                    id: newDocRef.id,
                    status: 'active',
                    agent: (pb as any).agent || 'puff',
                    category: (pb as any).category || 'custom',
                    ownerId: 'system',
                    ownerName: 'Markitbot',
                    isCustom: false,
                    requiresApproval: await detectApprovalRequired(pb.steps || []),
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    createdBy: 'system',
                    runCount: 0,
                    successCount: 0,
                    failureCount: 0
                };

                batch.set(newDocRef, playbookData);
                seededPlaybooks.push(playbookData as unknown as Playbook);
            }

            await batch.commit();
            console.log(`[Playbooks] Successfully seeded ${seededPlaybooks.length} playbooks`);
            return seededPlaybooks;
        }

        console.log(`[Playbooks] Found ${snap.size} playbooks for brand: ${brandId}`);
        return snap.docs.map(doc => formatPlaybook(doc.id, doc.data()));
    } catch (error: any) {
        console.error('[Playbooks] Failed to list playbooks:', error);
        // Return empty array instead of throwing to prevent RSC errors
        return [];
    }
}

/**
 * Assign a playbook template to an org (without requiring user auth).
 * Used for automated setup like Free user onboarding.
 */
export async function assignPlaybookToOrg(
    orgId: string,
    templateId: string
): Promise<{ success: boolean; playbookId?: string; error?: string }> {
    try {
        const { firestore } = await createServerClient();

        // Find the template playbook in defaults
        const template = DEFAULT_PLAYBOOKS.find(pb => pb.name?.toLowerCase().includes(templateId.replace(/-/g, ' ')));
        
        if (!template) {
            console.warn(`[Playbooks] Template not found: ${templateId}`);
            return { success: false, error: `Template "${templateId}" not found` };
        }

        const collectionRef = firestore.collection('brands').doc(orgId).collection('playbooks');
        
        // Check if playbook already exists
        const existing = await collectionRef
            .where('name', '==', template.name)
            .limit(1)
            .get();

        if (!existing.empty) {
            console.log(`[Playbooks] Playbook already exists: ${template.name}`);
            return { success: true, playbookId: existing.docs[0].id };
        }

        // Create the playbook
        const newDocRef = collectionRef.doc();
        const timestamp = new Date();

        const playbookData = {
            ...template,
            id: newDocRef.id,
            status: 'active',
            agent: (template as any).agent || 'ezal',
            category: (template as any).category || 'intel',
            ownerId: 'system',
            ownerName: 'Markitbot',
            isCustom: false,
            requiresApproval: await detectApprovalRequired(template.steps || []),
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: 'system',
            orgId,
            runCount: 0,
            successCount: 0,
            failureCount: 0,
            version: 1,
        };

        await newDocRef.set(playbookData);
        console.log(`[Playbooks] Assigned playbook "${template.name}" to org ${orgId}`);
        
        return { success: true, playbookId: newDocRef.id };
    } catch (error: any) {
        console.error('[Playbooks] assignPlaybookToOrg failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new playbook
 */
export async function createPlaybook(
    brandId: string,
    data: {
        name: string;
        description: string;
        agent: string;
        category: PlaybookCategory;
        triggers: PlaybookTrigger[];
        steps: PlaybookStep[];
        templateId?: string;
    }
): Promise<{ success: boolean; playbook?: Playbook; error?: string }> {
    try {
        const { firestore } = await createServerClient();
        const user = await requireUser();

        const collectionRef = firestore.collection('brands').doc(brandId).collection('playbooks');
        const newDocRef = collectionRef.doc();
        const timestamp = new Date();

        const playbookData = {
            id: newDocRef.id,
            name: data.name,
            description: data.description,
            status: 'draft',
            agent: data.agent,
            category: data.category,
            triggers: data.triggers,
            steps: data.steps,
            ownerId: user.uid,
            ownerName: user.name || user.email || 'Unknown',
            isCustom: true,
            templateId: data.templateId,
            requiresApproval: await detectApprovalRequired(data.steps),
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: user.uid,
            orgId: brandId,
            runCount: 0,
            successCount: 0,
            failureCount: 0,
            version: 1
        };

        await newDocRef.set(playbookData);
        return { success: true, playbook: playbookData as unknown as Playbook };
    } catch (error: any) {
        console.error('[Playbooks] Create failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update an existing playbook
 */
export async function updatePlaybook(
    brandId: string,
    playbookId: string,
    updates: Partial<Pick<Playbook, 'name' | 'description' | 'agent' | 'category' | 'triggers' | 'steps' | 'status'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = await createServerClient();
        const user = await requireUser();

        const docRef = firestore.collection('brands').doc(brandId).collection('playbooks').doc(playbookId);
        const snap = await docRef.get();

        if (!snap.exists) {
            return { success: false, error: 'Playbook not found' };
        }

        const playbook = formatPlaybook(snap.id, snap.data());
        const canEdit = await canEditPlaybook(user.uid, user.role as string, playbook);

        if (!canEdit) {
            return { success: false, error: 'Permission denied: You can only edit your own playbooks' };
        }

        // Recalculate approval if steps changed
        const requiresApproval = updates.steps 
            ? await detectApprovalRequired(updates.steps) 
            : playbook.requiresApproval;

        await docRef.update({
            ...updates,
            requiresApproval,
            updatedAt: new Date(),
            version: FieldValue.increment(1)
        });

        return { success: true };
    } catch (error: any) {
        console.error('[Playbooks] Update failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a playbook (soft delete - archive)
 */
export async function deletePlaybook(
    brandId: string,
    playbookId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = await createServerClient();
        const user = await requireUser();

        const docRef = firestore.collection('brands').doc(brandId).collection('playbooks').doc(playbookId);
        const snap = await docRef.get();

        if (!snap.exists) {
            return { success: false, error: 'Playbook not found' };
        }

        const playbook = formatPlaybook(snap.id, snap.data());
        const canEdit = await canEditPlaybook(user.uid, user.role as string, playbook);

        if (!canEdit) {
            return { success: false, error: 'Permission denied' };
        }

        // Soft delete - archive
        await docRef.update({
            status: 'archived',
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error: any) {
        console.error('[Playbooks] Delete failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Clone a playbook (from template or existing)
 */
export async function clonePlaybook(
    brandId: string,
    sourcePlaybookId: string
): Promise<{ success: boolean; playbook?: Playbook; error?: string }> {
    try {
        const { firestore } = await createServerClient();
        const user = await requireUser();

        const sourceRef = firestore.collection('brands').doc(brandId).collection('playbooks').doc(sourcePlaybookId);
        const sourceSnap = await sourceRef.get();

        if (!sourceSnap.exists) {
            return { success: false, error: 'Source playbook not found' };
        }

        const source = formatPlaybook(sourceSnap.id, sourceSnap.data());

        return createPlaybook(brandId, {
            name: `${source.name} (Copy)`,
            description: source.description,
            agent: source.agent,
            category: source.category,
            triggers: source.triggers,
            steps: source.steps.map(s => ({ ...s, id: crypto.randomUUID() })),
            templateId: source.id
        });
    } catch (error: any) {
        console.error('[Playbooks] Clone failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Toggle a playbook's active status
 */
export async function togglePlaybookStatus(brandId: string, playbookId: string, isActive: boolean) {
    try {
        const { firestore } = await createServerClient();
        const user = await requireUser();

        const docRef = firestore.collection('brands').doc(brandId).collection('playbooks').doc(playbookId);
        const snap = await docRef.get();

        if (!snap.exists) {
            return { success: false, error: 'Playbook not found' };
        }

        const playbook = formatPlaybook(snap.id, snap.data());
        const canEdit = await canEditPlaybook(user.uid, user.role as string, playbook);

        if (!canEdit) {
            return { success: false, error: 'Permission denied' };
        }

        await docRef.update({
            status: isActive ? 'active' : 'paused',
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error: any) {
        console.error('[Playbooks] togglePlaybookStatus failed:', error);
        return { success: false, error: error.message || 'Failed to toggle playbook status' };
    }
}

/**
 * Simulate a playbook run for testing purposes
 */
export async function runPlaybookTest(brandId: string, playbookId: string) {
    try {
        const { firestore } = await createServerClient();
        await requireUser();

        const docRef = firestore.collection('brands').doc(brandId).collection('playbooks').doc(playbookId);

        await docRef.update({
            runCount: FieldValue.increment(1),
            lastRunAt: new Date(),
            updatedAt: new Date()
        });

        return { success: true, message: 'Test run initiated successfully.' };
    } catch (error: any) {
        console.error('[Playbooks] runPlaybookTest failed:', error);
        return { success: false, error: error.message || 'Failed to run playbook test' };
    }
}

/**
 * Parse natural language into playbook configuration using AI
 */
export async function parseNaturalLanguage(prompt: string): Promise<{
    success: boolean;
    config?: {
        name: string;
        description: string;
        agent: string;
        category: PlaybookCategory;
        triggers: PlaybookTrigger[];
        steps: PlaybookStep[];
    };
    error?: string;
}> {
    try {
        const safePrompt = typeof prompt === 'string' ? prompt.trim() : '';
        if (!safePrompt) {
            return { success: false, error: 'Prompt is required to create a playbook.' };
        }

        // Dynamic import to avoid SSR issues
        const { ai } = await import('@/ai/genkit');
        
        const systemPrompt = `You are a playbook configuration generator. Given a natural language description of an automation workflow, extract a structured playbook configuration.

Available agents: smokey (products/recommendations), craig (marketing/content), pops (analytics/reporting), ezal (competitor intel), money_mike (pricing/finance), deebo (compliance), mrs_parker (loyalty/retention)

Available actions: delegate, gmail.send, query, analyze, generate, deebo.check_content, notify, parallel

Available trigger types: manual, schedule (with cron), event (lead.created, page.claimed, order.completed, review.received, inventory.low)

Return ONLY valid JSON with this exact structure:
{
  "name": "string",
  "description": "string", 
  "agent": "string (agent id)",
  "category": "intel|marketing|ops|seo|reporting|compliance|custom",
  "triggers": [{"type": "manual|schedule|event", "cron?": "string", "eventName?": "string"}],
  "steps": [{"id": "uuid", "action": "string", "params": {}, "agent?": "string", "label": "string"}]
}`;

        const result = await ai.generate({
            prompt: `${systemPrompt}\n\nUser request: "${safePrompt}"`,
        });

        // Some providers return shape variants; guard against undefined text.
        const rawText =
            (result as any)?.text ??
            (result as any)?.outputText ??
            (result as any)?.output?.text ??
            '';

        if (typeof rawText !== 'string' || rawText.trim().length === 0) {
            console.warn('[Playbooks] AI parser returned empty response. Using fallback parser.');
            return { success: true, config: buildFallbackPlaybookConfig(safePrompt) };
        }

        const text = rawText.trim();
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        
        const config = JSON.parse(jsonStr);

        // Generate IDs for steps if missing
        if (config.steps) {
            config.steps = config.steps.map((step: any, idx: number) => ({
                ...step,
                id: step.id || crypto.randomUUID(),
                label: step.label || `Step ${idx + 1}`
            }));
        }

        if (!config || typeof config !== 'object') {
            return { success: true, config: buildFallbackPlaybookConfig(safePrompt) };
        }

        if (!Array.isArray(config.triggers) || config.triggers.length === 0) {
            config.triggers = inferTriggerFromPrompt(safePrompt);
        }

        if (!Array.isArray(config.steps) || config.steps.length === 0) {
            config.steps = buildFallbackPlaybookConfig(safePrompt).steps;
        }

        if (!config.agent || typeof config.agent !== 'string') {
            config.agent = inferAgentFromPrompt(safePrompt);
        }

        if (!config.category || typeof config.category !== 'string') {
            config.category = inferCategoryFromPrompt(safePrompt);
        }

        if (!config.name || typeof config.name !== 'string') {
            config.name = derivePlaybookName(safePrompt);
        }

        if (!config.description || typeof config.description !== 'string') {
            config.description = safePrompt || 'Automation generated from user request.';
        }

        return { success: true, config };
    } catch (error: any) {
        console.error('[Playbooks] parseNaturalLanguage failed:', error);
        const safePrompt = typeof prompt === 'string' ? prompt.trim() : '';
        if (safePrompt) {
            console.warn('[Playbooks] Falling back to deterministic parser after AI parse failure.');
            return { success: true, config: buildFallbackPlaybookConfig(safePrompt) };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Create playbook from natural language description
 */
export async function createPlaybookFromNaturalLanguage(
    brandId: string,
    prompt: string
): Promise<{ success: boolean; playbook?: Playbook; error?: string }> {
    const safeBrandId = typeof brandId === 'string' && brandId.trim() ? brandId : '';
    if (!safeBrandId) {
        return { success: false, error: 'Brand ID is missing.' };
    }

    const parseResult = await parseNaturalLanguage(prompt);
    
    if (!parseResult.success || !parseResult.config) {
        return { success: false, error: parseResult.error || 'Failed to parse prompt' };
    }
    
    return createPlaybook(safeBrandId, parseResult.config);
}

