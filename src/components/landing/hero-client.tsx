'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentPlayground } from '@/components/landing/agent-playground';
import { LiveStats } from '@/components/landing/live-stats';
import { Search, ArrowRight, Store, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import BlueGlowBackground from '@/components/BlueGlowBackground';
import ParticleBackground from '@/components/ParticleBackground';




export function HeroClient() {
  const [userType, setUserType] = useState<'dispensary' | 'brand'>('dispensary');
  const [auditUrl, setAuditUrl] = useState('');
  const router = useRouter();

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditUrl) return;

    const isUrl = auditUrl.includes('.') || auditUrl.includes('http');

    if (isUrl) {
      router.push(`/free-audit?url=${encodeURIComponent(auditUrl)}`);
    } else {
      router.push(`/claim?q=${encodeURIComponent(auditUrl)}`);
    }
  };

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex flex-col justify-center bg-black text-white">
<BlueGlowBackground />
<ParticleBackground />

      {/* Premium Glow Background */}
      {/* <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 h-[700px] w-[700px] bg-blue-600/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-150px] right-[-100px] h-[600px] w-[600px] bg-purple-600/20 rounded-full blur-[160px]" />
      </div> */}

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-24 pb-16">

        <div className="mx-auto max-w-4xl text-center">

          {/* Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
              <button
                onClick={() => setUserType('dispensary')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  userType === 'dispensary'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Store className="w-4 h-4" />
                For Retailers
              </button>

              <button
                onClick={() => setUserType('brand')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  userType === 'brand'
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Building2 className="w-4 h-4" />
                For Brand Teams
              </button>
            </div>
          </div>

          {/* Animated Hero Text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={userType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Badge
                variant="outline"
                className="mb-4 bg-blue-600/10 text-blue-400 border-blue-600/30 px-4 py-1.5 text-sm uppercase tracking-wider"
              >
                {userType === 'dispensary'
                  ? 'Streamline Daily Retail Operations'
                  : 'Scale Brand Distribution Faster'}
              </Badge>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                {userType === 'dispensary' ? (
                  <>
                    Transform Your Menu Into A<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">
                      Revenue Machine
                    </span>
                  </>
                ) : (
                  <>
                    Activate An AI Team To<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400">
                      Run Your Brand Ops
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-6 text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                {userType === 'dispensary'
                  ? 'Launch a headless SEO menu, automate budtender recommendations, and protect your license with always-on policy checks.'
                  : 'Find new retail partners, generate compliant campaigns, and track competitor pricing with your own AI team.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Search Bar */}
          <div className="mt-12 mb-8 max-w-xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>

            <form
              onSubmit={handleAuditSubmit}
              className="relative flex items-center bg-white/5 backdrop-blur-2xl rounded-full p-2 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
            >
              <Search className="ml-4 w-5 h-5 text-white/40 shrink-0" />

              <input
                type="text"
                placeholder={
                  userType === 'dispensary'
                    ? "Search your location (e.g., 'Green Releaf Chicago')"
                    : "Search your brand (e.g., 'Wyld Edibles')"
                }
                className="w-full bg-transparent border-none focus:ring-0 text-base px-4 py-3 text-white placeholder:text-white/40"
                value={auditUrl}
                onChange={(e) => setAuditUrl(e.target.value)}
              />

              <Button
                size="lg"
                className="rounded-full px-8 shrink-0 bg-white text-black hover:bg-white/90 font-semibold transition-all"
              >
                {userType === 'dispensary' ? 'Claim Location' : 'Run Audit'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>

          {/* Playground */}
          <div className="mt-16 text-left relative z-10">
            <AgentPlayground />

            <div className="hidden lg:block absolute -right-20 top-0 animate-float-slow pointer-events-none">
              <AgentChip name="Ember" role="Budtender" color="bg-blue-600" />
            </div>

            <div className="hidden lg:block absolute -left-20 top-20 animate-float-slower pointer-events-none">
              <AgentChip name="Drip" role="Marketer" color="bg-purple-600" />
            </div>
          </div>

          <div className="mt-10">
            <LiveStats />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center p-1">
          <div className="w-1 h-3 bg-white/60 rounded-full"></div>
        </div>
      </div>
      

    </section>
  );
}

function AgentChip({
  name,
  role,
  color,
}: {
  name: string;
  role: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 pr-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-xl">
      <div
        className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-bold text-xs`}
      >
        {name[0]}
      </div>
      <div className="text-left">
        <div className="text-xs font-bold text-white leading-none">{name}</div>
        <div className="text-[10px] text-white/50 font-medium uppercase tracking-wider">
          {role}
        </div>
      </div>
    </div>
  );
}

