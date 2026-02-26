// src/app/dashboard/playbooks/components/activity-feed.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity as ActivityIcon, MessageSquare, ShoppingCart, Settings, Terminal } from 'lucide-react';
import { getRecentActivity } from '@/server/actions/activity';
import { ActivityEvent } from '@/types/events';
import { ScrollArea } from '@/components/ui/scroll-area';

// Fallback for Demo/Empty states
const FALLBACK_ACTIVITY: ActivityEvent[] = [
  {
    id: '1',
    orgId: 'demo',
    userId: 'user_1',
    userName: 'System',
    type: 'settings_changed',
    description: 'No recent activity to display',
    createdAt: new Date().toISOString(),
  },
];

export function ActivityFeed({ orgId }: { orgId?: string }) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      if (!orgId) {
        setActivities(FALLBACK_ACTIVITY);
        setLoading(false);
        return;
      }

      try {
        const data = await getRecentActivity(orgId);
        setActivities(data.length > 0 ? data : FALLBACK_ACTIVITY);
      } catch (error) {
        console.error('Failed to load activity feed:', error);
        setActivities(FALLBACK_ACTIVITY);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, [orgId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case 'recommendation_viewed':
        return <ShoppingCart className="h-4 w-4 text-blue-400" />;
      case 'settings_changed':
        return <Settings className="h-4 w-4 text-zinc-400" />;
      default:
        return <Terminal className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
      <CardHeader className="pb-3 border-b border-zinc-800">
        <CardTitle className="text-base font-semibold flex items-center gap-2.5 text-blue-400">
          <ActivityIcon className="h-4.5 w-4.5" />
          Live Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[220px] px-4 py-4 custom-scrollbar-dark">
          {loading ? (
            <div className="text-sm text-zinc-500 animate-pulse text-center py-6">
              Loading activity...
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3.5 items-start text-sm">
                  <div className="mt-0.5 bg-zinc-900 p-2 rounded-full border border-zinc-800 shrink-0">
                    {getIcon(activity.type)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <p className="font-medium leading-tight text-white">
                      {activity.userName}{' '}
                      <span className="font-normal text-zinc-300">{activity.description}</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(activity.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm italic">
                  No recent activity to display
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}