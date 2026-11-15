import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/features/core/actions";

export default async function NewClientPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[{ label: "Clients", href: "/clients" }, { label: "New client" }]}
        title="Add a client"
        description="Only the name is required. You can fill in the rest later."
      />
      <div className="stack">
        {error ? <div className="notice notice-danger" role="alert"><AlertCircle size={16} aria-hidden /><p>{error}</p></div> : null}
        <form action={createClient} className="panel">
          <div className="panel-body stack">
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="client-name">Client or business name</label>
                <input id="client-name" className="input" name="name" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="client-email">Primary contact email</label>
                <input id="client-email" className="input" name="email" type="email" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="client-phone">Phone</label>
                <input id="client-phone" className="input" name="phone" type="tel" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="client-location">Location</label>
                <input id="client-location" className="input" name="location" placeholder="Dubai, UAE" />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="client-notes">Internal notes</label>
              <textarea id="client-notes" className="textarea" name="notes" />
              <p className="hint">Private to your team. Clients never see these.</p>
            </div>
            <div className="form-actions">
              <Button type="submit">Save client</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
