import { ExternalLink, LockKeyhole } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function StripeSettingsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Owner-only integration"
        title="Stripe"
        description="Create Stripe-hosted payment links without MarginGuard handling card details."
      />
      <SettingsNav active="stripe" />
      <section className="card mt-7 grid grid-cols-[1fr_0.8fr]">
        <div className="p-9">
          <LockKeyhole size={28} />
          <h2 className="font-display mt-8 text-4xl font-semibold">Connect your own Stripe account.</h2>
          <p className="quiet mt-4 max-w-xl leading-7">
            MarginGuard creates one-use deposit and balance links. Stripe hosts checkout,
            processes payment, and sends a signed confirmation back.
          </p>
          <ButtonLink className="mt-8" href="/api/stripe/connect">
            <ExternalLink size={16} /> Connect Stripe
          </ButtonLink>
        </div>
        <div className="border-l border-[var(--line)] bg-[var(--paper-deep)] p-9">
          <p className="eyebrow">MarginGuard can</p>
          <ul className="mt-6 space-y-4 text-sm leading-6">
            <li>✓ Create hosted payment links</li>
            <li>✓ Read status for linked payments</li>
            <li>✓ Deactivate completed or replaced links</li>
          </ul>
          <p className="eyebrow mt-9">MarginGuard cannot</p>
          <ul className="mt-6 space-y-4 text-sm leading-6">
            <li>× Issue refunds or payouts</li>
            <li>× Change bank details</li>
            <li>× View card numbers</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
