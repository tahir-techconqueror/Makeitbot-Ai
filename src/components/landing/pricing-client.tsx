// src\components\landing\pricing-client.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PRICING_PLANS, ADDONS, OVERAGES } from '@/lib/config/pricing';

// Type definitions for component props
type Tier = {
  name: string;
  badge: string;
  priceLaunch: number | null;
  priceLater: number | null;
  highlight: string;
  includes: string[];
  price: number | null;
  desc: string;
  features: string[];
  pill: string;
};

// Simplified Tab Component
function PricingTabs({
  tabs,
  initial,
}: {
  tabs: { key: string; label: string; content: React.ReactNode }[];
  initial: string;
}) {
  const [active, setActive] = useState(initial);
  const activeTab = useMemo(() => tabs.find((t) => t.key === active) ?? tabs[0], [tabs, active]);

  return (
    <div>
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-2xl border border-zinc-800 bg-zinc-950/70 p-1.5 backdrop-blur-md">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={
                "px-6 py-2.5 text-base font-medium rounded-xl transition-all duration-200 " +
                (t.key === active
                  ? "bg-zinc-800 text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60")
              }
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab?.content}
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "";
  return `$${Math.round(value)}`;
}

function Price({ value }: { value: number | null }) {
  if (value === null) return <span className="text-5xl font-bold text-white font-teko tracking-wide">Custom</span>;
  return (
    <div className="flex items-end gap-1.5">
      <span className="text-6xl font-bold text-white font-teko tracking-wide">{formatMoney(value)}</span>
      <span className="text-lg text-zinc-400 pb-3 font-medium">/mo</span>
    </div>
  );
}

export function PricingClient() {
  const tabs = useMemo(() => [
    {
      key: "tiers",
      label: "Plans",
      content: (
        <div className="space-y-10">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {PRICING_PLANS.map((t) => (
              <Card
                key={t.name}
                className={`flex flex-col relative overflow-hidden transition-all duration-300 hover:scale-[1.03] border-zinc-800 bg-zinc-950/90 backdrop-blur-sm ${
                  t.badge === "Most Popular"
                    ? "border-emerald-600/70 shadow-2xl shadow-emerald-950/40 ring-1 ring-emerald-500/30"
                    : "hover:border-indigo-600/50 hover:shadow-xl hover:shadow-indigo-950/30"
                }`}
              >
                {t.badge === "Most Popular" && (
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
                )}

                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <CardTitle className="text-2xl font-bold text-white">{t.name}</CardTitle>
                    {t.badge && (
                      <Badge
                        variant={t.badge === "Most Popular" ? "default" : "secondary"}
                        className={
                          t.badge === "Most Popular"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-zinc-800 text-zinc-200 border-zinc-700"
                        }
                      >
                        {t.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-zinc-200 min-h-[50px]">
                    {typeof t.highlight === 'string' ? t.highlight : t.desc}
                  </p>

                  <div className="mt-8">
                    {t.name === "Enterprise" ? (
                      <Price value={null} />
                    ) : (
                      <div>
                        <Price value={t.price} />
                        <div className="mt-2 text-sm text-zinc-400 flex items-center gap-3">
                          <span className="line-through opacity-60">{formatMoney(t.priceLater ?? 0)}/mo</span>
                          <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full text-xs">
                            Launch Price
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pb-8">
                  <Separator className="mb-8 opacity-30 border-zinc-800" />
                  <ul className="space-y-4 text-base">
                    {t.features.map((inc) => (
                      <li key={inc} className="flex gap-3 items-start group">
                        <span className="mt-1 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/70 text-emerald-400 group-hover:bg-emerald-900/80 transition-colors">
                          <svg width="12" height="10" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 1L3.5 6.5L1 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="text-zinc-100 group-hover:text-white transition-colors">{inc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="mt-auto pt-6 pb-8">
                  <Button
                    className={`w-full h-12 text-lg font-semibold transition-all duration-300 ${
                      t.name === "Enterprise"
                        ? "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-xl"
                    }`}
                    asChild
                  >
                    <a href={t.name === "Enterprise" ? "/contact" : "/get-started"}>
                      {t.name === "Enterprise" ? "Talk to Sales" : t.pill}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-zinc-400 bg-zinc-950/70 inline-block px-6 py-3 rounded-full border border-zinc-800">
              💡 Intro pricing includes monthly usage. If you go above limits, overages stay transparent (see Overages tab).
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "addons",
      label: "Add-ons",
      content: (
        <div className="space-y-10">
          <div className="mb-10 p-8 bg-zinc-950/80 rounded-3xl border border-zinc-800 text-center max-w-4xl mx-auto backdrop-blur-sm">
            <h4 className="font-bold text-2xl text-white mb-3">Agent Workspace Add-ons</h4>
            <p className="text-lg text-zinc-300">
              Add specialized AI agents as your team grows. They plug into the same data and share your monthly usage allowance.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {ADDONS.map((a) => (
              <Card
                key={a.name}
                className="bg-zinc-950/90 border-zinc-800 hover:border-indigo-600/70 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/30 backdrop-blur-sm"
              >
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">{a.name}</CardTitle>
                  <p className="text-lg text-zinc-300 mt-2">{a.note}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-6">
                    <span className="text-5xl font-bold text-white font-teko">{formatMoney(a.price)}</span>
                    <span className="text-lg text-zinc-400 pb-2">/mo</span>
                  </div>
                  <p className="text-base text-zinc-200 leading-relaxed">{a.desc}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600"
                    asChild
                  >
                    <a href="/get-started">Add to Plan</a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "overages",
      label: "Overages",
      content: (
        <div className="max-w-5xl mx-auto">
          <Card className="bg-zinc-950/95 border-zinc-800 backdrop-blur-sm shadow-2xl shadow-black/50">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white">Transparent Usage Rates</CardTitle>
              <p className="text-xl text-zinc-200 mt-3">
                Pay only for what you use above your plan limits. No throttling, ever.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {OVERAGES.map((o) => (
                  <div
                    key={o.k}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 flex flex-col justify-between hover:border-indigo-600/50 hover:bg-zinc-900/70 transition-all"
                  >
                    <div>
                      <div className="font-semibold text-xl text-white">{o.k}</div>
                      <div className="text-4xl font-bold text-emerald-400 mt-3 font-teko tracking-wide">{o.v}</div>
                    </div>
                    {o.unit && <div className="text-sm text-zinc-400 mt-4 pt-4 border-t border-zinc-800">{o.unit}</div>}
                  </div>
                ))}
              </div>

              <p className="mt-10 text-center text-lg text-zinc-300">
                You'll always see your projected bill in real-time on your dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ], []);

  return <PricingTabs initial="tiers" tabs={tabs} />;
}
