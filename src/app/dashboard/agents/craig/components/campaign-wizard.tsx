// src\app\dashboard\agents\craig\components\campaign-wizard.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createCampaign } from '@/server/actions/campaigns';

type WizardStep = 'goal' | 'audience' | 'content' | 'review';

export default function CampaignWizard() {
  const [step, setStep] = useState<WizardStep>('goal');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    audience: '',
    channel: 'email',
    content: '',
    subject: '',
  });

  const handleNext = () => {
    if (step === 'goal') setStep('audience');
    else if (step === 'audience') setStep('content');
    else if (step === 'content') setStep('review');
  };

  const handleBack = () => {
    if (step === 'audience') setStep('goal');
    else if (step === 'content') setStep('audience');
    else if (step === 'review') setStep('content');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await createCampaign({
        name: formData.name,
        goal: formData.goal,
        audience: formData.audience,
        channel: formData.channel,
        subject: formData.subject,
        content: formData.content,
      });

      toast({
        title: "Campaign Scheduled!",
        description: "Drip will handle the rest.",
      });

      router.push('/dashboard/agents/craig');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast({
        title: "Error",
        description: "Failed to schedule campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    setIsLoading(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setFormData((prev) => ({
      ...prev,
      subject: `Exclusive Offer for our ${formData.audience || 'loyal'} customers!`,
      content: `Hi there,\n\nWe noticed you haven't visited in a while. We miss you! Come back and enjoy 20% off your next purchase.\n\nBest,\nThe Team`,
    }));

    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col bg-black text-white p-4 md:p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-10 px-2 md:px-0">
        {['Goal', 'Audience', 'Content', 'Review'].map((s, i) => {
          const stepKey = s.toLowerCase() as WizardStep;
          const isActive = step === stepKey;
          const isCompleted =
            (step === 'audience' && i === 0) ||
            (step === 'content' && i <= 1) ||
            (step === 'review' && i <= 2);

          return (
            <div key={s} className="flex flex-col items-center gap-2">
              <div
                className={`
                  w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-medium border-2 transition-all
                  ${
                    isActive
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : isCompleted
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-zinc-700 text-zinc-500'
                  }
                `}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              <span
                className={`text-xs md:text-sm font-medium ${
                  isActive || isCompleted ? 'text-blue-400' : 'text-zinc-500'
                }`}
              >
                {s}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="flex-1 flex flex-col border-zinc-800 bg-zinc-950/90 backdrop-blur-sm shadow-2xl shadow-black/40">
        <CardHeader className="pb-4 border-b border-zinc-800">
          <CardTitle className="text-2xl md:text-3xl font-bold text-blue-400">
            {step === 'goal' && "What's the goal of this campaign?"}
            {step === 'audience' && "Who are we targeting?"}
            {step === 'content' && "Let's create the content"}
            {step === 'review' && "Review & Schedule"}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pt-6">
          {step === 'goal' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-zinc-200 text-base font-medium">
                  Campaign Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-blue-500/50 h-11 rounded-lg"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="goal" className="text-zinc-200 text-base font-medium">
                  Objective
                </Label>
                <Select
                  value={formData.goal}
                  onValueChange={(val) => setFormData({ ...formData, goal: val })}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-11 rounded-lg focus:ring-blue-500/50 focus:border-blue-500/50 data-[placeholder]:text-zinc-400">
  <SelectValue placeholder="Select a goal" />
</SelectTrigger>

<SelectContent className="bg-zinc-950 border-zinc-800 text-white">
  <SelectItem 
    value="sales" 
    className="focus:bg-zinc-900 focus:text-white data-[highlighted]:bg-zinc-900 data-[highlighted]:text-white"
  >
    Drive Sales
  </SelectItem>
  <SelectItem 
    value="awareness" 
    className="focus:bg-zinc-900 focus:text-white data-[highlighted]:bg-zinc-900 data-[highlighted]:text-white"
  >
    Brand Awareness
  </SelectItem>
  <SelectItem 
    value="loyalty" 
    className="focus:bg-zinc-900 focus:text-white data-[highlighted]:bg-zinc-900 data-[highlighted]:text-white"
  >
    Customer Loyalty
  </SelectItem>
  <SelectItem 
    value="event" 
    className="focus:bg-zinc-900 focus:text-white data-[highlighted]:bg-zinc-900 data-[highlighted]:text-white"
  >
    Event Promotion
  </SelectItem>
</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 'audience' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="audience" className="text-zinc-200 text-base font-medium">
                  Target Audience
                </Label>
                <Select
                  value={formData.audience}
                  onValueChange={(val) => setFormData({ ...formData, audience: val })}
                >
                  <SelectTrigger 
  className="
    bg-zinc-950 
    border-zinc-700 
    text-white 
    h-11 
    rounded-lg 
    focus:ring-2 
    focus:ring-blue-500/50 
    focus:border-blue-500/50 
    data-[placeholder]:text-zinc-400
  "
>
  <SelectValue placeholder="Select an audience segment" />
</SelectTrigger>

<SelectContent 
  className="
    bg-zinc-950 
    border-zinc-800 
    text-white 
    shadow-xl 
    backdrop-blur-sm
  "
>
  <SelectItem 
    value="all"
    className="
      focus:bg-zinc-900 
      focus:text-white 
      data-[highlighted]:bg-zinc-900 
      data-[highlighted]:text-white 
      data-[state=checked]:bg-blue-950/40 
      data-[state=checked]:text-blue-300
    "
  >
    All Customers
  </SelectItem>

  <SelectItem 
    value="loyal"
    className="
      focus:bg-zinc-900 
      focus:text-white 
      data-[highlighted]:bg-zinc-900 
      data-[highlighted]:text-white 
      data-[state=checked]:bg-blue-950/40 
      data-[state=checked]:text-blue-300
    "
  >
    Loyal Customers (3+ orders)
  </SelectItem>

  <SelectItem 
    value="churned"
    className="
      focus:bg-zinc-900 
      focus:text-white 
      data-[highlighted]:bg-zinc-900 
      data-[highlighted]:text-white 
      data-[state=checked]:bg-blue-950/40 
      data-[state=checked]:text-blue-300
    "
  >
    At Risk (No order in 30 days)
  </SelectItem>

  <SelectItem 
    value="new"
    className="
      focus:bg-zinc-900 
      focus:text-white 
      data-[highlighted]:bg-zinc-900 
      data-[highlighted]:text-white 
      data-[state=checked]:bg-blue-950/40 
      data-[state=checked]:text-blue-300
    "
  >
    New Signups
  </SelectItem>
</SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="channel" className="text-zinc-200 text-base font-medium">
                  Channel
                </Label>
                <Select
                  value={formData.channel}
                  onValueChange={(val) => setFormData({ ...formData, channel: val })}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-11 rounded-lg">
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 'content' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateContent}
                  disabled={isLoading}
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:text-white hover:border-blue-600/50 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4 text-blue-400" />
                  )}
                  Generate with Drip
                </Button>
              </div>

              <div className="space-y-3">
                <Label htmlFor="subject" className="text-zinc-200 text-base font-medium">
                  Subject Line
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter email subject"
                  className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-blue-500/50 h-11 rounded-lg"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="content" className="text-zinc-200 text-base font-medium">
                  Email Body
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your email content here..."
                  className="min-h-[220px] bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-blue-500/50 rounded-lg"
                />
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-zinc-400">Campaign Name</p>
                  <p className="text-base font-medium text-white">{formData.name || '—'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-zinc-400">Goal</p>
                  <p className="text-base font-medium text-white capitalize">{formData.goal || '—'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-zinc-400">Audience</p>
                  <p className="text-base font-medium text-white capitalize">{formData.audience || '—'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-zinc-400">Channel</p>
                  <p className="text-base font-medium text-white capitalize">{formData.channel || '—'}</p>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950/70 backdrop-blur-sm">
                <p className="text-lg font-semibold text-blue-400 mb-4">Preview:</p>
                <p className="text-sm font-medium text-zinc-200 mb-3">
                  Subject: <span className="text-white">{formData.subject || 'No subject yet'}</span>
                </p>
                <div className="text-sm whitespace-pre-wrap bg-zinc-950 p-5 rounded-lg border border-zinc-800 text-zinc-100 leading-relaxed font-mono">
                  {formData.content || 'Content preview will appear here after generation.'}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-zinc-800 p-6 bg-zinc-950/80 rounded-b-xl">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 'goal' || isLoading}
            className="border-zinc-700 text-zinc-200 hover:bg-zinc-900 hover:text-white hover:border-blue-600/50 transition-all min-w-[100px]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {step === 'review' ? (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-xl transition-all min-w-[180px]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Campaign
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg transition-all min-w-[120px]"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
