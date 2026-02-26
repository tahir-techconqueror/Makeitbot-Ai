// src\app\dashboard\playbooks\components\create-playbook-banner.tsx
'use client';

/**
 * Create Playbook Banner
 *
 * Banner card prompting users to create a new playbook.
 */

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatePlaybookBannerProps {
    onClick: () => void;
}

export function CreatePlaybookBanner({ onClick }: CreatePlaybookBannerProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'glass-card glass-card-hover',
                'w-full text-left',
                'border border-dashed border-border/50',
                'rounded-xl p-6 flex items-center gap-4',
                'cursor-pointer transition-all duration-200'
            )}
        >
            <div className="bg-muted p-3 rounded-lg">
                <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
                <h2 className="text-xl font-semibold text-white mb-1">
                    Launch a New Playbook
                </h2>
                <p className="text-zinc-300">
                    Set up a new playbook and automate it through chat.
                </p>
            </div>
        </button>
    );
}

export default CreatePlaybookBanner;
