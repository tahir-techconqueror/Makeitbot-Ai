
export interface PricingPlan {
    id: string;
    name: string;
    badge?: string;
    price: number | null;
    priceDisplay: string;
    priceLater?: number | null;
    period: string;
    setup?: string;
    desc: string;
    highlight?: string | boolean;
    features: string[];
    pill: string;
    tier: "directory" | "platform";
    scarcity?: string;
}

// ----------------------------------------------------------------------
// NEW 4-TIER MODEL (Scout, Pro, Growth, Empire)
// ----------------------------------------------------------------------

export const DIRECTORY_PLANS: PricingPlan[] = [
    {
        id: "scout",
        name: "Scout",
        badge: "Always Free",
        price: 0,
        priceDisplay: "$0",
        period: "forever",
        setup: "Best for: market visibility",
        desc: "Track your local market and benchmark competitor movement.",
        features: [
            "Monitor 1 Competitor",
            "Preview 1 ZIP Market",
            "50 Ember Conversations / month",
            "Public Listing Profile",
            "Starter Market Insights"
        ],
        pill: "Start Free Plan",
        highlight: false,
        tier: "directory"
    },
    {
        id: "pro",
        name: "Pro",
        badge: "Most Chosen",
        price: 99,
        priceDisplay: "$99",
        period: "/ mo",
        setup: "Best for: single-location retail",
        desc: "Turn your menu into a consistent sales engine.",
        features: [
            "Unlimited Ember Conversations",
            "3 ZIP Codes Included",
            "Track 3 Competitors",
            "10 Creative Assets / month",
            "3 Campaign Workflows",
            "SEO Headless Menu",
            "Sentinel Guardrail Checks"
        ],
        pill: "Select Pro",
        highlight: true,
        tier: "directory"
    },
     {
        id: "growth",
        name: "Growth",
        price: 249,
        priceDisplay: "$249",
        period: "/ mo",
        setup: "Best for: scaling operators",
        desc: "Expand demand and automate repeat revenue.",
        features: [
            "Unlimited Ember Conversations",
            "10 ZIP Codes Included",
            "Track 10 Competitors",
            "50 Creative Assets / month",
            "Unlimited Campaigns",
            "Priority Support",
            "Advanced Insights"
        ],
        pill: "Select Growth",
        highlight: false,
        tier: "platform"
    }
];

export const PLATFORM_PLANS: PricingPlan[] = [
   // Empire behaves like a platform plan in the UI but effectively is the top tier
    {
        id: "empire",
        name: "Empire",
        badge: "Enterprise",
        price: null,
        priceDisplay: "Custom",
        period: "",
        highlight: "For MSOs and high-volume teams",
        setup: "Best for: multi-state operations",
        desc: "Enterprise autonomy with dedicated control.",
        features: [
            "Unlimited ZIP Codes (Metro Packs)",
            "Unlimited Competitors",
            "Unlimited Creative Center",
            "Dedicated Infrastructure",
            "Custom Integrations",
            "White-Glove Onboarding",
            "SLA Support"
        ],
        pill: "Talk to Sales",
        tier: "platform"
    }
];

// Combine all for backward compatibility and simple lists
export const PRICING_PLANS = [...DIRECTORY_PLANS, ...PLATFORM_PLANS];

// Legacy plan ID aliases - map old plan IDs to current plans
export const LEGACY_PLAN_ALIASES: Record<string, string> = {
    'claim_pro': 'pro',
    'founders_claim': 'pro',
    'free': 'scout',
    'growth_5': 'growth',
    'scale_10': 'growth',
    'scale': 'growth',  // Common typo/abbreviation
    'pro_25': 'growth',
    'enterprise': 'empire',
};

/**
 * Find a pricing plan by ID, supporting legacy aliases
 */
export function findPricingPlan(planId: string): PricingPlan | undefined {
    // First try direct match
    let plan = PRICING_PLANS.find(p => p.id === planId);
    if (plan) return plan;

    // Try legacy alias
    const aliasedId = LEGACY_PLAN_ALIASES[planId];
    if (aliasedId) {
        return PRICING_PLANS.find(p => p.id === aliasedId);
    }

    return undefined;
}

// ----------------------------------------------------------------------
// USAGE & OVERAGES
// ----------------------------------------------------------------------

export const OVERAGES = [
    { k: "SMS Messages", v: "$0.015", unit: "per msg" },
    { k: "Email Messages", v: "$0.003", unit: "per msg" },
    { k: "ZIP Code Expansion", v: "$15.00", unit: "per ZIP/mo" },
    { k: "Creative Assets", v: "$5.00", unit: "per asset (after limit)" },
    { k: "Competitors", v: "$10.00", unit: "per competitor/mo" }
];

// ----------------------------------------------------------------------
// LEGACY ADDONS (Kept for reference, but UI will likely deemphasize)
// ----------------------------------------------------------------------

export const ADDONS = [
    { name: "Creative Center", price: 0, note: "Included in plans", desc: "Autonomous content generation. Pro gets 10/mo, Growth gets 50/mo. Overage applies after." },
    { name: "Metro Package", price: 199, note: "City-wide dominance", desc: "Claim an entire city or metro area (e.g. 75 ZIPs) at a bulk rate." },
];

export const COVERAGE_PACKS = [
    {
        id: "pack_single",
        name: "Single ZIP",
        price: 15,
        priceDisplay: "$15",
        period: "/ mo",
        zips: 1
    },
    {
        id: "pack_metro",
        name: "Metro Pack",
        price: 199,
        priceDisplay: "$199",
        period: "/ mo",
        zips: 75
    },
    {
        id: "pack_state",
        name: "State Pack",
        price: 999,
        priceDisplay: "$999",
        period: "/ mo",
        zips: 500
    }
];

