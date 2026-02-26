// src/app/page.tsx
import "./globals.css";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedCard from "@/components/AnimatedCard";

import {
  Search,
  Terminal,
  Zap,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  BarChart3,
  Mail,
  MessageSquare,
} from "lucide-react";

import { HeroClient } from "@/components/landing/hero-client";
import { PricingClient } from "@/components/landing/pricing-client";
import Logo from "@/components/logo";
import dynamic from "next/dynamic";

import ParticlesWrapper from "@/components/landing/ParticlesWrapper";




// Navigation Links
const nav = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
];

function AuthButtons() {
  return (
    <div className="flex gap-3">
      <Button
        variant="ghost"
        asChild
        className="hidden sm:inline-flex rounded-xl text-white hover:bg-zinc-800/70"
        size="sm"
      >
        <a href="/signin">Login</a>
      </Button>
      <Button
        asChild
        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/50 border border-indigo-500/40"
        size="sm"
      >
        <a href="/get-started">Get Started</a>
      </Button>
    </div>
  );
}

const modules = [
  {
    icon: Zap,
    name: "Launch Core: Menu + Ember",
    blurb: "Turn your menu into a growth channel with search-optimized pages, real-time inventory, and an AI budtender.",
    bullets: [
      "SEO-optimized headless menu",
      "Embedded Ember assistant",
      "Real-time inventory updates",
      "Essential performance insights",
    ],
  },
  {
    icon: Mail,
    name: "Growth Suite: Drip Lifecycle",
    blurb: "Lifecycle email and SMS automations that stay timely, stay relevant, and pass checks before send.",
    bullets: [
      "Welcome and reactivation flows",
      "Audience-based playbooks",
      "Engagement measurement",
      "Sentinel pre-send checks",
    ],
  },
  {
    icon: BarChart3,
    name: "Insight Suite: Pulse Intelligence",
    blurb: "Convert raw data into action with dashboards, trend indicators, and practical forecasting.",
    bullets: [
      "Revenue visibility dashboards",
      "Retention trend analysis",
      "Demand forecasting",
      "Report-ready exports",
    ],
  },
  {
    icon: RefreshCw,
    name: "Intel Suite: Radar Market Watch",
    blurb: "Monitor competitor pricing and availability so your team can respond with smarter market moves.",
    bullets: [
      "Competitor menu monitoring",
      "Price-shift alerts",
      "Category-level comparisons",
      "Weekly intel brief",
    ],
  },
  {
    icon: Lock,
    name: "Guardrail Suite: Sentinel Pro",
    blurb: "Apply jurisdiction rules, maintain audit logs, and enforce policy checks across customer channels.",
    bullets: [
      "Jurisdiction-aware rule packs",
      "Audit trail with export",
      "Cross-channel policy checks",
      "Approval workflow controls",
    ],
  },
];

const proof = [
  {
    name: "Ultra Cannabis (Detroit)",
    result: "3× visibility, 50+ orders in 90 days, 85% automation",
  },
  {
    name: "Zaza Factory",
    result: "60% email open boost, 30% repeat purchase increase, 25% cost reduction",
  },
  {
    name: "40 Tons Brand",
    result: "Strategic partnership + social equity network expansion",
  },
];

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-600/30">
      {/* Global Particle Background */}
<div className="fixed inset-0 -z-10 pointer-events-none">
  <ParticlesWrapper />
</div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Logo height={36} />
            <Badge
              variant="outline"
              className="hidden sm:inline-flex border-indigo-600/70 text-white bg-indigo-950/80 font-medium"
            >
              Beta
            </Badge>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-base font-medium text-white">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="hover:text-indigo-300 transition-colors hover:underline underline-offset-4"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <AuthButtons />
        </div>
      </header>

      <HeroClient />

      {/* Product Section */}
    <section
  id="product"
  className="relative overflow-hidden py-28 min-h-screen"
>
  {/* Background Layer */}
  {/* <div className="absolute inset-0 w-full h-full">
    <ParticlesWrapper />

  </div> */}

  {/* Content Container */}
  <div className="relative z-10 mx-auto max-w-7xl px-6">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
          <div className="space-y-6 max-w-3xl">
            <Badge className="bg-indigo-950/80 border-indigo-600/70 text-white text-base font-medium">
              Composable Platform
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
              Start with Core.<br className="hidden md:block" /> Layer agents as you scale.
            </h2>
            <p className="text-xl text-white leading-relaxed">
              Start with immediate leverage: a fast searchable menu and an AI budtender.<br />
              Add automation, insights, guardrails, and intel when you are ready.
            </p>
          </div>
          <div className="flex gap-5 flex-wrap">
            <Button
              variant="outline"
              asChild
              className="h-12 px-8 text-white border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
            >
              <a href="#pricing">See Plans</a>
            </Button>
            <Button
              asChild
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50"
            >
              <a href="/get-started">Launch Core</a>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
           <AnimatedCard
  key={m.name}
  className="bg-zinc-950/95 border border-zinc-800 backdrop-blur-sm"
