// src/app/dashboard/agents/[agentId]/page.tsx

import { agents } from '@/config/agents';
import { requireUser } from '@/server/auth/auth';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Activity, Zap } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    agentId: string;
  }>;
}

export default async function AgentDetailsPage({ params }: PageProps) {
  const { agentId } = await params;

  await requireUser(['brand', 'super_user']);

  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    notFound();
  }

  const Icon = agent.icon;

  return (
    <main className="flex flex-col gap-8 px-4 py-8 md:px-10 bg-black text-white min-h-screen">
      {/* Header / Back + Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-zinc-300 hover:text-white hover:bg-zinc-900/70">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-400">
                {agent.name}
              </h1>
              <Badge
                variant={agent.status === 'online' ? 'default' : 'secondary'}
                className={`
                  text-sm font-normal capitalize px-3 py-1
                  ${agent.status === 'online' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'}
                `}
              >
                {agent.status}
              </Badge>
            </div>
            <p className="text-lg text-zinc-300">
              {agent.title} · {agent.description}
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="border-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:text-white hover:border-blue-600/50 transition-all"
        >
          <Settings className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30 transition-all hover:border-blue-600/50 hover:shadow-2xl hover:shadow-blue-950/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-zinc-200">
              Status
            </CardTitle>
            <Activity className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white capitalize">{agent.status}</div>
            <p className="text-sm text-zinc-400 mt-2">
              System nominal
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30 transition-all hover:border-blue-600/50 hover:shadow-2xl hover:shadow-blue-950/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-zinc-200">
              {agent.primaryMetricLabel}
            </CardTitle>
            <Zap className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{agent.primaryMetricValue}</div>
            <p className="text-sm text-zinc-400 mt-2">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        {/* Agent Console - Left Column */}
        <div className="col-span-4 lg:col-span-5 space-y-8">
          <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-2xl font-bold text-blue-400">
                Agent Console
              </CardTitle>
              <CardDescription className="text-zinc-300">
                Direct interface for {agent.name}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="bg-zinc-950/70 p-6 rounded-xl border border-zinc-800 min-h-[220px] flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950/70 border border-blue-900/50">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>

                  <div className="space-y-3 flex-1">
                    <p className="text-sm font-medium text-zinc-400">{agent.name} is ready</p>
                    <div className="text-base leading-relaxed text-zinc-100 bg-zinc-900/70 p-4 rounded-lg border border-zinc-800 shadow-inner">
                      {agent.id === 'craig' && "Ready to launch campaigns. Need an email draft or segment?"}
                      {agent.id === 'deebo' && "Compliance engine active. Send me a label, page, or menu to audit."}
                      {agent.id === 'pops' && "Forecasting models loaded. Ask me about next month's sales or trends."}
                      {agent.id === 'ezal' && "Market scanners running. Who are we tracking today?"}
                      {agent.id === 'smokey' && "Budtender mode on. What product or question can I help with?"}
                      {agent.id === 'money-mike' && "Margins look tight. Should we check competitor pricing or adjust?"}
                      {!['craig','deebo','pops','ezal','smokey','money-mike'].includes(agent.id) && 
                        "Agent online and ready to assist. How can I help you today?"}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start text-zinc-200 hover:bg-zinc-900 hover:text-white hover:border-blue-600/50 border-zinc-700 transition-all h-12 text-base"
                asChild
              >
                <Link href={`/dashboard?agent=${agent.id}`}>
                  <Activity className="mr-3 h-5 w-5 text-blue-400" />
                  Open full chat session with {agent.name}...
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Capabilities - Right Column */}
        <div className="col-span-4 lg:col-span-2 space-y-8">
          <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-xl font-bold text-blue-400">
                Capabilities
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <ul className="space-y-4 text-base">
                {agent.id === 'craig' && (
                  <>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-100">Email & SMS Generation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-100">Campaign Segmentation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-100">A/B Testing & Optimization</span>
                    </li>
                  </>
                )}

                {agent.id === 'deebo' && (
                  <>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-100">Label & Menu Audits</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-100">Age Gate & Disclaimer Checks</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-100">Jurisdiction Rule Engine</span>
                    </li>
                  </>
                )}

                {/* Default for all other agents */}
                {['craig', 'deebo'].includes(agent.id) === false && (
                  <>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-100">Natural Language Processing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-zinc-100">Real-time Analysis & Insights</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500/70" />
                      <span className="text-zinc-100">Advanced Tools (Beta)</span>
                    </li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}