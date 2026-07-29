import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { publishScope } from "@/features/core/actions";

export default async function EditScopePage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ projectId }, { error }] = await Promise.all([params, searchParams]);
  return (
    <div className="page max-w-5xl">
      <Link href={`/projects/${projectId}/scope`} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft size={16} /> Back to scope
      </Link>
      <p className="eyebrow">Structured agreement</p>
      <h1 className="page-title mt-4">Publish the source of truth.</h1>
      <p className="quiet mt-4 max-w-2xl leading-7">
        Enter one item per line. Use a vertical bar to separate the title from details.
      </p>
      {error ? <p className="mt-6 border border-[var(--danger)] p-4 text-sm">{error}</p> : null}
      <form action={publishScope} className="card mt-8 grid grid-cols-2 gap-6 p-8">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="currency" value="AED" />
        <label className="col-span-2">
          <span className="field-label">Deliverables</span>
          <textarea className="textarea min-h-40" name="deliverables" required placeholder={"Five landing pages | Home, About, Contact, FAQ, Journal\nCheckout flow | Cart through confirmation"} />
        </label>
        <label className="col-span-2">
          <span className="field-label">Explicit exclusions</span>
          <textarea className="textarea min-h-32" name="exclusions" placeholder={"Arabic localization | RTL and translation are excluded\nProduct photography | Supplied by client"} />
        </label>
        <label>
          <span className="field-label">Timeline</span>
          <input className="input" name="timeline" required placeholder="8 weeks from deposit confirmation" />
        </label>
        <label>
          <span className="field-label">Included revisions</span>
          <input className="input" name="revisionLimit" type="number" min="0" max="100" defaultValue="2" required />
        </label>
        <label>
          <span className="field-label">Extra-work pricing</span>
          <select className="select" name="pricingMethod" defaultValue="hourly">
            <option value="hourly">Hourly</option>
            <option value="fixed">Fixed per request</option>
          </select>
        </label>
        <label>
          <span className="field-label">Hourly rate</span>
          <input className="input" name="hourlyRate" inputMode="decimal" defaultValue="350.00" />
        </label>
        <div className="col-span-2 flex justify-end border-t border-[var(--line)] pt-6">
          <Button type="submit">Publish scope</Button>
        </div>
      </form>
    </div>
  );
}
