"use client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PricingCard } from "../components/pricing-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ShieldCheck, Zap, HelpCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const UpgradeView = () => {
  const trpc = useTRPC();

  const { data: products } = useSuspenseQuery(
    trpc.premium.getProduct.queryOptions(),
  );
  const { data: currentSubscription } = useSuspenseQuery(
    trpc.premium.getCurrentSubscription.queryOptions(),
  );

  const isPremium = !!currentSubscription;
  const polarProProduct = products?.[0];

  const handleProUpgrade = () => {
    if (polarProProduct) {
      if (currentSubscription?.id === polarProProduct.id || isPremium) {
        authClient.customer.portal();
      } else {
        authClient.checkout({ products: [polarProProduct.id] });
      }
    } else {
      toast.info("Polar billing is connected. Create recurring subscription products in your Polar dashboard to activate direct checkout.");
    }
  };

  const proPrice = polarProProduct?.prices?.[0];
  const formattedProPrice = proPrice && proPrice.amountType === "fixed"
    ? proPrice.priceAmount / 100
    : 19;
  const proInterval = proPrice && "recurringInterval" in proPrice
    ? `/${proPrice.recurringInterval}`
    : "/month";

  return (
    <div className="flex-1 py-8 px-4 md:py-12 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-y-16">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 gap-1.5 border-primary/30 text-primary bg-primary/5">
            <Sparkles className="h-3.5 w-3.5" />
            Simple & Transparent Pricing
          </Badge>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          Unlock the Full Potential of <span className="text-primary">Meet AI</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Supercharge your workflow with intelligent real-time meeting agents, automated summaries, and cloud recordings.
        </p>

        {/* Current Plan Indicator */}
        <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 border text-sm font-medium">
          <span className="text-muted-foreground">Current Plan:</span>
          <span className="font-semibold text-primary">
            {currentSubscription?.name ?? "Free Tier"}
          </span>
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Free Plan */}
        <PricingCard
          variant="default"
          title="Starter / Free"
          badge="Free Forever"
          price={0}
          priceSuffix="/month"
          description="Essential features to experience AI-powered meetings."
          buttonText={!isPremium ? "Current Plan" : "Downgrade to Free"}
          disabled={!isPremium}
          onClick={() => {
            if (isPremium) authClient.customer.portal();
          }}
          features={[
            "Up to 10 AI Agents",
            "Up to 10 Recorded Meetings",
            "Real-time video & audio calls",
            "Automated meeting transcription",
            "Standard transcript summarization",
            "Community & email support",
          ]}
        />

        {/* Pro Plan */}
        <PricingCard
          variant="highlighted"
          title={polarProProduct?.name ?? "Pro Plan"}
          badge="Most Popular"
          price={formattedProPrice}
          priceSuffix={proInterval}
          description={polarProProduct?.description ?? "For professionals and teams who need unlimited meeting power."}
          buttonText={
            currentSubscription?.id === polarProProduct?.id
              ? "Manage Subscription"
              : isPremium
              ? "Change Plan"
              : "Upgrade to Pro"
          }
          onClick={handleProUpgrade}
          features={
            polarProProduct?.benefits && polarProProduct.benefits.length > 0
              ? polarProProduct.benefits.map((b) => b.description)
              : [
                  "Unlimited AI Agents",
                  "Unlimited Meetings & Call Time",
                  "Advanced AI Meeting Summaries & Action Items",
                  "Interactive Post-Meeting Agent Chat",
                  "Full HD Cloud Recording & Transcripts",
                  "Priority AI Processing & Zero Queue Time",
                  "Dedicated 24/7 Priority Support",
                ]
          }
        />

        {/* Enterprise Plan */}
        <PricingCard
          variant="default"
          title="Enterprise"
          badge="Custom"
          price={99}
          priceSuffix="/month"
          description="Customized agent intelligence for growing organizations."
          buttonText="Contact Sales"
          onClick={() => {
            window.location.href = "mailto:support@meetai.com?subject=Meet%20AI%20Enterprise%20Inquiry";
          }}
          features={[
            "Everything included in Pro",
            "Custom Agent System Prompts & Personalities",
            "Multi-Agent Meeting Collaboration",
            "Bring Your Own LLM Keys (OpenAI, Groq, Gemini)",
            "Enterprise Single Sign-On (SSO)",
            "Custom Data Retention & Compliance",
            "99.9% Dedicated Uptime SLA",
          ]}
        />
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-secondary/40 border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold">Secure Payments</h4>
            <p className="text-xs text-muted-foreground">Processed securely via Polar & Stripe.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold">Instant Activation</h4>
            <p className="text-xs text-muted-foreground">Your account limits unlock the second you upgrade.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold">Cancel Anytime</h4>
            <p className="text-xs text-muted-foreground">No lock-in contracts. Manage billing with 1-click.</p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="flex flex-col gap-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground mt-1">Got questions? We have answers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                Can I cancel or change my plan anytime?
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time directly through the customer billing portal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                What happens when I reach the Free limits?
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                On the Free tier, you can create up to 10 agents and hold up to 10 meetings. Upgrading to Pro gives you unlimited access to both.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                How do AI agents participate in meetings?
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Agents connect automatically via Stream Video WebRTC. They listen to the discussion, take notes, and can respond to questions based on their instructions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                Which AI models power the agents and summaries?
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We use cutting-edge LLMs including OpenAI GPT-4o, with high-availability fallback support across Groq (Llama 3) and Google Gemini.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const UpgradeViewLoading = () => {
  return (
    <LoadingState title="Loading" description="This may take a few seconds" />
  );
};

export const UpgradeViewError = () => {
  return <ErrorState title="Error" description="Please try again later" />;
};
