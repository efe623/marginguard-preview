import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { clients as fixtureClients } from "@/data/fixtures";
import { createProject } from "@/features/core/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function NewProjectPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; clientId?: string }>;
}) {
  const { error, clientId: presetClient } = await searchParams;
  let availableClients = fixtureClients.map((client) => ({ id: client.id, name: client.name }));
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .is("deleted_at", null)
      .order("name");
    availableClients = data ?? [];
  }
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[{ label: "Projects", href: "/projects" }, { label: "New project" }]}
        title="Start with the agreement"
        description="Record the client and commercial terms now. You will define the deliverables, exclusions, and revision limit next (step 1 of 2)."
      />

      <div className="stack">
        {error ? (
          <p className="notice notice-danger" role="alert">
            <TriangleAlert size={16} aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}
        <form action={createProject} className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Client and commercial terms</h2>
              <p className="panel-sub">These terms become the baseline for every change order.</p>
            </div>
          </div>
          <div className="panel-body stack">
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="name">Project name</label>
                <input id="name" className="input" name="name" placeholder="E-commerce redesign" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="clientId">Client</label>
                <select id="clientId" className="select" name="clientId" required defaultValue={availableClients.some((client) => client.id === presetClient) ? presetClient : ""}>
                  <option value="" disabled>Select a client</option>
                  {availableClients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="currency">Currency</label>
                <select id="currency" className="select" name="currency" defaultValue="AED">
                  <option>AED</option>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>SAR</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="quote">Original quote</label>
                <input id="quote" className="input num" inputMode="decimal" name="quote" placeholder="85,000.00" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="pricingMethod">Extra-work pricing</label>
                <select id="pricingMethod" className="select" name="pricingMethod" defaultValue="hourly">
                  <option value="hourly">Hourly rate</option>
                  <option value="fixed">Fixed price per request</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="hourlyRate">Hourly rate</label>
                <input id="hourlyRate" className="input num" inputMode="decimal" name="hourlyRate" placeholder="350.00" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="revisionLimit">Included revisions</label>
                <input id="revisionLimit" className="input num" type="number" min="0" max="100" name="revisionLimit" defaultValue="2" required />
                <p className="hint">Revisions beyond this number become billable change orders.</p>
              </div>
            </div>
            <div className="form-actions justify-end border-t border-[var(--line)] pt-5">
              <Button variant="outline" type="button">Save draft</Button>
              <Button type="submit">Continue to scope</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
