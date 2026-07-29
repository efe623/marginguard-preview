import { Check, FileText, Plus, ShieldCheck, X } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getProjectView, getScopeItemsView } from "@/features/core/queries";
import { formatMoney } from "@/lib/money";

export default async function ProjectScopePage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();
  const scopeItems = await getScopeItemsView(projectId);
  const deliverables = scopeItems.filter((item) => item.kind === "deliverable");
  const exclusions = scopeItems.filter((item) => item.kind === "exclusion");

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${project.name} · Source of truth`}
        title="Project scope"
        description="The structured agreement used for every revision warning and Change Order."
        actions={
          <>
            <Button variant="outline">Upload document</Button>
            <ButtonLink href={`/projects/${project.id}/scope/edit`}>Edit scope</ButtonLink>
          </>
        }
      />
      <ProjectTabs projectId={project.id} active="scope" />

      <div className="mt-7 grid grid-cols-[1.25fr_0.75fr] gap-6">
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between border-b border-[var(--line)] p-7">
              <div>
                <p className="eyebrow mb-3">Included</p>
                <h2 className="section-title">Deliverables</h2>
              </div>
              <Button variant="outline"><Plus size={15} /> Add item</Button>
            </div>
            {deliverables.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[32px_1fr] gap-4 border-b border-[var(--line)] p-6 last:border-0"
              >
                <span className="mt-0.5 grid size-7 place-items-center border border-[var(--success)] text-[var(--success)]">
                  <Check size={15} />
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="quiet mt-2 leading-6">{item.description}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="card">
            <div className="flex items-center justify-between border-b border-[var(--line)] p-7">
              <div>
                <p className="eyebrow mb-3">Not included</p>
                <h2 className="section-title">Explicit exclusions</h2>
              </div>
              <Button variant="outline"><Plus size={15} /> Add exclusion</Button>
            </div>
            {exclusions.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[32px_1fr_auto] gap-4 border-b border-[var(--line)] p-6 last:border-0"
              >
                <span className="mt-0.5 grid size-7 place-items-center border border-[var(--danger)] text-[var(--danger)]">
                  <X size={15} />
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="quiet mt-2 leading-6">{item.description}</p>
                </div>
                <ButtonLink
                  href={`/projects/${project.id}/change-orders/new`}
                  variant="outline"
                >
                  Create order
                </ButtonLink>
              </article>
            ))}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-7">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Commercial terms</p>
              <ShieldCheck size={20} />
            </div>
            <dl className="mt-7 divide-y divide-[var(--line)]">
              {[
                ["Original price", formatMoney(project.quoteMinor, project.currency)],
                ["Pricing rule", "AED 350 / hour"],
                ["Included revisions", `${project.revisionLimit}`],
                ["Timeline", "8 weeks"],
                ["Currency", project.currency]
              ].map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4 py-4">
                  <dt className="quiet text-sm">{term}</dt>
                  <dd className="text-right text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-7">
            <div className="flex items-center gap-3">
              <FileText size={21} />
              <div>
                <p className="font-semibold">Supporting agreement</p>
                <p className="quiet mt-1 text-xs">Client-quote-v3.pdf · 2.4 MB</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--success)]">
                Scan passed
              </span>
              <button className="text-sm font-semibold underline underline-offset-4">Download</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
