import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { clients as fixtureClients } from "@/data/fixtures";
import { createProject } from "@/features/core/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function NewProjectPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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
    <div className="page max-w-5xl">
      <Link
        href="/projects"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold hover:text-[var(--signal)]"
      >
        <ArrowLeft size={16} /> Back to projects
      </Link>
      <p className="eyebrow mb-4">Project setup · Step 1 of 2</p>
      <h1 className="page-title">Start with the agreement.</h1>
      <p className="quiet mt-5 max-w-2xl text-lg leading-8">
        Record the client and commercial terms now. You will define the
        deliverables, exclusions, and revision limit next.
      </p>

      {error ? <p className="mt-6 border border-[var(--danger)] p-4 text-sm">{error}</p> : null}
      <form action={createProject} className="card mt-10 grid grid-cols-2 gap-6 p-8">
        <label>
          <span className="field-label">Project name</span>
          <input className="input" name="name" placeholder="E-commerce redesign" />
        </label>
        <label>
          <span className="field-label">Client</span>
          <select className="select" name="clientId" required defaultValue="">
            <option value="" disabled>Select a client</option>
            {availableClients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Currency</span>
          <select className="select" name="currency" defaultValue="AED">
            <option>AED</option>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>SAR</option>
          </select>
        </label>
        <label>
          <span className="field-label">Original quote</span>
          <input className="input" inputMode="decimal" name="quote" placeholder="85,000.00" />
        </label>
        <label>
          <span className="field-label">Extra-work pricing</span>
          <select className="select" name="pricingMethod" defaultValue="hourly">
            <option value="hourly">Hourly rate</option>
            <option value="fixed">Fixed price per request</option>
          </select>
        </label>
        <label>
          <span className="field-label">Hourly rate</span>
          <input className="input" inputMode="decimal" name="hourlyRate" placeholder="350.00" />
        </label>
        <label>
          <span className="field-label">Included revisions</span>
          <input className="input" type="number" min="0" max="100" name="revisionLimit" defaultValue="2" required />
        </label>
        <div className="col-span-2 flex justify-end gap-3 border-t border-[var(--line)] pt-6">
          <Button variant="outline" type="button">Save draft</Button>
          <Button type="submit">Continue to scope</Button>
        </div>
      </form>
    </div>
  );
}
