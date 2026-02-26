// src/lib/chat/role-chat-config.ts
/**
 * Role-based Agent Chat Configurations
 * ────────────────────────────────────────────────
 *   DARK THEME – BLUE HEADINGS & BLACK BACKGROUND READY
 * ────────────────────────────────────────────────
 * - Headings/titles → blue (text-blue-400)
 * - No green/emerald anywhere
 * - Cards/UI → bg-zinc-950/90 border-zinc-800
 */

export type UserRoleForChat = 
  'owner' | 'admin' | 'brand' | 'dispensary' | 'editor' | 'customer' | 'super_admin' | 'concierge';

export interface RoleChatConfig {
  role: UserRoleForChat;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  placeholder: string;
  promptSuggestions: string[];
  agentPersona: 'smokey' | 'craig' | 'deebo' | 'mrs_parker' | 'pops' | 'money_mike' | 'puff';
  themeColor: string; // Used only for visual accents (no green)
  iconName: 'sparkles' | 'briefcase' | 'store' | 'edit' | 'shopping-cart' | 'shield';
  restrictedTools?: string[];
  enabledFeatures: {
    modelSelector: boolean;
    personaSelector: boolean;
    triggers: boolean;
    permissions: boolean;
  };
}

// ────────────────────────────────────────────────
// EDITOR CONFIG – BLUE ACCENT READY
// ────────────────────────────────────────────────
export const EDITOR_CHAT_CONFIG: RoleChatConfig = {
  role: 'editor',
  title: 'Content Assistant',
  subtitle: 'AI-powered content editing and SEO optimization',
  welcomeMessage: "Hey! I'm here to help you create and optimize content. What would you like to work on?",
  placeholder: 'Ask about SEO, content optimization, or get writing help...',
  promptSuggestions: [
    'Review this brand page for SEO issues',
    'Help me write a product description',
    'Check content for compliance issues',
    'Optimize meta tags for this page',
    'Generate alt text for product images',
    'Help me improve this dispensary copy'
  ],
  agentPersona: 'deebo',
  themeColor: 'indigo', // Changed from purple to indigo (blue family)
  iconName: 'edit',
  restrictedTools: ['pricing', 'revenue', 'financial'],
  enabledFeatures: {
    modelSelector: false,
    personaSelector: false,
    triggers: false,
    permissions: false
  }
};

// ────────────────────────────────────────────────
// CUSTOMER CONFIG – BLUE ACCENT READY
// ────────────────────────────────────────────────
export const CUSTOMER_CHAT_CONFIG: RoleChatConfig = {
  role: 'customer',
  title: 'Cannabis Concierge',
  subtitle: 'Your personal budtender for finding the perfect products',
  welcomeMessage: "Hi there! 🌿 I'm Ember, your personal cannabis concierge. Let me help you find exactly what you're looking for.",
  placeholder: 'Ask for product recommendations, deals, or help with your order...',
  promptSuggestions: [
    'What should I try for sleep?',
    'Find me the best deals today',
    'Something similar to Blue Dream',
    'Build a cart under $50',
    'Edibles for relaxation',
    'Top-rated products near me'
  ],
  agentPersona: 'smokey',
  themeColor: 'blue',
  iconName: 'shopping-cart',
  restrictedTools: ['admin', 'settings', 'analytics', 'revenue'],
  enabledFeatures: {
    modelSelector: false,
    personaSelector: false,
    triggers: false,
    permissions: false
  }
};

// ────────────────────────────────────────────────
// BRAND CONFIG – BLUE ACCENT READY
// ────────────────────────────────────────────────
export const BRAND_CHAT_CONFIG: RoleChatConfig = {
  role: 'brand',
  title: 'Brand Growth Assistant',
  subtitle: 'AI-powered insights for your brand',
  welcomeMessage: "Welcome! I'm here to help grow your brand presence. What would you like to explore?",
  placeholder: 'Ask about distribution, campaigns, or competitive insights...',
  promptSuggestions: [
    'Find dispensaries to carry my products',
    'See where my brand appears online',
    'Draft a campaign in 30 seconds',
    'Spy on competitor pricing',
    'See this week\'s wins & opportunities',
    'Get my SEO visibility report'
  ],
  agentPersona: 'craig',
  themeColor: 'blue',
  iconName: 'briefcase',
  enabledFeatures: {
    modelSelector: true,
    personaSelector: true,
    triggers: true,
    permissions: true
  }
};

