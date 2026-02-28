import 'server-only';

import { config } from 'dotenv';
config({ path: '.env.local' });

import { genkit, Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export { googleAI };

const FALLBACK_MODEL = 'googleai/gemini-2.5-flash-lite';

function isQuotaOrRateLimitError(error: unknown): boolean {
  const message = (error as any)?.message?.toLowerCase?.() || String(error || '').toLowerCase();
  return (
    message.includes('resource_exhausted') ||
    message.includes('quota exceeded') ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    message.includes('429')
  );
}

function isGeminiProModel(model: unknown): boolean {
  if (typeof model !== 'string') return false;
  const normalized = model.toLowerCase();
  return normalized.includes('gemini-3-pro') || normalized.includes('gemini-pro');
}

function buildFallbackGenerateArgs(args: any[]): any[] {
  if (!args.length || typeof args[0] !== 'object' || args[0] === null) {
    return args;
  }

  const options = args[0];
  return [
    {
      ...options,
      model: FALLBACK_MODEL,
      // Pro-only thinking configs can break or waste tokens on fallback models.
      config: undefined,
    },
    ...args.slice(1),
  ];
}

// Lazy initialization to prevent build-time errors when GEMINI_API_KEY is runtime-only
let _ai: Genkit | null = null;

function getAiInstance(): Genkit {
  if (_ai) return _ai;

  // Get API key from environment - GEMINI_API_KEY takes priority, fallback to GOOGLE_API_KEY
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('[Genkit] GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required. Please set it in your .env.local file.');
  }

  _ai = genkit({
    plugins: [
      googleAI({ apiKey }),
    ],
    // Default to most cost-effective model (free tier)
    model: 'googleai/gemini-2.5-flash-lite',
  });

  return _ai;
}

// Export a proxy that lazily initializes on first use
export const ai = new Proxy({} as Genkit, {
  get(_target, prop) {
    // During build/static analysis, return safe values for introspection properties
    if (typeof prop === 'string') {
      if (prop === 'then' || prop === 'toJSON' || prop === 'constructor') {
        return undefined;
      }
    }

    // Handle symbol properties
    if (prop === Symbol.toStringTag) {
      return 'Genkit';
    }

    // Check if GEMINI_API_KEY is available - if not, we're in build mode
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      // During build, return no-op functions for all method calls
      // This allows definePrompt and other setup calls to succeed without initializing
      return function(..._args: any[]) {
        // Return a mock object for definePrompt that has common properties
        return {
          name: String(prop),
          render: () => ({ prompt: '' }),
          stream: async function*() {},
        };
      };
    }

    // At runtime with API key available, initialize and use real Genkit
    const instance = getAiInstance();
    const value = (instance as any)[prop];

    // Global safety net: if Gemini Pro is quota-exhausted, retry once on Lite.
    if (typeof value === 'function' && prop === 'generate') {
      return async (...args: any[]) => {
        try {
          return await value.apply(instance, args);
        } catch (error) {
          const model = args?.[0]?.model;
          if (isGeminiProModel(model) && isQuotaOrRateLimitError(error)) {
            const fallbackArgs = buildFallbackGenerateArgs(args);
            return await value.apply(instance, fallbackArgs);
          }
          throw error;
        }
      };
    }

    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
