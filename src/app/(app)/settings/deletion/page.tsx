import { Download, Trash2 } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { scheduleDeletion } from "@/features/settings/actions";

export default function DeletionPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Owner-only"
        title="Data and deletion"
        description="Export business data or begin a recoverable 30-day deletion window."
      />
      <SettingsNav active="deletion" />
      <div className="mt-7 grid grid-cols-2 gap-6">
        <section className="card p-8">
          <Download size={24} />
          <h2 className="section-title mt-7">Export business data</h2>
          <p className="quiet mt-3 leading-7">Prepare a structured archive of projects, approvals, payments, and files.</p>
          <ButtonLink className="mt-7" href="/api/export" variant="outline">Download export</ButtonLink>
        </section>
        <section className="border border-[var(--danger)] bg-[#fff5f3] p-8">
          <Trash2 className="text-[var(--danger)]" size={24} />
          <h2 className="section-title mt-7 text-[var(--danger)]">Delete UnitPulse data</h2>
          <p className="mt-3 leading-7 text-[#701515]">Sessions and links are revoked immediately. The owner can restore the business for 30 days.</p>
          <form action={scheduleDeletion}><Button className="mt-7 bg-[var(--danger)]" type="submit">Begin deletion</Button></form>
        </section>
      </div>
    </div>
  );
}