>


                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 rounded-2xl bg-indigo-950/80 text-white group-hover:bg-indigo-900/90 transition-colors">
                      <Icon size={26} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                      {m.name.split(":")[0]}
                    </CardTitle>
                  </div>
                  <p className="text-lg text-white leading-relaxed">
                    {m.blurb}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-base">
                    {m.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-white">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
             </AnimatedCard>

            );
          })}
        </div>
      </div>
      </section>

      {/* Proof Section */}
      {/* <section id="proof" className="bg-zinc-950 border-y border-zinc-900 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-20">
            <div className="space-y-6">
              <Badge className="bg-purple-950/80 border-purple-600/70 text-white">
                Case Studies
              </Badge>
              <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                Proof you can feel
              </h2>
              <p className="text-xl text-white max-w-3xl">
                Built for real outcomes: visibility, conversion, less manual work.
              </p>
            </div>
            <Button
              variant="outline"
              asChild
              className="h-12 px-8 text-white border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
            >
              <a href="/case-studies">See case studies</a>
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {proof.map((p) => (
              <Card
                key={p.name}
                className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900/80 transition-colors backdrop-blur-sm"
              >
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">{p.name}</CardTitle>
                  <p className="mt-5 text-lg text-white font-medium">
                    {p.result}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Compliance Section */}
      {/* <section id="compliance" className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div className="space-y-8">
            <Badge className="bg-red-950/80 border-red-600/70 text-white">
              Safety First
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Compliance is not a checkbox.<br />It’s infrastructure.
            </h2>
            <p className="text-xl text-white leading-relaxed">
              Sentinel is our compliance engine. It pre-checks on-site content and outbound messaging against jurisdiction-aware
              rules—then records what happened for auditability.
            </p>
            <div className="flex flex-wrap gap-4">
              {["Pre-flight checks", "Audit trails", "Jurisdiction rule packs", "Approvals & controls"].map((tag) => (
                <Badge
                  key={tag}
                  className="px-4 py-2 text-base bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Card className="bg-zinc-950 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <Lock className="w-6 h-6 text-indigo-400" />
                What Sentinel checks
              </CardTitle>
              <p className="text-lg text-white mt-2">
                Examples of guardrails blocking risks before they happen.
              </p>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              {[
                {
                  icon: Terminal,
                  title: "Web + Menus",
                  desc: "Age gating patterns, restricted claims, required disclaimers.",
                  color: "indigo",
                },
                {
                  icon: MessageSquare,
                  title: "Email + SMS",
                  desc: "Channel rules, consent language, prohibited phrasing.",
                  color: "emerald",
                },
                {
                  icon: FileSpreadsheet,
                  title: "Audit Trail",
                  desc: "Immutable log of checks, rules applied, and reasons.",
                  color: "emerald",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-5 group">
                  <div
                    className={`p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:border-${item.color}-600/70 transition-colors`}
                  >
                    <item.icon className="w-6 h-6 text-zinc-300 group-hover:text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-xl text-white">{item.title}</div>
                    <div className="text-base text-white mt-1.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section> */}

      {/* Pricing Section */}
      <section id="pricing" className="bg-zinc-950 border-y border-zinc-900 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-4xl mx-auto mb-20 space-y-6">
            <Badge className="bg-indigo-950/80 border-indigo-600/70 text-white text-base">
              Pricing That Scales
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
              Launch Plans
            </h2>
            <p className="text-xl text-white leading-relaxed">
              Straightforward plans with included usage. If you exceed limits, overages stay transparent and predictable.
            </p>
          </div>

          <PricingClient />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-16 bg-black">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Logo height={32} />
            <span className="text-zinc-400">© {year} markitbot AI</span>
          </div>
          <div className="flex gap-8 text-white">
            <a href="/privacy" className="hover:text-indigo-300 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-indigo-300 transition-colors">Terms</a>
            <a href="/status" className="hover:text-indigo-300 transition-colors">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


