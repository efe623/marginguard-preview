import { EmptyState } from "@/components/ui/empty-state";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { createQuoteTemplate } from "@/features/operations/actions";
import { getQuoteTemplates } from "@/features/operations/queries";

export default async function QuoteTemplatesPage() {
  const templates = await getQuoteTemplates();
  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "Settings", href: "/settings/business" }, { label: "Quote templates" }]}
        title="Quote templates"
        description="Reuse safer introductions, terms, exclusions, and validity periods."
      />
      <SettingsNav active="quotes" />
      <div className="split mt-6">
        <section className="panel" aria-labelledby="saved-templates">
          <div className="panel-head">
            <h2 className="panel-title" id="saved-templates">Saved templates</h2>
          </div>
          {templates.length ? (
            <div className="rows">
              {templates.map((template) => (
                <article key={template.id} className="row" style={{ display: "block" }}>
                  <h3 className="row-title">{template.name}</h3>
                  <p className="row-sub">{template.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-[var(--ink-soft)]">{template.terms || "No default terms"}</p>
                  <p className="meta mt-2">Valid for {template.default_valid_days} days</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Save your first template" text="Reuse your best quote wording and prices on every new project. Fill in the form and save it." focus="Create a template" />
          )}
        </section>
        <form action={createQuoteTemplate} className="panel">
          <div className="panel-head"><h2 className="panel-title">New template</h2></div>
          <div className="panel-body stack">
            <div className="field">
              <label className="field-label" htmlFor="qt-name">Template name</label>
              <input id="qt-name" className="input" name="name" required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="qt-title">Proposal title</label>
              <input id="qt-title" className="input" name="title" required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="qt-intro">Introduction</label>
              <textarea id="qt-intro" className="textarea min-h-28" name="introduction" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="qt-terms">Terms and exclusions</label>
              <textarea id="qt-terms" className="textarea min-h-36" name="terms" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="qt-days">Valid for (days)</label>
              <input id="qt-days" className="input" name="validDays" type="number" min="1" max="365" defaultValue="14" required />
            </div>
            <div className="form-actions border-t border-[var(--line)] pt-4">
              <Button type="submit">Save template</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
