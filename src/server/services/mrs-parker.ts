// src/server/services/mrs-parker.ts
/**
 * Mrs. Parker - Customer Success Agent
 *
 * Handles new customer onboarding and welcome sequences.
 * Triggered on signup to send personalized welcome emails.
 */

import { lettaBlockManager, BLOCK_LABELS } from '@/server/services/letta/block-manager';
import { lettaClient } from '@/server/services/letta/client';
import { logger } from '@/lib/logger';

export interface NewSignupData {
    userId: string;
    email: string;
    displayName: string;
    accountType: 'brand' | 'dispensary' | 'customer';
    plan?: string;
    orgName?: string;
}

export async function mrsParkerWelcomeFlow(signup: NewSignupData): Promise<{
    success: boolean;
    message: string;
    emailSent?: boolean;
}> {
    try {
        logger.info(`[Mrs. Parker] Processing new signup: ${signup.email} (${signup.accountType})`);

        const tenantId = 'boardroom_shared';

        await lettaBlockManager.appendToBlock(
            tenantId,
            BLOCK_LABELS.AGENT_MRS_PARKER as any,
            `New ${signup.accountType} signup: ${signup.displayName} (${signup.email})${signup.orgName ? ` - ${signup.orgName}` : ''}`,
            'Mrs. Parker'
        );

        const welcomeContent = await generateWelcomeContent(signup);
        const emailSent = await sendWelcomeEmail(signup, welcomeContent);

        await lettaBlockManager.appendToBlock(
            tenantId,
            BLOCK_LABELS.CUSTOMER_INSIGHTS as any,
            `New signup: ${signup.displayName} (${signup.accountType}) - Welcome email ${emailSent ? 'sent' : 'failed'}`,
            'Mrs. Parker'
        );

        return {
            success: true,
            message: `Welcome flow completed for ${signup.email}`,
            emailSent
        };
    } catch (error: any) {
        logger.error(`[Mrs. Parker] Welcome flow failed: ${error.message}`);
        return {
            success: false,
            message: error.message
        };
    }
}

async function generateWelcomeContent(signup: NewSignupData): Promise<{
    subject: string;
    body: string;
}> {
    const templates: Record<string, { subject: string; body: string }> = {
        brand: {
            subject: `Welcome to Markitbot, ${signup.displayName}! 🌿`,
            body: `
<h1 style="color:#3B82F6; margin-bottom:16px;">Welcome to Markitbot</h1>

<p>Hi ${signup.displayName},</p>

<p>We're thrilled to have ${signup.orgName || 'your brand'} on board.</p>

<p>Your AI-powered marketing squad is ready to help you connect with dispensaries nationwide. Start by exploring your Brand Dashboard and launch your first campaign.</p>

<p>If you need anything, just reply to this email — I'm here to help.</p>

<p style="margin-top:24px;">– Mrs. Parker<br/>Customer Success, markitbot AI</p>
`
        },
        dispensary: {
            subject: `Welcome to Markitbot, ${signup.displayName}! 🏪`,
            body: `
<h1 style="color:#3B82F6; margin-bottom:16px;">Welcome to Markitbot</h1>

<p>Hi ${signup.displayName},</p>

<p>Your dispensary is now connected to our platform.</p>

<p>Your Digital Budtender is ready to engage customers with AI-powered recommendations. Head to your dashboard to sync your menu and activate your chatbot.</p>

<p>Need help? Just reply anytime.</p>

<p style="margin-top:24px;">– Mrs. Parker<br/>Customer Success, markitbot AI</p>
`
        },
        customer: {
            subject: `Welcome to Markitbot! 🌿`,
            body: `
<h1 style="color:#3B82F6; margin-bottom:16px;">Welcome to Markitbot</h1>

<p>Hi ${signup.displayName},</p>

<p>We're excited to help you discover amazing cannabis products.</p>

<p>Chat anytime to get personalized recommendations, find dispensaries, and explore strains and effects tailored to you.</p>

<p style="margin-top:24px;">Enjoy exploring!<br/>– Mrs. Parker<br/>markitbot AI</p>
`
        }
    };

    return templates[signup.accountType] || templates.customer;
}

async function sendWelcomeEmail(
    signup: NewSignupData,
    content: { subject: string; body: string }
): Promise<boolean> {
    try {
        const { sendEmail } = await import('@/server/services/email-service');

        const darkHtml = `
<div style="
    background-color:#000000;
    color:#ffffff;
    padding:40px 20px;
    font-family:Arial, sans-serif;
">
    <div style="
        max-width:600px;
        margin:0 auto;
        background-color:#111111;
        padding:30px;
        border-radius:8px;
        border:1px solid #1f2937;
    ">
        ${content.body}
    </div>
</div>
`;

        await sendEmail({
            to: signup.email,
            subject: content.subject,
            text: content.body.replace(/<[^>]*>?/gm, ''),
            html: darkHtml
        });

        logger.info(`[Mrs. Parker] Welcome email sent to ${signup.email}`);
        return true;
    } catch (error: any) {
        logger.error(`[Mrs. Parker] Email failed: ${error.message}`);
        return false;
    }
}

export async function onNewUserSignup(
    userId: string,
    email: string,
    displayName: string,
    accountType: 'brand' | 'dispensary' | 'customer',
    orgName?: string,
    plan?: string
): Promise<void> {
    mrsParkerWelcomeFlow({
        userId,
        email,
        displayName,
        accountType,
        orgName,
        plan
    }).catch(err => {
        logger.error(`[Mrs. Parker] Background welcome flow error: ${err.message}`);
    });
}

