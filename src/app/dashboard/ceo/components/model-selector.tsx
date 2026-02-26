// src\app\dashboard\ceo\components\model-selector.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Lock,
  Sparkles,
  Brain,
  Zap,
  Rocket,
  CheckCircle2,
  Globe,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ThinkingLevel type for intelligence selector
export type ThinkingLevel = 'lite' | 'standard' | 'advanced' | 'expert' | 'genius' | 'deep_research';

export interface ModelSelectorProps {
  value: ThinkingLevel;
  onChange: (v: ThinkingLevel) => void;
  userPlan?: string;
  unlockResearch?: boolean;
  isSuperUser?: boolean;
  isPublic?: boolean;
  restrictedLevels?: ThinkingLevel[];
}

export function ModelSelector({
  value,
  onChange,
  userPlan = 'free',
  unlockResearch = false,
  isSuperUser = false,
  isPublic = false,
  restrictedLevels = [],
}: ModelSelectorProps) {
  const isPaid = userPlan !== 'free' || isSuperUser;

  const options: Record<ThinkingLevel, { label: string; desc: string; icon: any; locked?: boolean }> = {
    lite: { label: 'Lite', desc: 'Ultra-fast responses', icon: Globe },
    standard: { label: 'Standard', desc: 'Balanced speed & quality', icon: Zap, locked: !isPaid },
    advanced: { label: 'Advanced', desc: 'Complex reasoning', icon: Brain, locked: !isPaid },
    expert: { label: 'Reasoning', desc: 'Step-by-step analysis', icon: Sparkles, locked: !isSuperUser },
    genius: { label: 'Genius', desc: 'Maximum intelligence', icon: Rocket, locked: !isSuperUser },
    deep_research: { label: 'Deep Research', desc: 'Comprehensive web analysis', icon: Globe, locked: !isSuperUser && !unlockResearch },
  };

  const SelectedIcon = options[value].icon;
  const lockedMessage = isPublic ? 'Login to access this model' : 'Upgrade to access this model';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-xs font-medium border border-zinc-700 hover:border-blue-600/50 hover:bg-zinc-900/70 text-zinc-200 transition-colors"
        >
          <SelectedIcon className="h-3.5 w-3.5 text-blue-400" />
          {options[value].label}
          <ChevronDown className="h-3 w-3 opacity-60 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-[300px] bg-zinc-950 border-zinc-800 text-white shadow-2xl backdrop-blur-md"
      >
        <DropdownMenuLabel className="text-blue-400 text-sm font-semibold px-3 py-2">
          Intelligence Level
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800 mx-2" />

        {(Object.entries(options) as [ThinkingLevel, typeof options['standard']][])
          .filter(([key]) => !restrictedLevels.includes(key as ThinkingLevel))
          .map(([key, opt]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => !opt.locked && onChange(key)}
              disabled={opt.locked}
              className={cn(
                "px-3 py-3 cursor-pointer transition-colors hover:bg-zinc-900",
                opt.locked && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2.5 w-full">
                <opt.icon className={cn("h-4 w-4", opt.locked ? "text-zinc-500" : "text-blue-400")} />
                <span className="font-medium flex-1 text-white">{opt.label}</span>
                {opt.locked && <Lock className="h-3.5 w-3.5 text-zinc-500" />}
                {!opt.locked && value === key && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
              </div>
              <span className="text-xs text-zinc-400 mt-1 block">
                {opt.locked ? lockedMessage : opt.desc}
              </span>
            </DropdownMenuItem>
          ))}

        {isPublic && (
          <div className="p-3 bg-zinc-900/70 text-xs text-zinc-400 text-center border-t border-zinc-800 mt-1">
            <a href="/login" className="text-blue-400 hover:underline">Login</a> or
            <a href="/signup" className="text-blue-400 hover:underline ml-1">Sign up</a> for full access.
          </div>
        )}

        {!isPaid && !isPublic && (
          <div className="p-3 bg-zinc-900/70 text-xs text-zinc-400 text-center border-t border-zinc-800 mt-1">
            Upgrade plan to unlock Standard, Advanced & higher models.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}