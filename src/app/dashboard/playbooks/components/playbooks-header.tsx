'use client';

/**
 * Playbooks Header
 *
 * Header with title, search, category filter tabs, and new playbook button.
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlaybookFilterCategory = 'All' | 'Intel' | 'SEO' | 'Ops' | 'Finance' | 'Compliance';

interface PlaybooksHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeFilter: PlaybookFilterCategory;
    onFilterChange: (filter: PlaybookFilterCategory) => void;
    onNewPlaybook: () => void;
}

const FILTERS: PlaybookFilterCategory[] = ['All', 'Intel', 'SEO', 'Ops', 'Finance', 'Compliance'];

export function PlaybooksHeader({
    searchQuery,
    onSearchChange,
    activeFilter,
    onFilterChange,
    onNewPlaybook,
}: PlaybooksHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h1 className="text-3xl font-bold text-white">Playbooks</h1>
                <p className="text-zinc-300">Automation recipes for your brand.</p>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="bg-zinc-900/85 border border-zinc-700 p-1 rounded-lg flex items-center">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => onFilterChange(filter)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                                activeFilter === filter
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-300 hover:text-white'
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* New Playbook Button */}
                <Button
                    onClick={onNewPlaybook}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Playbook
                </Button>
            </div>
        </div>
    );
}

export default PlaybooksHeader;
