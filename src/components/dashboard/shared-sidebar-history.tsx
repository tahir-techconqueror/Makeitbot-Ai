// src/components/dashboard/shared-sidebar-history.tsx
'use client';

import { useUnifiedHistory, HistorySource } from '@/hooks/use-unified-history';
import { useInboxStore } from '@/lib/store/inbox-store';
import { useAgentChatStore } from '@/lib/store/agent-chat-store';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Inbox, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useUserRole } from '@/hooks/use-user-role';
import { formatSmartTime } from '@/lib/utils/format-time';
import { useEffect } from 'react';

export function SharedSidebarHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useUserRole();

  const { items, activeItemId, isEmpty, filter, setFilter, counts } = useUnifiedHistory({
    role,
    maxItems: 5,
  });

  const { clearCurrentSession, setActiveSession, setCurrentRole } = useAgentChatStore();
  const { setActiveThread } = useInboxStore();

  useEffect(() => {
    if (role) setCurrentRole(role);
  }, [role, setCurrentRole]);

  const isBusinessUser =
    role === 'brand' ||
    role === 'brand_admin' ||
    role === 'brand_member' ||
    role === 'dispensary' ||
    role === 'dispensary_admin' ||
    role === 'dispensary_staff' ||
    role === 'budtender';

  const handleNewChat = () => {
    clearCurrentSession();
    setActiveThread(null);

    if (isBusinessUser) {
      if (pathname !== '/dashboard/inbox') {
        router.push('/dashboard/inbox');
      }
    } else {
      if (pathname !== '/dashboard/playbooks') {
        router.push('/dashboard/playbooks');
      }
    }
  };

  const handleSelectItem = (item: (typeof items)[0]) => {
    if (item.source === 'inbox') {
      setActiveThread(item.originalId);
      if (pathname !== '/dashboard/inbox') {
        router.push('/dashboard/inbox');
      }
    } else {
      setActiveSession(item.originalId);
      if (pathname !== '/dashboard/playbooks') {
        router.push('/dashboard/playbooks');
      }
    }
  };

  // Filter button component
  const FilterButton = ({
    value,
    label,
    count,
  }: {
    value: HistorySource;
    label: string;
    count: number;
  }) => (
    <button
      onClick={() => setFilter(value)}
      className={cn(
        'px-2 py-1 text-xs rounded transition-colors',
        filter === value
          ? 'bg-blue-950/70 text-blue-300 font-medium border border-blue-800/50'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent'
      )}
    >
      {label}
      {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
    </button>
  );

  return (
    <div className="flex flex-col w-full mb-6 bg-black text-white">
      <div className="px-3 mb-4">
        <Button
          onClick={handleNewChat}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white justify-start gap-2 shadow-md hover:shadow-lg transition-all h-10"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="px-4 py-2 text-xs uppercase font-bold text-zinc-400 flex items-center gap-2 tracking-wider">
        <Clock className="h-3.5 w-3.5" />
        Recent History
      </div>

      {/* Filter Toggle */}
      {counts.inbox > 0 && counts.playbooks > 0 && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          <FilterButton value="all" label="All" count={counts.all} />
          <FilterButton value="inbox" label="Inbox" count={counts.inbox} />
          <FilterButton value="playbooks" label="Playbooks" count={counts.playbooks} />
        </div>
      )}

      <div className="px-2">
        <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
          {isEmpty ? (
            <p className="text-xs text-zinc-500 text-center py-4 italic opacity-70">
              No recent activity
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg transition-all text-sm group flex items-center gap-3 border',
                  activeItemId === item.id
                    ? 'bg-blue-950/60 text-blue-200 border-blue-800/70 shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-900/70 hover:text-white border-transparent'
                )}
              >
                {/* Source icon */}
                {item.source === 'inbox' ? (
                  <Inbox className="h-4 w-4 shrink-0 opacity-70 text-zinc-400 group-hover:text-blue-400" />
                ) : (
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70 text-zinc-400 group-hover:text-blue-400" />
                )}

                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="truncate block font-medium text-white">{item.title}</span>
                  <span className="text-xs text-zinc-500">
                    {formatSmartTime(item.timestamp, { abbreviated: true })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mx-4 mt-4 mb-3 border-b border-zinc-800" />
    </div>
  );
}