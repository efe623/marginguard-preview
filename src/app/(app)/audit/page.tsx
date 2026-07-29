import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";

export default function AuditPage() {
  const events = [
    ["29 Jul · 10:29", "Client approval recorded", "E-commerce Redesign · CO-004", ShieldCheck, "Project"],
    ["29 Jul · 08:10", "Financial-send permission granted", "Sam Morgan · by Alex Morgan", KeyRound, "Security"],
    ["28 Jul · 17:44", "Staff invitation accepted", "Sam Morgan · assigned to 1 project", UserPlus, "Membership"]
  ] as const;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Owner view"
        title="Audit trail"
        description="Business-wide security, membership, approval, and payment events."
      />
      <section className="card mt-8">
        {events.map(([time, title, detail, Icon, category]) => (
          <article key={title} className="grid grid-cols-[160px_44px_1fr_140px] items-center gap-5 border-b border-[var(--line)] p-6 last:border-0">
            <time className="eyebrow">{time}</time>
            <span className="grid size-11 place-items-center border border-[var(--line)]"><Icon size={19} /></span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="quiet mt-1 text-sm">{detail}</p>
            </div>
            <Status>{category}</Status>
          </article>
        ))}
      </section>
    </div>
  );
}
