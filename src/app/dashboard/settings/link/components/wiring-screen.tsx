// src/app/dashboard/settings/link/components/wiring-screen.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

import {
  Search,
  ArrowRight,
  Leaf,
  Zap,
  Globe,
  CheckCircle2,
  Loader2,
  Server,
  Cpu,
  Lock,
  RefreshCw,
  MousePointer2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WiringScreenProps {
  dispensaryName: string;
  role?: 'brand' | 'dispensary' | 'customer';
  onComplete: () => void;
  checkStatus?: () => Promise<{ ready: boolean; percent: number; details?: { products: number; competitors: number } }>;
}

type WiringPhase = 'init' | 'smokey_crawl' | 'ezal_crawl' | 'building' | 'complete';

const DISPENSARY_LOGS = [
  "Initializing secure environment...",
  "🔍 Checking POS system integration...",
  "📡 Connecting to CannMenus API...",
  "Searching inventory sources...",
  "✅ Found products in catalog.",
  "Mapping categories to standard taxonomy...",
  "Syncing product images...",
  "Inventory sync complete.",
  "🧠 Starting Markitbot Discovery agent...",
  "Scanning competitor radius: 5 miles",
  "🔎 Checking Leafly for market data...",
  "🌐 Running website discovery fallback...",
  "Identified nearby competitors.",
  "Extracting pricing data...",
  "Analyzing gap opportunities...",
  "Competitor intelligence index built.",
  "Generating headless storefront...",
  "Compiling Next.js routes...",
  "Optimizing assets...",
  "Deploying to edge...",
  "✨ Wiring complete!",
];

const BRAND_LOGS = [
  "Initializing brand workspace...",
  "🔍 Checking POS integration...",
  "📡 Connecting to CannMenus catalog...",
  "Verifying GTIN/UPC codes...",
  "Indexing product metadata...",
  "✅ Found active SKUs.",
  "Syncing high-res assets from cloud...",
  "Optimizing images for web...",
  "Catalog import complete.",
  "🧠 Starting Market Scanner agent...",
  "🔎 Checking Leafly for retailer data...",
  "🌐 Running website discovery fallback...",
  "Scanning retailers for brand presence...",
  "Found retailer matches.",
  "Analyzing shelf placement...",
  "Calculating share of voice...",
  "Market intelligence index built.",
  "Generating brand portal...",
  "Configuring wholesale dashboard...",
  "Deploying analytics suite...",
  "✨ Wiring complete!",
];

export function WiringScreen({ dispensaryName, role = 'dispensary', onComplete, checkStatus }: WiringScreenProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<WiringPhase>('init');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState({ products: 0, competitors: 0 });

  // Auto-advance phases (visual fallback when no polling)
  useEffect(() => {
    if (checkStatus) return;

    const t1 = setTimeout(() => setPhase('smokey_crawl'), 2000);
    const t2 = setTimeout(() => setPhase('ezal_crawl'), 8000);
    const t3 = setTimeout(() => setPhase('building'), 15000);
    const t4 = setTimeout(() => setPhase('complete'), 22000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [checkStatus]);

  // Polling logic (real backend status)
  useEffect(() => {
    if (!checkStatus) return;

    const interval = setInterval(async () => {
      try {
        const status = await checkStatus();

        // Map percent to phases
        if (status.percent < 20) setPhase('init');
        else if (status.percent < 50) setPhase('smokey_crawl');
        else if (status.percent < 80) setPhase('ezal_crawl');
        else if (status.percent < 100) setPhase('building');
        else {
          setPhase('complete');
          setIsReady(true);
          clearInterval(interval);
        }

        if (status.details) {
          setStats(status.details);
        }

        setProgress((p) => Math.max(p, status.percent));
      } catch (e) {
        console.error("Wiring status check failed", e);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [checkStatus]);

  // Smooth visual progress bar
  useEffect(() => {
    if (checkStatus && isReady) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (!checkStatus) clearInterval(interval);
          return 100;
        }
        const increment = Math.random() * (phase === 'complete' ? 15 : 0.6);
        const limit = checkStatus ? 95 : 100;
        return Math.min(limit, p + increment);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, checkStatus, isReady]);

  // Log animation
  useEffect(() => {
    let lineIndex = 0;
    const targetLogs = role === 'brand' ? BRAND_LOGS : DISPENSARY_LOGS;

    const interval = setInterval(() => {
      if (lineIndex < targetLogs.length) {
        setLogs((prev) => {
          const newLogs = [...prev, targetLogs[lineIndex]];
          if (newLogs.length > 8) newLogs.shift();
          return newLogs;
        });
        lineIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1400); // Slightly slower for better readability

    return () => clearInterval(interval);
  }, [role]);

  const getPhaseLabel = () => {
    switch (phase) {
      case 'init': return "Initializing Agent Swarm...";
      case 'smokey_crawl': return "Ember: Syncing Menu & Inventory...";
      case 'ezal_crawl': return "Radar: Crawling Competitor Data...";
      case 'building': return "Builder: Generating Headless Site...";
      case 'complete': return "Setup Complete!";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col relative backdrop-blur-md"
      >
        {/* Browser Toolbar */}
        <div className="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-5 space-x-3 shrink-0">
          <div className="flex space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
            <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 ml-6 flex justify-center">
            <div className="bg-zinc-800/70 rounded-lg px-4 py-1.5 text-xs text-zinc-400 font-mono w-3/4 flex items-center justify-between">
              <span className="truncate">
                {phase === 'init' && "system://initializing..."}
                {phase === 'smokey_crawl' && `https://cannmenus.com/menus/${dispensaryName.toLowerCase().replace(/\s/g, '-')}`}
                {phase === 'ezal_crawl' && "https://markitbot.com/discovery?radius=5mi"}
                {phase === 'building' && "localhost:3000/deploying..."}
                {phase === 'complete' && "Markitbot Dashboard"}
              </span>
              {phase !== 'complete' && <RefreshCw className="h-4 w-4 animate-spin ml-3 text-zinc-500" />}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative bg-zinc-950 overflow-hidden">
          <AnimatePresence mode="wait">
            {phase === 'init' && <InitView key="init" />}
            {phase === 'smokey_crawl' && <SmokeyView key="smokey" dispensaryName={dispensaryName} />}
            {phase === 'ezal_crawl' && <EzalView key="ezal" />}
            {phase === 'building' && <BuilderView key="building" />}
            {phase === 'complete' && (
              <CompleteView
                key="complete"
                onEnter={() => {
                  if (role === 'customer') {
                    router.push('/account');
                  } else {
                    router.push('/dashboard');
                  }
                }}
              />
            )}
          </AnimatePresence>

          {/* Agent Cursors Layer */}
          <AgentCursors phase={phase} />

          {/* Real-time Stats Overlay */}
          <div className="absolute top-5 left-5 flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
              {stats.products > 0 && (
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-emerald-900/80 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-md flex items-center gap-2 text-sm font-mono border border-emerald-700/50"
                >
                  <Leaf className="h-4 w-4 text-emerald-400" />
                  <span>Products Indexed: <span className="font-bold">{stats.products}</span></span>
                </motion.div>
              )}
              {stats.competitors > 0 && (
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-purple-900/80 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-md flex items-center gap-2 text-sm font-mono border border-purple-700/50"
                >
                  <Zap className="h-4 w-4 text-purple-400" />
                  <span>Competitors Found: <span className="font-bold">{stats.competitors}</span></span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Terminal Logs (Bottom) */}
        <div className="h-40 bg-zinc-950 border-t border-zinc-800 p-5 font-mono text-sm overflow-hidden shrink-0">
          <div className="flex items-center gap-3 mb-3 text-zinc-400 border-b border-zinc-800 pb-2">
            <Server className="h-4 w-4" />
            <span className="font-semibold">Agent Logs</span>
          </div>
          <div className="space-y-1.5">
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-400/90"
              >
                <span className="text-zinc-600 mr-3">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Status Text + Progress */}
      <div className="mt-10 text-center space-y-4">
        <h2 className="text-2xl font-bold text-blue-400 animate-pulse">{getPhaseLabel()}</h2>
        <div className="w-80 h-2 bg-zinc-800 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-blue-600"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// SUB-VIEWS (dark theme applied)
// ────────────────────────────────────────────────

function InitView() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-6">
        <Cpu className="h-20 w-20 text-blue-500 animate-pulse" />
        <h3 className="text-xl font-mono text-blue-400">System Core Active</h3>
      </div>
    </div>
  );
}

function SmokeyView({ dispensaryName }: { dispensaryName: string }) {
  return (
    <div className="h-full w-full bg-zinc-950 p-10 relative">
      <div className="w-full h-10 bg-zinc-900 rounded-xl mb-8" />
      <div className="flex gap-8">
        <div className="w-1/4 space-y-6">
          <div className="h-48 bg-zinc-900 rounded-xl" />
          <div className="h-24 bg-zinc-900 rounded-xl" />
        </div>
        <div className="flex-1 space-y-6">
          <div className="h-14 bg-zinc-900 rounded-xl w-3/4" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="aspect-[3/4] bg-emerald-950/50 border border-emerald-900/50 rounded-xl p-3 flex flex-col gap-3"
              >
                <div className="w-full aspect-square bg-emerald-900/40 rounded-lg" />
                <div className="h-4 bg-emerald-900/40 rounded w-full" />
                <div className="h-4 bg-emerald-900/40 rounded w-2/3" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay Label */}
      <div className="absolute top-6 right-6 bg-emerald-900/90 text-emerald-300 px-4 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur-md border border-emerald-800/50">
        Importing Inventory...
      </div>
    </div>
  );
}

function EzalView() {
  return (
    <div className="h-full w-full bg-zinc-950 p-10 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(126,34,206,0.08),transparent_60%)]" />

      <div className="grid grid-cols-2 gap-10 h-full">
        <div className="border border-zinc-800 rounded-2xl bg-zinc-950/80 p-6 space-y-4 opacity-70">
          <div className="h-5 bg-zinc-800 w-1/3 rounded" />
          <div className="space-y-3">
            <div className="h-10 bg-zinc-900 rounded-xl" />
            <div className="h-10 bg-zinc-900 rounded-xl" />
            <div className="h-10 bg-zinc-900 rounded-xl" />
          </div>
        </div>

        <div className="border-2 border-purple-600 rounded-2xl bg-zinc-950/90 p-6 space-y-4 scale-105 z-10 shadow-2xl shadow-purple-950/40">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-zinc-800 w-1/3 rounded" />
            <div className="px-3 py-1 bg-red-950/70 text-red-400 rounded-full text-xs font-bold border border-red-800/50">
              -18% Gap
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.25 }}
                className="flex justify-between p-3 bg-purple-950/40 rounded-xl border border-purple-900/50"
              >
                <span className="text-sm text-purple-200">Competitor Product {i}</span>
                <span className="text-sm font-bold text-purple-300">$48.00</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-purple-900/90 text-white px-6 py-3 rounded-full shadow-xl backdrop-blur-md border border-purple-700/50">
        <Zap className="h-5 w-5 text-purple-400 animate-pulse" />
        <span className="text-base font-bold">Markitbot Discovery Active</span>
      </div>
    </div>
  );
}

function BuilderView() {
  return (
    <div className="h-full w-full bg-zinc-950 p-10 font-mono text-sm relative overflow-hidden">
      <div className="space-y-2 text-blue-400">
        <p>&gt; git clone markitbot-headless-starter</p>
        <p>&gt; npm install</p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          &gt; building components/Hero.tsx...
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          &gt; building components/MenuGrid.tsx...
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
          &gt; optimizing images...
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
          className="text-emerald-400"
        >
          &gt; build success (520ms)
        </motion.p>
      </div>

      {/* Visual Assembler */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 border-l border-zinc-800 bg-zinc-950 p-6">
        <div className="w-full h-full bg-zinc-900 rounded-2xl border border-zinc-800 relative overflow-hidden">
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute top-0 left-0 right-0 h-20 bg-zinc-800 border-b border-zinc-700"
          />
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute top-24 left-6 right-6 bottom-6 grid grid-cols-2 gap-4"
          >
            <div className="bg-zinc-800 rounded-xl" />
            <div className="bg-zinc-800 rounded-xl" />
            <div className="bg-zinc-800 rounded-xl" />
            <div className="bg-zinc-800 rounded-xl" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CompleteView({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950 space-y-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="h-32 w-32 bg-emerald-950/70 rounded-full flex items-center justify-center border border-emerald-800/50 shadow-2xl"
      >
        <CheckCircle2 className="h-20 w-20 text-emerald-500" />
      </motion.div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-blue-400">Setup Complete!</h2>
        <p className="text-xl text-zinc-300">Your agents are online and synced.</p>
      </div>

      <Button
        size="lg"
        onClick={onEnter}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg px-10 py-6 shadow-lg shadow-indigo-950/40"
      >
        Enter Dashboard <ArrowRight className="ml-3 h-5 w-5" />
      </Button>
    </div>
  );
}

// ────────────────────────────────────────────────
// AGENT CURSORS (updated for dark theme)
// ────────────────────────────────────────────────

function AgentCursors({ phase }: { phase: WiringPhase }) {
  if (phase === 'init' || phase === 'complete') return null;

  return (
    <>
      <AnimatePresence>
        {phase === 'smokey_crawl' && (
          <motion.div
            initial={{ x: 80, y: 80, opacity: 0 }}
            animate={{
              x: [80, 300, 550, 200, 450],
              y: [80, 150, 400, 300, 220],
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
            className="absolute z-30 pointer-events-none"
          >
            <MousePointer2 className="h-8 w-8 text-emerald-500 fill-emerald-500/30" />
            <div className="bg-emerald-900/90 text-emerald-200 text-xs px-2 py-1 rounded ml-5 -mt-3 font-bold shadow-md backdrop-blur-sm border border-emerald-700/50">
              Ember
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'ezal_crawl' && (
          <motion.div
            initial={{ x: 800, y: 400, opacity: 0 }}
            animate={{
              x: [800, 650, 400, 700],
              y: [400, 200, 500, 280],
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            className="absolute z-30 pointer-events-none"
          >
            <MousePointer2 className="h-8 w-8 text-purple-500 fill-purple-500/30" />
            <div className="bg-purple-900/90 text-purple-200 text-xs px-2 py-1 rounded ml-5 -mt-3 font-bold shadow-md backdrop-blur-sm border border-purple-700/50">
              Radar
            </div>
            <div className="absolute top-8 left-8 bg-yellow-900/80 text-yellow-200 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap border border-yellow-700/50">
              Scanning...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
