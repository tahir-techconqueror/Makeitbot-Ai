// src\app\dashboard\agents\craig\page.tsx

import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Mail, MessageSquare, BarChart3, History } from 'lucide-react';
import Link from 'next/link';
import { requireUser } from '@/server/auth/auth';
import { getCampaigns } from '@/server/actions/campaigns';

export const metadata: Metadata = {
  title: 'Drip (Marketer) | markitbot AI',
};

export default async function CraigDashboardPage() {
  await requireUser(['brand', 'super_user']);
  
  const campaigns = await getCampaigns();
  const activeCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
  const emailsSent = campaigns.reduce((total, campaign) => total + (campaign.sentCount || 0), 0);

  return (
    <main className="flex flex-col gap-8 px-4 py-8 md:px-8 bg-black text-white min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-400">
            Drip (Marketer)
          </h1>
          <p className="text-lg text-zinc-300">
            Automate your marketing campaigns with AI-generated content.
          </p>
        </div>
        <Button
          asChild
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Link href="/dashboard/agents/craig/campaigns/new">
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Link>
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30 transition-all hover:border-blue-600/50 hover:shadow-2xl hover:shadow-blue-950/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Active Campaigns
            </CardTitle>
            <Mail className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{activeCampaigns}</div>
            <p className="text-sm text-zinc-400 mt-1">
              {activeCampaigns === 0 ? 'Create your first campaign' : 'Active campaigns running'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30 transition-all hover:border-blue-600/50 hover:shadow-2xl hover:shadow-blue-950/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Emails Sent
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{emailsSent}</div>
            <p className="text-sm text-zinc-400 mt-1">
              {emailsSent === 0 ? 'No emails sent yet' : 'Emails sent successfully'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30 transition-all hover:border-blue-600/50 hover:shadow-2xl hover:shadow-blue-950/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Avg. Open Rate
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{emailsSent > 0 ? '--' : '--'}</div>
            <p className="text-sm text-zinc-400 mt-1">
              {emailsSent === 0 ? 'Not enough data' : 'Pending analytics'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns Card */}
      <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-400">
            Recent Campaigns
          </CardTitle>
          <CardDescription className="text-zinc-300">
            Your latest marketing activities and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="flex flex-col gap-6 items-center justify-center py-12 text-zinc-400 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50">
              <History className="h-12 w-12 opacity-50 text-blue-400" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-white">
                  No campaigns yet.
                </p>
                <p className="text-sm">
                  Start one today to see your marketing automation in action!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
                  <div className="space-y-1">
                    <p className="font-medium text-white">{campaign.name}</p>
                    <p className="text-sm text-zinc-400">{campaign.goal}</p>
                    <div className="text-xs text-zinc-500">
                      recipients: {campaign.recipientCount || 0} | sent: {campaign.sentCount || 0} | failed: {campaign.failedCount || 0}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/agents/craig/campaigns/${campaign.id}`}
                      className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
                    >
                      view log
                    </Link>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'scheduled' ? 'bg-blue-600/20 text-blue-400' :
                      campaign.status === 'sent' ? 'bg-green-600/20 text-green-400' :
                      'bg-zinc-700 text-zinc-300'
                    }`}>
                      {campaign.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

