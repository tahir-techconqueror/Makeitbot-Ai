// src/app/onboarding/page.tsx

export const dynamic = 'force-dynamic';

import OnboardingClient from './onboarding-client';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-muted/20">
      <OnboardingClient />
    </div>
  );
}
