import { Building2, CreditCard, FileText, KeyRound, LifeBuoy, Sparkles, Trash2, Users } from "lucide-react";
import { SettingsTransitionLink } from "@/components/settings-transition-link";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";

const settings = [
  ["Business profile", "Business type, currency, timezone, and default hourly rate.", Building2, "/settings/business"],
  ["Quote templates", "Reusable proposal introductions, terms, and validity periods.", FileText, "/settings/quotes"],
  ["AI and privacy", "Enable draft-only Gemini tools and control external processing.", Sparkles, "/settings/ai"],
  ["Members & permissions", "Invite staff, assign projects, and grant financial-send access.", Users, "/settings/members"],
  ["Security & sessions", "MFA, recovery codes, trusted devices, and remote sign-out.", KeyRound, "/settings/security"],
  ["Stripe", "Connect the owner’s Stripe account for hosted payment links.", CreditCard, "/settings/stripe"],
  ["Support access", "Create a time-limited, audited support grant.", LifeBuoy, "/settings/support"],
  ["Deletion", "Export data or begin the 30-day deletion window.", Trash2, "/settings/deletion"]
] as const;

export default function SettingsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Owner controls"
        title="Settings"
        description="Business, people, integrations, and security boundaries."
      />
      <section className="card mt-8">
        {settings.map(([title, description, Icon, href]) => (
          <SettingsTransitionLink key={title} href={href} className="group grid grid-cols-[48px_1fr_auto] items-center gap-5 border-b border-[var(--line)] p-7 last:border-0 hover:bg-[var(--paper-deep)]">
            <span className="grid size-12 place-items-center border border-[var(--line)]"><Icon size={21} /></span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="quiet mt-1 text-sm">{description}</p>
            </div>
            {title === "Stripe" ? <Status tone="warning">Not connected</Status> : <span aria-hidden>→</span>}
          </SettingsTransitionLink>
        ))}
      </section>
    </div>
  );
}
