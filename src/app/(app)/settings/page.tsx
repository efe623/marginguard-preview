import {
  ArrowUpRight,
  Building2,
  FileText,
  KeyRound,
  LifeBuoy,
  Plug,
  Sparkles,
  Trash2,
  Users
} from "lucide-react";
import { SettingsTransitionLink } from "@/components/settings-transition-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageHeader } from "@/components/ui/page-header";

const settings = [
  ["Business profile", "Business type, currency, timezone, and default hourly rate.", Building2, "/settings/business"],
  ["Quote templates", "Reusable proposal introductions, terms, and validity periods.", FileText, "/settings/quotes"],
  ["AI and privacy", "Draft-only Gemini tools and external processing controls.", Sparkles, "/settings/ai"],
  ["Members & permissions", "Invite staff, assign projects, and control financial access.", Users, "/settings/members"],
  ["Security & sessions", "MFA, recovery codes, trusted devices, and remote sign-out.", KeyRound, "/settings/security"],
  ["Connections", "Connect Google sign-in and Stripe-hosted payment links.", Plug, "/settings/connections"],
  ["Support access", "Create a time-limited, audited support grant.", LifeBuoy, "/settings/support"],
  ["Deletion", "Export data or begin the 30-day deletion window.", Trash2, "/settings/deletion"]
] as const;

export default function SettingsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Owner controls"
        title="Settings"
        description="One place for the rules, access, and services behind your workspace."
      />
      <div className="settings-home mt-10">
        <aside className="settings-home-aside">
          <p className="eyebrow">Appearance</p>
          <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight">Choose your workspace light.</h2>
          <p className="quiet mt-3 text-sm leading-6">Saved on this device and applied before the page loads.</p>
          <ThemeToggle expanded />
        </aside>
        <section className="settings-directory" aria-label="Settings directory">
          <p className="settings-directory-label">Control / configure</p>
          {settings.map(([title, description, Icon, href]) => (
            <SettingsTransitionLink key={title} href={href} className="settings-directory-row group">
              <Icon size={19} strokeWidth={1.6} />
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
              <ArrowUpRight size={18} className="settings-directory-arrow" />
            </SettingsTransitionLink>
          ))}
        </section>
      </div>
    </div>
  );
}