// ────────────────────────────────────────────────
// DISPENSARY CONFIG – BLUE ACCENT READY
// ────────────────────────────────────────────────
export const DISPENSARY_CHAT_CONFIG: RoleChatConfig = {
  role: 'dispensary',
  title: 'Dispensary Operations',
  subtitle: 'AI assistant for your dispensary',
  welcomeMessage: "Hey! Ready to help with your dispensary operations. What do you need?",
  placeholder: 'Ask about pricing, competitors, or marketing...',
  promptSuggestions: [
    'Spy on competitor pricing near me',
    'Scan my site for compliance risks',
    'Draft a campaign in 30 seconds',
    'Find slow movers I can bundle',
    'Show me today\'s opportunities',
    'Get my SEO visibility score'
  ],
  agentPersona: 'money_mike',
  themeColor: 'blue',
  iconName: 'store',
  enabledFeatures: {
    modelSelector: true,
    personaSelector: true,
    triggers: true,
    permissions: true
  }
};

// ────────────────────────────────────────────────
// OWNER/ADMIN CONFIG – BLUE ACCENT READY
// ────────────────────────────────────────────────
export const OWNER_CHAT_CONFIG: RoleChatConfig = {
  role: 'owner',
  title: 'Command Center',
  subtitle: 'Full platform control and insights',
  welcomeMessage: "Welcome back! Full agent capabilities at your service. What would you like to accomplish?",
  placeholder: 'Ask anything - full platform access available...',
  promptSuggestions: [
    'Give me a platform health report',
    'Show all active agents and their status',
    'Run a competitive analysis scan',
    'Check compliance across all listings',
    'Generate a revenue forecast',
    'Audit user permissions'
  ],
  agentPersona: 'smokey',
  themeColor: 'blue',
  iconName: 'shield',
  enabledFeatures: {
    modelSelector: true,
    personaSelector: true,
    triggers: true,
    permissions: true
  }
};

// ────────────────────────────────────────────────
// SUPER ADMIN CONFIG – BLUE ACCENT READY
// ────────────────────────────────────────────────
export const SUPER_ADMIN_CHAT_CONFIG: RoleChatConfig = {
  role: 'super_admin',
  title: 'Super Admin HQ',
  subtitle: 'Platform-wide control and intelligence',
  welcomeMessage: 'Command center active. All systems nominal.',
  placeholder: 'Query system stats or manage tenants...',
  iconName: 'shield',
  themeColor: 'blue',
  agentPersona: 'puff',
  promptSuggestions: [
    'Show platform health',
    'List pending verifications',
    'Generate system report'
  ],
  enabledFeatures: {
    modelSelector: true,
    personaSelector: true,
    triggers: true,
    permissions: true
  }
};

// ────────────────────────────────────────────────
// CONCIERGE CONFIG – BLUE ACCENT READY
// ────────────────────────────────────────────────
export const CONCIERGE_CHAT_CONFIG: RoleChatConfig = {
  role: 'concierge',
  title: 'Markitbot Concierge',
  subtitle: 'Autonomous shopping and fulfillment',
  welcomeMessage: "Hi! I'm your cannabis concierge. I can browse every menu in your area and prepare a multi-cart for you. How can I help?",
  placeholder: 'Ask me to find products, compare prices, or build a cart...',
  iconName: 'sparkles',
  themeColor: 'blue',
  agentPersona: 'smokey',
  promptSuggestions: [
    'Find the cheapest vape near me',
    'I need flower for sleep under $40',
    'Who has Blue Dream in stock?',
    'Build me a diverse $100 sampler'
  ],
  enabledFeatures: {
    modelSelector: false,
    personaSelector: false,
    triggers: false,
    permissions: false
  }
};

/**
 * ────────────────────────────────────────────────
 *       ROLE → CONFIG MAPPER – BLUE THEME READY
 * ────────────────────────────────────────────────
 */
export function getChatConfigForRole(role: UserRoleForChat): RoleChatConfig {
  switch (role) {
    case 'editor': return EDITOR_CHAT_CONFIG;
    case 'customer': return CUSTOMER_CHAT_CONFIG;
    case 'brand': return BRAND_CHAT_CONFIG;
    case 'dispensary': return DISPENSARY_CHAT_CONFIG;
    case 'super_admin': return SUPER_ADMIN_CHAT_CONFIG;
    case 'concierge': return CONCIERGE_CHAT_CONFIG;
    case 'owner':
    case 'admin':
    default: return OWNER_CHAT_CONFIG;
  }
}

/**
 * ────────────────────────────────────────────────
 *       GET ALL CONFIGS – BLUE ACCENT READY
 * ────────────────────────────────────────────────
 */
export function getAllChatConfigs(): Record<UserRoleForChat, RoleChatConfig> {
  return {
    owner: OWNER_CHAT_CONFIG,
    admin: { ...OWNER_CHAT_CONFIG, role: 'admin' },
    brand: BRAND_CHAT_CONFIG,
    dispensary: DISPENSARY_CHAT_CONFIG,
    editor: EDITOR_CHAT_CONFIG,
    customer: CUSTOMER_CHAT_CONFIG,
    super_admin: SUPER_ADMIN_CHAT_CONFIG,
    concierge: CONCIERGE_CHAT_CONFIG
  };
}
