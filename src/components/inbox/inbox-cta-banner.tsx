// src/components/inbox/inbox-cta-banner.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, Sparkles, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InboxCTABannerProps {
  variant?: 'creative' | 'playbooks' | 'projects';
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_CONFIG = {
  creative: {
    title: 'Create Content with AI Agents',
    description: 'Work with Drip, Nano Banana, and Sentinel in the inbox for faster content creation.',
    inboxType: 'creative' as const,
    ctaText: 'Open Inbox',
    icon: Sparkles,
  },
  playbooks: {
    title: 'Build Playbooks in the Inbox',
    description: 'Collaborate with your agent squad to create, review, and deploy playbooks.',
    inboxType: 'general' as const,
    ctaText: 'Open Inbox',
    icon: Inbox,
  },
  projects: {
    title: 'Manage Projects in the Inbox',
    description: 'Chat with agents to plan, execute, and track project workflows.',
    inboxType: 'general' as const,
    ctaText: 'Open Inbox',
    icon: Inbox,
  },
};

export function InboxCTABanner({
  variant = 'creative',
  onDismiss,
  className,
}: InboxCTABannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = React.useState(false);

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handleOpenInbox = () => {
    router.push(`/dashboard/inbox?type=${config.inboxType}`);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'relative overflow-hidden rounded-xl border border-zinc-800',
            'bg-zinc-950/90 backdrop-blur-md shadow-xl shadow-black/30',
            className
          )}
        >
          {/* Subtle animated gradient overlay (blue-ish) */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/20 via-transparent to-blue-950/10 animate-pulse" />

          <div className="relative p-5 md:p-6">
            <div className="flex items-start justify-between gap-5">
              <div className="flex items-start gap-5 flex-1">
                {/* Icon */}
                <div className="p-3.5 rounded-xl bg-blue-950/60 ring-1 ring-blue-900/40 shrink-0">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <h3 className="font-bold text-lg md:text-xl text-blue-400">
                      {config.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-blue-950/60 text-blue-300 border-blue-800/50 text-xs px-2 py-0.5"
                    >
                      NEW
                    </Badge>
                  </div>

                  <p className="text-sm md:text-base text-zinc-300 mb-4 leading-relaxed">
                    {config.description}
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleOpenInbox}
                      className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-md hover:shadow-lg transition-all"
                      size="sm"
                    >
                      {config.ctaText}
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open('https://docs.markitbot.com/inbox', '_blank');
                      }}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>

              {/* Dismiss Button */}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-900/70"
                  onClick={handleDismiss}
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact inline CTA for empty states
 */
export function InboxCTAInline({
  text = 'Create in Inbox',
  inboxType = 'general',
  className,
}: {
  text?: string;
  inboxType?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push(`/dashboard/inbox?type=${inboxType}`)}
      className={cn(
        'gap-2 border-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:text-white hover:border-blue-600/50 transition-all',
        className
      )}
    >
      <Inbox className="w-4 h-4 text-blue-400" />
      {text}
    </Button>
  );
}

export default InboxCTABanner;
