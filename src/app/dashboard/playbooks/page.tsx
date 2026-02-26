'use client';

/**
 * Playbooks Page
 *
 * Modern glassmorphism playbooks page with category filters, toggle switches,
 * and enhanced cards. Preserves role-based views and AgentChat integration.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useUserRole } from '@/hooks/use-user-role';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ActivityFeed } from './components/activity-feed';
import { UsageMeter } from './components/usage-meter';
import { AgentChat } from './components/agent-chat';
import DispensaryDashboardClient from '../dispensary/dashboard-client';
import { BrandPlaybooksView } from '../brand/components/brand-playbooks-view';
import { PLAYBOOKS, Playbook } from './data';
import { PlaybooksHeader, PlaybookFilterCategory } from './components/playbooks-header';
import { PlaybookCardModern } from './components/playbook-card-modern';
import { CreatePlaybookBanner } from './components/create-playbook-banner';
import { InboxCTABanner } from '@/components/inbox';

export default function PlaybooksPage() {
    const { role, user, isLoading } = useUserRole();
    const { toast } = useToast();
    const [isClientReady, setIsClientReady] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<PlaybookFilterCategory>('All');
    const [selectedPrompt, setSelectedPrompt] = useState<string>('');
    const [promptVersion, setPromptVersion] = useState(0);
    const [dynamicPlaybooks, setDynamicPlaybooks] = useState<Playbook[]>([]);
    const [playbookOverrides, setPlaybookOverrides] = useState<Record<string, Partial<Playbook>>>({});
    const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editType, setEditType] = useState<Playbook['type']>('AUTOMATION');
    const chatSectionRef = useRef<HTMLElement | null>(null);
    const [playbookStates, setPlaybookStates] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(PLAYBOOKS.map((pb) => [pb.id, pb.active]))
    );

    useEffect(() => {
        setIsClientReady(true);
    }, []);

    const allPlaybooks = useMemo(
        () => [...dynamicPlaybooks, ...PLAYBOOKS],
        [dynamicPlaybooks]
    );

    // IMPORTANT: All hooks must be called before any early returns
    // Filter playbooks by search and category
    const filteredPlaybooks = useMemo(() => {
        let result = allPlaybooks;

        // Apply category filter
        if (activeFilter !== 'All') {
            result = result.filter(
                (pb) => pb.type.toUpperCase() === activeFilter.toUpperCase()
            );
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (pb) =>
                    pb.title.toLowerCase().includes(query) ||
                    pb.description.toLowerCase().includes(query) ||
                    pb.tags.some((tag) => tag.toLowerCase().includes(query))
            );
        }

        // Add current enabled state to playbooks
        return result.map((pb) => {
            const override = playbookOverrides[pb.id] || {};
            return {
                ...pb,
                ...override,
                active: playbookStates[pb.id] ?? (override.active ?? pb.active),
            };
        });
    }, [searchQuery, activeFilter, playbookStates, allPlaybooks, playbookOverrides]);

    const handleRunPlaybook = (playbook: Playbook) => {
        setSelectedPrompt(playbook.prompt);
        setPromptVersion((v) => v + 1);
        toast({
            title: `${playbook.title} loaded`,
            description: 'Prompt added to chat. Press Enter to run it.',
        });
        chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleTogglePlaybook = (id: string, enabled: boolean) => {
        setPlaybookStates((prev) => ({ ...prev, [id]: enabled }));
        toast({
            title: enabled ? 'Playbook Enabled' : 'Playbook Disabled',
            description: `The playbook has been ${enabled ? 'enabled' : 'disabled'}.`,
        });
    };

    const handleEditPlaybook = (playbook: Playbook) => {
        setEditingPlaybook(playbook);
        setEditTitle(playbook.title);
        setEditDescription(playbook.description);
        setEditType(playbook.type);
    };

    const handleSaveEditPlaybook = () => {
        if (!editingPlaybook) return;
        const title = editTitle.trim();
        const description = editDescription.trim();
        if (!title) {
            toast({
                variant: 'destructive',
                title: 'Title required',
                description: 'Playbook title empty nahi ho sakta.',
            });
            return;
        }

        setPlaybookOverrides((prev) => ({
            ...prev,
            [editingPlaybook.id]: {
                title,
                description: description || editingPlaybook.description,
                type: editType,
            },
        }));
        toast({
            title: 'Playbook Updated',
            description: `"${title}" updated successfully.`,
        });
        setEditingPlaybook(null);
    };

    const handleDuplicatePlaybook = (playbook: Playbook) => {
        toast({
            title: 'Playbook Duplicated',
            description: `"${playbook.title}" has been duplicated.`,
        });
        // TODO: Implement duplicate via server action
    };

    const handleDeletePlaybook = (playbook: Playbook) => {
        toast({
            variant: 'destructive',
            title: 'Playbook Deleted',
            description: `"${playbook.title}" has been removed.`,
        });
        // TODO: Implement delete via server action
    };

    const handleNewPlaybook = () => {
        // Scroll to AgentChat and set prompt for new playbook
        setSelectedPrompt('Create a new playbook for my brand');
        setPromptVersion((v) => v + 1);
        toast({
            title: 'New Playbook prompt loaded',
            description: 'Use this as a starter, then press Enter.',
        });
        chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handlePlaybookCreatedInChat = (created: {
        title: string;
        description?: string;
        type?: Playbook['type'];
        prompt?: string;
    }) => {
        const title = (created.title || '').trim();
        if (!title) return;

        setDynamicPlaybooks((prev) => {
            const exists = prev.some((pb) => pb.title.toLowerCase() === title.toLowerCase());
            if (exists) return prev;

            const id = `pb_dynamic_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
            const newPlaybook: Playbook = {
                id,
                title,
                type: created.type || 'AUTOMATION',
                description: created.description || 'Created from chat',
                tags: ['chat-created', 'custom'],
                active: true,
                status: 'active',
                prompt: created.prompt || `Run playbook: ${title}`,
            };

            setPlaybookStates((state) => ({ ...state, [id]: true }));
            return [newPlaybook, ...prev];
        });

        toast({
            title: 'Playbook added to grid',
            description: `"${title}" ab list me visible hai.`,
        });
    };

    if (!isClientReady || isLoading) {
        return <div className="p-6 text-sm text-muted-foreground">Loading playbooks...</div>;
    }

    // Role-based redirects (AFTER all hooks)
    // Redirect Dispensary users to their specific console
    if (role === 'dispensary') {
        const brandId = (user as any)?.brandId || user?.uid || 'unknown-dispensary';
        return <DispensaryDashboardClient brandId={brandId} />;
    }

    if (role === 'brand') {
        const brandId = (user as any)?.brandId || user?.uid;
        return <BrandPlaybooksView brandId={brandId} />;
    }

    // Super user / other roles see the full playbooks UI
    return (
        <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
            {/* Header with Search and Filters */}
            <PlaybooksHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onNewPlaybook={handleNewPlaybook}
            />

            {/* Inbox CTA Banner */}
            <InboxCTABanner variant="playbooks" />

            {/* Agent Builder Chat Interface */}
            <section ref={chatSectionRef} className="w-full">
                <AgentChat
                    initialInput={selectedPrompt}
                    initialInputVersion={promptVersion}
                    onPlaybookCreated={handlePlaybookCreatedInChat}
                />
            </section>

            {/* Activity & Usage Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ActivityFeed
                        orgId={
                            (user as any)?.brandId ||
                            (user as any)?.currentOrgId ||
                            user?.uid
                        }
                    />
                </div>
                <div>
                    <UsageMeter />
                </div>
            </div>

            {/* Playbooks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlaybooks.map((playbook) => (
                    <PlaybookCardModern
                        key={playbook.id}
                        playbook={playbook}
                        onToggle={handleTogglePlaybook}
                        onRun={handleRunPlaybook}
                        onEdit={handleEditPlaybook}
                        onDuplicate={handleDuplicatePlaybook}
                        onDelete={handleDeletePlaybook}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredPlaybooks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No playbooks found matching your criteria.</p>
                </div>
            )}

            {/* Create Playbook Banner */}
            <CreatePlaybookBanner onClick={handleNewPlaybook} />

            <Dialog open={!!editingPlaybook} onOpenChange={(open) => !open && setEditingPlaybook(null)}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>Edit Playbook</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-playbook-title">Title</Label>
                            <Input
                                id="edit-playbook-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Playbook title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-playbook-description">Description</Label>
                            <Textarea
                                id="edit-playbook-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="What this playbook does"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-playbook-type">Type</Label>
                            <select
                                id="edit-playbook-type"
                                value={editType}
                                onChange={(e) => setEditType(e.target.value as Playbook['type'])}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="SIGNAL">SIGNAL</option>
                                <option value="AUTOMATION">AUTOMATION</option>
                                <option value="REPORTING">REPORTING</option>
                                <option value="INTEL">INTEL</option>
                                <option value="OPS">OPS</option>
                                <option value="SEO">SEO</option>
                                <option value="COMPLIANCE">COMPLIANCE</option>
                                <option value="FINANCE">FINANCE</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPlaybook(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEditPlaybook}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
