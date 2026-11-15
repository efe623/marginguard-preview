import { AlertTriangle, Download } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { scheduleDeletion } from "@/features/settings/actions";

export default function DeletionPage() {
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[{ label: "Settings", href: "/settings" }, { label: "Data and deletion" }]}
        title="Data and deletion"
        description="Export business data or begin a recoverable 30-day deletion window."
      />
      <SettingsNav active="deletion" />
      <div className="stack mt-6">
        <section className="panel" aria-labelledby="export-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="export-title">Export business data</h2>
              <p className="panel-sub">Prepare a structured archive of projects, approvals, payments, and files.</p>
            </div>
            <ButtonLink href="/api/export" variant="outline"><Download size={16} aria-hidden="true" /> Download export</ButtonLink>
          </div>
        </section>

        <section className="panel" aria-labelledby="delete-title">
          <div className="panel-head">
            <h2 className="panel-title" id="delete-title">Danger zone</h2>
          </div>
          <form action={scheduleDeletion} className="panel-body stack">
            <div className="notice notice-danger">
              <AlertTriangle size={18} aria-hidden="true" />
              <p>
                <strong>Delete UnitPulse data.</strong> Every session and shared client link is revoked immediately, so clients can no longer open approvals or the portal. You can restore the business for 30 days; after that the data is gone for good.
              </p>
            </div>
            <div className="form-actions">
              <Button className="button-danger" type="submit">Begin deletion</Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
