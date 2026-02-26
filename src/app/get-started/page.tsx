// src/app/get-started/page.tsx
'use client';

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// -----------------------------
// UI Components
// -----------------------------

import Logo from "@/components/logo";

function Button({
  children,
  className = "",
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-6 py-2";
  const variants = {
    default:
      "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-950/40",
    outline:
      "border border-zinc-700 bg-zinc-950/70 text-white hover:bg-zinc-900 hover:border-zinc-600",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-xl shadow-black/30 ${className}`}
    >
      {children}
    </div>
  );
}

import { PRICING_PLANS } from "@/lib/config/pricing";

export default function GetStartedPage() {
  const searchParams = useSearchParams();
  const preselected = searchParams?.get("plan");

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo height={36} />
          </div>
          <Link
            href="/login"
            className="text-base text-zinc-300 hover:text-white transition-colors"
          >
            Already using Markitbot? <span className="underline">Sign in</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Pick your launch plan
          </h1>
          <p className="mt-4 text-xl text-zinc-300">
            Choose the plan that matches your current stage. You can move up or down anytime.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto w-full">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`p-8 relative flex flex-col transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-indigo-950/40 ${
                plan.highlight || plan.badge ? "border-indigo-600/70 ring-1 ring-indigo-600/30" : ""
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-full whitespace-nowrap shadow-md">
                  {plan.badge}
                </span>
              )}

              <div className="text-2xl font-bold text-white mb-2">{plan.name}</div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-bold text-white font-teko tracking-wide">
                  {plan.priceDisplay}
                </span>
                {plan.period && <span className="text-xl text-zinc-400">{plan.period}</span>}
              </div>

              <p className="text-lg text-zinc-200 mt-4 mb-8 min-h-[60px]">{plan.desc}</p>

              <div className="mb-10 flex-1">
                <div className="text-sm font-semibold uppercase text-zinc-400 mb-4 tracking-wider">
                  What's included
                </div>
                <ul className="space-y-3 text-base">
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex gap-3 items-start">
                      <span className="mt-1 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/70 text-emerald-400">
                        ✓
                      </span>
                      <span className="text-zinc-100">{f}</span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-sm text-zinc-400 mt-3 pl-9 italic">
                      + {plan.features.length - 5} more features
                    </li>
                  )}
                </ul>
              </div>

              <Link href={`/onboarding?plan=${plan.id}`} className="w-full mt-auto">
                <Button
                  className="w-full h-12 text-base font-semibold"
                  variant={(plan.highlight || plan.badge) ? "default" : "outline"}
                >
                  {plan.pill || `Select ${plan.name}`}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        <p className="mt-12 text-sm text-zinc-400 text-center max-w-lg">
          By continuing, you accept our{" "}
          <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 underline">
            Terms of Service
          </Link>{" "}
          plus our{" "}
          <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">
            Privacy Policy
          </Link>.
        </p>
      </main>
    </div>
  );
}
