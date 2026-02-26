// src\app\onboarding\onboarding-client.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, LogIn, Sparkles, CheckCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { completeOnboarding } from './actions';
import { Label } from '@/components/ui/label';
import { MarketSelector } from '@/components/ui/market-selector';
import { searchCannMenusRetailers } from '@/server/actions/cannmenus';
import { WiringScreen } from '@/app/dashboard/settings/link/components/wiring-screen';
import { CompetitorOnboardingStep } from './components/competitor-onboarding-step';
import { MenuImportStep } from './components/menu-import-step';
import { AnimatePresence } from 'framer-motion';

// Safe fallback for older code paths
const checkOnboardingStatus = async () => ({ ready: false, percent: 0 });

type BrandResult = {
  id: string;
  name: string;
  market: string | null;
};

type Step = 'role' | 'market' | 'brand-search' | 'manual' | 'competitors' | 'review' | 'menu-import';

export default function OnboardingPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'brand' | 'dispensary' | 'customer' | 'skip' | null>(null);
  const [showWiring, setShowWiring] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BrandResult[]>([]);
  const [selectedCannMenusEntity, setSelectedCannMenusEntity] = useState<{ id: string, name: string } | null>(null);

  const [manualBrandName, setManualBrandName] = useState('');
  const [manualProductName, setManualProductName] = useState('');
  const [manualDispensaryName, setManualDispensaryName] = useState('');
  const [slug, setSlug] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [formState, formAction] = useActionState(completeOnboarding, { message: '', error: false });
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [marketState, setMarketState] = useState<string>('');
  const [selectedCompetitors, setSelectedCompetitors] = useState<any[]>([]);

  const searchParams = useSearchParams();

  // Pre-fill from URL params
  useEffect(() => {
    const roleParam = searchParams?.get('role');
    const brandIdParam = searchParams?.get('brandId');
    const brandNameParam = searchParams?.get('brandName');
    const dispensaryIdParam = searchParams?.get('dispensaryId');
    const dispensaryNameParam = searchParams?.get('dispensaryName');

    if (roleParam === 'brand' && brandIdParam && brandNameParam) {
      setRole('brand');
      setSelectedCannMenusEntity({ id: brandIdParam, name: brandNameParam });
      setStep('review');
      toast({ title: 'Welcome!', description: `Completing setup for ${brandNameParam}.` });
    } else if (roleParam === 'dispensary' && dispensaryNameParam) {
      setRole('dispensary');
      if (dispensaryIdParam) {
        setSelectedCannMenusEntity({ id: dispensaryIdParam, name: dispensaryNameParam });
      } else {
        setManualDispensaryName(dispensaryNameParam);
      }
      setStep('review');
      toast({ title: 'Welcome!', description: `Completing setup for ${dispensaryNameParam}.` });
    } else if (roleParam) {
      if (['brand', 'dispensary', 'customer'].includes(roleParam)) {
        setRole(roleParam as any);
        setStep('brand-search');
      }
    }
  }, [searchParams, toast]);

  // Redirect on success
  useEffect(() => {
    if (!formState.error && (formState.message.includes('Onboarding complete') || formState.message.includes('Welcome!'))) {
      if (role === 'skip') {
        window.location.assign('/dashboard');
      } else {
        setShowWiring(true);
      }
    }
  }, [formState, role]);

  useEffect(() => {
    if (formState.error) setIsSubmitting(false);
  }, [formState.error]);

  const toggleCompetitor = (comp: any) => {
    setSelectedCompetitors((prev) => {
      const exists = prev.find((c) => c.id === comp.id);
      if (exists) return prev.filter((c) => c.id !== comp.id);
      if (prev.length >= 5) {
        toast({ title: "Limit reached", description: "You can select up to 5 competitors." });
        return prev;
      }
      return [...prev, comp];
    });
  };

  async function searchCannMenus(term: string) {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchCannMenusRetailers(term);
      const typeFilter = role === 'brand' ? 'brand' : 'dispensary';
      const filtered = data.filter((r) => r.type === typeFilter);
      setResults(filtered.map((r) => ({ id: r.id, name: r.name, market: 'Global' })));
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectRole(r: typeof role) {
    setRole(r);
    if (r === 'brand' || r === 'dispensary') {
      setStep('market');
    } else if (r === 'skip') {
      window.location.assign('/');
    } else {
      setStep('review');
    }
  }

  async function handleEntitySelect(entity: { id: string, name: string }) {
    setSelectedCannMenusEntity(entity);

    if (role && marketState && entity.id) {
      try {
        const { preStartDataImport } = await import('./pre-start-import');
        const result = await preStartDataImport({
          role: role as 'brand' | 'dispensary',
          entityId: entity.id,
          entityName: entity.name,
          marketState,
        });

        if (result.success && result.jobIds.length > 0) {
          toast({
            title: 'Preparing your workspace...',
            description: `Importing ${role === 'brand' ? 'products and partners' : 'menu data'} in the background.`,
          });
        }
      } catch (err) {
        console.warn('Pre-start import failed:', err);
      }
    }

    setStep('competitors');
  }

  function handleGoToManual() {
    setSelectedCannMenusEntity(null);
    setStep('manual');
  }

  function handleManualContinue() {
    setStep('competitors');
  }

  // ------------------------------------------------
  // Render Steps (dark theme applied)
  // ------------------------------------------------

  const renderRoleSelection = () => (
    <section className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-blue">To start, tell us your role.</h2>
        <p className="text-zinc-300">We'll get your workspace ready in under a minute.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Button
          variant="outline"
          className="h-auto whitespace-normal text-left p-6 flex-col items-start gap-2 border-zinc-700 hover:border-indigo-600/70 bg-zinc-950/70 hover:bg-zinc-900/70 transition-all shadow-sm"
          onClick={() => handleSelectRole('brand')}
        >
          <h3 className="font-bold text-lg text-white">I'm a Brand</h3>
          <p className="text-sm text-zinc-400">For product makers, cultivators, and extraction teams.</p>
        </Button>

        <Button
          variant="outline"
          className="h-auto whitespace-normal text-left p-6 flex-col items-start gap-2 border-zinc-700 hover:border-indigo-600/70 bg-zinc-950/70 hover:bg-zinc-900/70 transition-all shadow-sm"
          onClick={() => handleSelectRole('dispensary')}
        >
          <h3 className="font-bold text-lg text-white">I'm a Dispensary</h3>
          <p className="text-sm text-zinc-400">For storefront retailers and cannabis delivery operators.</p>
        </Button>

        <Button
          variant="outline"
          className="h-auto whitespace-normal text-left p-6 flex-col items-start gap-2 border-zinc-700 hover:border-indigo-600/70 bg-zinc-950/70 hover:bg-zinc-900/70 transition-all shadow-sm sm:col-span-2"
          onClick={() => handleSelectRole('customer')}
        >
          <h3 className="font-bold text-lg text-white">I'm a Customer</h3>
          <p className="text-sm text-zinc-400">For shoppers comparing products, offers, and nearby stores.</p>
        </Button>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white"
          onClick={() => handleSelectRole('skip')}
        >
          Skip setup for now {'>'}
        </Button>
      </div>
    </section>
  );

  const renderMarketSelection = () => (
    <section className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Where do you operate?</h2>
        <p className="text-zinc-300">
          Select your primary market. We'll auto-import products and dispensaries for this location.
        </p>
      </div>

      <MarketSelector
        value={marketState}
        onChange={setMarketState}
        label="Primary Market"
        description="This helps us find relevant products, dispensaries, and competitors in your area."
        required
      />

      <div className="pt-6 flex justify-between items-center">
        <Button variant="ghost" className="text-zinc-300 hover:text-white" onClick={() => setStep('role')}>
          Back
        </Button>
        <Button
          onClick={() => {
            if (role === 'dispensary') {
              setStep('menu-import');
            } else {
              setStep('brand-search');
            }
          }}
          disabled={!marketState}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Continue
        </Button>
      </div>
    </section>
  );

  const renderSearchStep = () => (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Find your {role}</h2>
      <p className="text-zinc-300">
        Start typing your {role} name. We'll search the directory.
      </p>

      <div className="relative">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length > 1) searchCannMenus(e.target.value);
              }}
              className="pl-12 h-12 bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
              placeholder={role === 'brand' ? "e.g., Kiva, Wyld" : "e.g., Green Valley"}
              autoComplete="off"
              autoFocus
            />
          </div>
          {loading && <Button disabled variant="ghost"><Spinner size="sm" /></Button>}
        </div>

        {results.length > 0 && (
          <div className="absolute z-20 w-full bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl mt-2 max-h-72 overflow-y-auto backdrop-blur-sm">
            {results.map((b) => (
              <button
                key={b.id}
                className="w-full text-left px-5 py-4 hover:bg-zinc-900 text-base flex justify-between items-center border-b border-zinc-800 last:border-0 transition-colors text-white"
                onClick={() => handleEntitySelect({ id: b.id, name: b.name })}
              >
                <span className="font-medium">{b.name}</span>
                <span className="text-sm text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-full">
                  {b.id.substring(0, 8)}...
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 flex justify-between items-center">
        <Button variant="ghost" className="text-zinc-300 hover:text-white" onClick={() => setStep('role')}>
          Back
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={handleGoToManual}
          className="text-zinc-400 hover:text-white"
        >
          Can't find it? Add manually.
        </Button>
      </div>
    </section>
  );

  const renderManualStep = () => (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Add your details manually</h2>
      <p className="text-zinc-300">We'll create a new workspace for you.</p>

      {role === 'brand' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-200">Brand Name</Label>
            <Input
              name="manualBrandName"
              placeholder="e.g. Acme Cannabis"
              value={manualBrandName}
              onChange={(e) => setManualBrandName(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-200">Top Product (Optional)</Label>
            <Input
              name="manualProductName"
              placeholder="e.g. Blue Dream Pre-roll"
              value={manualProductName}
              onChange={(e) => setManualProductName(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>
      )}

      {role === 'dispensary' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-200">Dispensary Name</Label>
            <Input
              name="manualDispensaryName"
              placeholder="Your Dispensary Name"
              value={manualDispensaryName}
              onChange={(e) => setManualDispensaryName(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-between pt-6">
        <Button
          variant="ghost"
          className="text-zinc-300 hover:text-white"
          onClick={() => setStep('brand-search')}
        >
          Back
        </Button>
        <Button
          onClick={handleManualContinue}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Continue
        </Button>
      </div>
    </section>
  );

  const renderCompetitorsStep = () => (
    <CompetitorOnboardingStep
      role={role as 'brand' | 'dispensary'}
      marketState={marketState}
      selectedCompetitors={selectedCompetitors}
      onToggleCompetitor={toggleCompetitor}
      onBack={() => setStep(selectedCannMenusEntity ? 'brand-search' : 'manual')}
      onContinue={() => setStep('review')}
    />
  );

  const renderMenuImportStep = () => (
    <MenuImportStep
      onComplete={(data) => {
        setManualDispensaryName(data.importedName);
        setSlug(data.slug);
        setZipCode(data.zip);
        setStep('review');
      }}
      onSkip={() => setStep('brand-search')}
    />
  );

  const renderReviewStep = () => {
    const selectedName =
      role === 'brand' && manualBrandName ? manualBrandName :
      role === 'dispensary' && manualDispensaryName ? manualDispensaryName :
      selectedCannMenusEntity?.name || 'Default';

    const hasSelection = role === 'brand' || role === 'dispensary';

    return (
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Review & Finish</h2>
          <p className="text-zinc-300">You're almost there! Confirm your details.</p>
        </div>

        <div className="border border-zinc-800 rounded-2xl p-8 space-y-6 bg-zinc-950/90 backdrop-blur-sm">
          <div className="flex justify-between items-center py-3 border-b border-zinc-800">
            <span className="text-zinc-400">Role</span>
            <span className="font-semibold capitalize bg-indigo-950/70 text-indigo-300 px-4 py-1.5 rounded-full text-sm">
              {role}
            </span>
          </div>

          {hasSelection && (
            <div className="flex justify-between items-center py-3">
              <span className="text-zinc-400">{role === 'brand' ? 'Brand Name' : 'Dispensary'}</span>
              <span className="font-semibold text-white">{selectedName}</span>
            </div>
          )}
        </div>

        <form
          action={formAction}
          ref={formRef}
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            console.debug('[Onboarding] form submit');
            setIsSubmitting(true);
          }}
        >
          <input type="hidden" name="role" value={role || ''} />
          {role === 'brand' && <input type="hidden" name="brandId" value={selectedCannMenusEntity?.id || ''} />}
          {role === 'brand' && <input type="hidden" name="brandName" value={selectedCannMenusEntity?.name || ''} />}
          {role === 'dispensary' && <input type="hidden" name="locationId" value={selectedCannMenusEntity?.id || ''} />}
          <input type="hidden" name="manualBrandName" value={manualBrandName} />
          <input type="hidden" name="manualProductName" value={manualProductName} />
          <input type="hidden" name="manualDispensaryName" value={manualDispensaryName} />
          <input type="hidden" name="marketState" value={marketState} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="zipCode" value={zipCode} />
          <input type="hidden" name="selectedCompetitors" value={JSON.stringify(selectedCompetitors)} />

          <Button
            type="submit"
            disabled={!role || isSubmitting}
            className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-xl transition-all"
          >
            {isSubmitting ? 'Completing...' : 'Complete Setup'}
          </Button>
        </form>

        {formState.error && (
          <div className="p-4 bg-red-950/70 text-red-300 text-sm rounded-xl text-center border border-red-800/50">
            {formState.message}
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black p-6 relative">
      <AnimatePresence>
        {showWiring && (
          <WiringScreen
            dispensaryName={
              role === 'brand'
                ? manualBrandName || selectedCannMenusEntity?.name || 'Your Brand'
                : manualDispensaryName || selectedCannMenusEntity?.name || 'Your Dispensary'
            }
            role={role === 'brand' ? 'brand' : 'dispensary'}
            onComplete={() => {
              try {
                if (typeof document !== 'undefined') {
                  document.cookie = 'x-simulated-role=brand; Path=/; Max-Age=' + 60 * 60 * 24 * 7;
                }
              } catch (e) {
                // ignore
              }
              window.location.assign('/dashboard');
            }}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg space-y-10 bg-zinc-950/90 backdrop-blur-md p-10 rounded-3xl border border-zinc-800 shadow-2xl">
        {step === 'role' && (
          <div className="text-center pb-6">
            <div className="inline-block p-4 bg-indigo-950/70 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-indigo-400" />
            </div>
            <h1 suppressHydrationWarning className="text-4xl font-bold tracking-tight text-white">Welcome to Markitbot AI</h1>
            <p className="text-xl text-zinc-300 mt-4">We'll get your workspace ready in under a minute.</p>
          </div>
        )}

        {step === 'role' && renderRoleSelection()}
        {step === 'market' && renderMarketSelection()}
        {step === 'menu-import' && renderMenuImportStep()}
        {step === 'brand-search' && renderSearchStep()}
        {step === 'manual' && renderManualStep()}
        {step === 'competitors' && renderCompetitorsStep()}
        {step === 'review' && renderReviewStep()}
      </div>
    </main>
  );
}
