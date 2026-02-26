// src/app/dashboard/playbooks/components/usage-meter.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Zap, MessageCircle } from 'lucide-react';

export function UsageMeter() {
  // Mock Data (you can replace with real data later)
  const usage = {
    messages: 750,
    limitMessages: 1000,
    recommendations: 320,
    apiCalls: 1540,
  };

  const percentage = (usage.messages / usage.limitMessages) * 100;

  return (
    <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30">
      <CardHeader className="pb-3 border-b border-zinc-800">
        <CardTitle className="text-base font-semibold flex items-center gap-2.5 text-blue-400">
          <BarChart className="h-4.5 w-4.5" />
          Usage & Metering
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Messages Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-300">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              Messages
            </span>
            <span className="font-medium text-white">
              {usage.messages} / {usage.limitMessages}
            </span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2.5 bg-zinc-800"
            indicatorClassName="bg-blue-600"
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-2 gap-5 pt-2">
          <div className="space-y-1.5">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-blue-400" />
              AI Recs
            </span>
            <p className="text-2xl font-bold text-white">{usage.recommendations}</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              API Calls
            </span>
            <p className="text-2xl font-bold text-white">{usage.apiCalls}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}