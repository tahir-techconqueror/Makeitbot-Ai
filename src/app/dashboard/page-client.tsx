// src\app\dashboard\page-client.tsx
'use client';

import { AgentsGrid } from '@/components/dashboard/agent-grid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardConfig } from '@/hooks/use-dashboard-config';
import { ArrowRight, BarChart3, Sparkles, Users } from 'lucide-react';

export default function DashboardWelcome() {
  const { navLinks } = useDashboardConfig();

  const accountLink = navLinks.find((link) => link.href === '/account');
  const agentsLink = navLinks.find((link) => link.href.startsWith('/dashboard/agents'));

  return (
    <div className="space-y-8 bg-black text-white min-h-screen p-6 md:p-8">
      {/* Top welcome + quick stats */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
          <CardHeader className="pb-4">
            <p className="text-xs font-medium text-blue-400 uppercase tracking-wide">
              Welcome to Markitbot AI
            </p>
            <CardTitle className="text-2xl md:text-3xl font-bold text-blue-400">
              Your Markitbot AI agents are ready.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base text-zinc-200">
            <p>
              This is your command center for{' '}
              <span className="font-medium text-white">autonomous brand commerce</span>.
              Keep customers in your funnel while Ember, Drip, Pulse, and crew handle the heavy lifting.
            </p>
            <p>
              Start by tuning your <span className="font-medium text-white">agents</span> and{' '}
              <span className="font-medium text-white">account settings</span>, then connect menus, campaigns, and insights.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950/70">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Agents active
                </p>
                <p className="text-lg font-semibold text-white">4 / 6</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950/70">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Conversations today
                </p>
                <p className="text-lg font-semibold text-white">238</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30 hidden sm:block lg:block">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950/70">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Attributed revenue (7d)
                </p>
                <p className="text-lg font-semibold text-white">$18.4k</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Agent grid */}
      <AgentsGrid />

      {/* Next steps row */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-blue-400">
              Tune your agents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base text-zinc-200">
            <p>
              Set guardrails, tones, and goals so Ember, Drip, and Pulse reflect your brand voice and priorities.
            </p>
            {agentsLink ? (
              <a
                href={agentsLink.href}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1.5 transition-colors"
              >
                Go to Agents <ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-blue-400">
              Lock in your brand account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base text-zinc-200">
            <p>
              Add your brand details, jurisdictions, and stack so Sentinel and Ledger stay compliant and margin-aware.
            </p>
            {accountLink ? (
              <a
                href={accountLink.href}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1.5 transition-colors"
              >
                Open Account Settings <ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
