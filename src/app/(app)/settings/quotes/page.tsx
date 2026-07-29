import { SettingsNav } from "@/components/settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { createQuoteTemplate } from "@/features/operations/actions";
import { getQuoteTemplates } from "@/features/operations/queries";

export default async function QuoteTemplatesPage() {
  const templates = await getQuoteTemplates();
  return (
    <div className="page">
      <PageHeader
        eyebrow="Commercial defaults"
        title="Quote templates"
        description="Reuse safer introductions, terms, exclusions, and validity periods."
      />
      <div className="card mt-8"><SettingsNav active="quotes" /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form action={createQuoteTemplate} className="card space-y-4 p-6">
          <h2 className="section-title">New template</h2>
          <label><span className="field-label">Template name</span><input className="input" name="name" required /></label>
          <label><span className="field-label">Proposal title</span><input className="input" name="title" required /></label>
          <label><span className="field-label">Introduction</span><textarea className="input min-h-28" name="introduction" /></label>
          <label><span className="field-label">Terms and exclusions</span><textarea className="input min-h-36" name="terms" /></label>
          <label><span className="field-label">Valid for (days)</span><input className="input" name="validDays" type="number" min="1" max="365" defaultValue="14" required /></label>
          <button className="button button-primary" type="submit">Save template</button>
        </form>
        <section className="card">
          {templates.map((template) => (
            <article key={template.id} className="border-b border-[var(--line)] p-6 last:border-0">
              <p className="eyebrow">{template.name}</p>
              <h2 className="mt-2 font-semibold">{template.title}</h2>
              <p className="quiet mt-2 line-clamp-3 text-sm">{template.terms || "No default terms"}</p>
              <p className="quiet mt-3 text-xs">Valid for {template.default_valid_days} days</p>
            </article>
          ))}
          {!templates.length ? <p className="quiet p-7">No reusable templates yet.</p> : null}
        </section>
      </div>
    </div>
  );
}
