// src/components/dashboard/agent-grid.tsx
import Link from 'next/link';
import { Bot, MessageSquareMore, Mail, LineChart, ShieldCheck, Percent, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentEntity } from '@/server/actions/agents';
import { agents as STATIC_AGENT_CONFIG, AgentId, AgentDefinition } from '@/config/agents';

// Helper to get icon for agent ID
const getIconForAgent = (id: string) => {
  const config = STATIC_AGENT_CONFIG.find((a) => a.id === id);
  return config?.icon || Bot;
};

// Helper to get tags for agent ID
const getTagsForAgent = (id: string) => {
  const config = STATIC_AGENT_CONFIG.find((a) => a.id === id);
  return config?.tag ? [config.tag] : ['Agent'];
};

type DisplayAgent = AgentEntity | AgentDefinition;

interface AgentsGridProps {
  agents?: DisplayAgent[];
}

export function AgentsGrid({ agents }: AgentsGridProps) {
  // Use passed agents (live) or fallback to static config
  const displayList = agents && agents.length > 0 ? agents : STATIC_AGENT_CONFIG;

  return (
    <section className="space-y-6 bg-black text-white">
      {/* Optional section title in blue */}
      <h2 className="text-2xl font-bold text-blue-400 tracking-tight">
        Your Active Agents
      </h2>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {displayList.map((agent) => {
          const Icon = getIconForAgent(agent.id);
          const tags = getTagsForAgent(agent.id);

          return (
            <Card
              key={agent.id}
              className="flex flex-col justify-between border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30 transition-all duration-300 hover:border-blue-600/70 hover:shadow-2xl hover:shadow-blue-950/40"
            >
              <CardHeader className="space-y-2 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/70">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="space-y-0.5">
                      <CardTitle className="text-lg font-bold text-white leading-tight">
                        {agent.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-zinc-300">
                        {agent.title || (agent as any).role || 'AI Assistant'}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Status badge – blue for active/online */}
                  <Badge
                    variant={
                      agent.status === 'online' || (agent.status as string) === 'Active'
                        ? 'default'
                        : agent.status === 'training'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={`text-xs uppercase tracking-wide px-3 py-1 ${
                      agent.status === 'online' || (agent.status as string) === 'Active'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {agent.status || 'Offline'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-4 flex-1">
                <p className="text-sm text-zinc-200 line-clamp-3 mb-4">
                  {agent.description || 'No description available.'}
                </p>

                {/* Metrics Preview */}
                <div className="flex items-center gap-3 text-sm bg-zinc-900/70 p-3 rounded-xl border border-zinc-800">
                  <span className="font-medium text-zinc-300">{agent.primaryMetricLabel || 'Activity'}:</span>
                  <span className="font-bold text-white">{agent.primaryMetricValue || 'N/A'}</span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs px-2.5 py-1 border-zinc-700 text-zinc-300 bg-zinc-900/50"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button
                  asChild
                  size="sm"
                  className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Link href={agent.href || '#'}>
                    Open
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}