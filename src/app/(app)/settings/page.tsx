import {
  Building2,
  ChevronRight,
  FileText,
  KeyRound,
  LifeBuoy,
  Plug,
  Sparkles,
  Trash2,
  Users,
  type LucideIcon
} from "lucide-react";
import { SettingsTransitionLink } from "@/components/settings-transition-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getBusinessSettingsData } from "@/features/operations/queries";

type Item = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  state?: React.ReactNode;
};

export default async function SettingsPage() {
  const business = await getBusinessSettingsData();
  const aiEnabled = Boolean(business?.ai_enabled);

  const groups: { title: string; description: string; items: Item[] }[] = [
    {
      title: "Workspace",
      description: "How your business is set up and who works in it.",
      items: [
        {
          title: "Business profile",
          description: "Business type, currency, timezone, and default hourly rate.",
          icon: Building2,
          href: "/settings/business",
          state: business ? <span className="meta">{business.currency} · {business.timezone}</span> : undefined
        },
        {
          title: "Quote templates",
          description: "Reusable proposal introductions, terms, and validity periods.",
          icon: FileText,
          href: "/settings/quotes"
        },
        {
          title: "Members and permissions",
          description: "Invite staff, assign projects, and control financial access.",
          icon: Users,
          href: "/settings/members"
        }
      ]
    },
    {
      title: "Access and privacy",
      description: "Sign-in, connected services, and what leaves your workspace.",
      items: [
        {
          title: "Security and sessions",
          description: "MFA, recovery codes, trusted devices, and remote sign-out.",
          icon: KeyRound,
          href: "/settings/security"
        },
        {
          title: "Connections",
          description: "Connect Google sign-in and Stripe-hosted payment links.",
          icon: Plug,
          href: "/settings/connections"
        },
        {
          title: "AI and privacy",
          description: "Draft-only Gemini tools and external processing controls.",
          icon: Sparkles,
          href: "/settings/ai",
          state: business ? <Status tone={aiEnabled ? "success" : "neutral"}>{aiEnabled ? "On" : "Off"}</Status> : undefined
        },
        {
          title: "Support access",
          description: "Create a time-limited, audited support grant.",
          icon: LifeBuoy,
          href: "/settings/support"
        }
      ]
    },
    {
      title: "Data",
      description: "Export your records or close the workspace.",
      items: [
        {
          title: "Data and deletion",
          description: "Export data or begin the 30-day deletion window.",
          icon: Trash2,
          href: "/settings/deletion"
        }
      ]
    }
  ];

  return (
    <div className="page page-narrow">
      <PageHeader
        title="Settings"
        description="The rules, access, and services behind your workspace."
      />
      <div className="stack">
        {groups.map((group) => (
          <section key={group.title} className="panel" aria-labelledby={`settings-${group.title}`}>
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id={`settings-${group.title}`}>{group.title}</h2>
                <p className="panel-sub">{group.description}</p>
              </div>
            </div>
            <div className="rows">
              {group.items.map(({ title, description, icon: Icon, href, state }) => (
                <SettingsTransitionLink key={href} href={href} className="row">
                  <span className="row-lead"><Icon size={18} aria-hidden="true" /></span>
                  <div className="row-main">
                    <p className="row-title">{title}</p>
                    <p className="row-sub">{description}</p>
                  </div>
                  <div className="row-end">
                    {state}
                    <ChevronRight size={16} className="text-[var(--ink-3)]" aria-hidden="true" />
                  </div>
                </SettingsTransitionLink>
              ))}
            </div>
          </section>
        ))}
        <section className="panel" aria-labelledby="settings-appearance">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="settings-appearance">Appearance</h2>
              <p className="panel-sub">Saved on this device and applied before the page loads.</p>
            </div>
            <ThemeToggle />
          </div>
        </section>
      </div>
    </div>
  );
}
