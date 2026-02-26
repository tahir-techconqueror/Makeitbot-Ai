import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/server/auth/auth';
import { getCampaignById, getCampaignDeliveryLog } from '@/server/actions/campaigns';

interface CampaignLogPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignLogPage({ params }: CampaignLogPageProps) {
  await requireUser(['brand', 'super_user']);
  const { campaignId } = await params;

  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    notFound();
  }

  const logs = await getCampaignDeliveryLog(campaignId);
  const sent = logs.filter((r) => r.status === 'sent').length;
  const pending = logs.filter((r) => r.status === 'pending').length;
  const failed = logs.filter((r) => r.status === 'failed').length;

  return (
    <main className="flex flex-col gap-6 px-4 py-8 md:px-8 bg-black text-white min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Campaign Delivery Log</h1>
          <p className="text-zinc-300 mt-1">{campaign.name}</p>
          <p className="text-sm text-zinc-400">{campaign.subject}</p>
        </div>
        <Button asChild variant="outline" className="border-zinc-700 text-zinc-200">
          <Link href="/dashboard/agents/craig">Back</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-950/90">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-300">Recipients</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{logs.length}</div></CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950/90">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-300">Sent</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-400">{sent}</div></CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950/90">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-300">Pending</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-400">{pending}</div></CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950/90">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-300">Failed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-400">{failed}</div></CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-950/90">
        <CardHeader>
          <CardTitle className="text-lg text-blue-400">Recipient Preview + Status</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-zinc-400">No delivery rows found for this campaign.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{row.email}</p>
                    <p className="text-xs text-zinc-400">from: {row.fromEmail || 'n/a'}</p>
                    {row.error ? <p className="text-xs text-red-400">{row.error}</p> : null}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    row.status === 'sent' ? 'bg-green-600/20 text-green-400' :
                    row.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                    'bg-blue-600/20 text-blue-400'
                  }`}>
                    {row.status}
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
