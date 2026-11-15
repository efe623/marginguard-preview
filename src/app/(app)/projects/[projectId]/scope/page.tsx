import { Check, FileText, Plus, X } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
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
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` }
        ]}
        title="Scope"
        description="The structured agreement used for every revision warning and change order."
        actions={
          <>
            <Button variant="outline">Upload document</Button>
            <ButtonLink href={`/projects/${project.id}/scope/edit`}>Edit scope</ButtonLink>
          </>
        }
      />
      <ProjectTabs projectId={project.id} active="scope" />

      <div className="split">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Included deliverables</h2>
                <p className="panel-sub">
                  {deliverables.length} {deliverables.length === 1 ? "item" : "items"} covered by the original quote
                </p>
              </div>
              <Button variant="outline" className="button-sm"><Plus size={15} aria-hidden /> Add item</Button>
            </div>
            {deliverables.length ? (
              <ol className="rows">
                {deliverables.map((item, index) => (
                  <li key={item.id} className="row">
                    <span className="row-lead text-[var(--success)]"><Check size={18} aria-hidden /></span>
                    <div className="row-main">
                      <p className="row-title"><span className="faint num mr-2">{index + 1}.</span>{item.title}</p>
                      {item.description ? <p className="row-sub">{item.description}</p> : null}
                    </div>
                    <div className="row-end"><Status tone="success">Included</Status></div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty" data-art="tasks">
                <p className="empty-title">No deliverables yet</p>
                <p className="empty-text">List what the client is paying for so extra work can be spotted.</p>
                <ButtonLink href={`/projects/${project.id}/scope/edit`}>Edit scope</ButtonLink>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Explicit exclusions</h2>
                <p className="panel-sub">Not in the quote. Asking for these is billable extra work.</p>
              </div>
              <Button variant="outline" className="button-sm"><Plus size={15} aria-hidden /> Add exclusion</Button>
            </div>
            {exclusions.length ? (
              <ol className="rows">
                {exclusions.map((item, index) => (
                  <li key={item.id} className="row">
                    <span className="row-lead text-[var(--danger)]"><X size={18} aria-hidden /></span>
                    <div className="row-main">
                      <p className="row-title"><span className="faint num mr-2">{index + 1}.</span>{item.title}</p>
                      {item.description ? <p className="row-sub">{item.description}</p> : null}
                    </div>
                    <div className="row-end">
                      <Status tone="danger">Not included</Status>
                      <ButtonLink
                        href={`/projects/${project.id}/change-orders/new`}
                        variant="outline"
                        className="button-sm"
                      >
                        Create order
                      </ButtonLink>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty" data-art="tasks">
                <p className="empty-title">No exclusions recorded</p>
                <p className="empty-text">Naming what is out of scope up front prevents disputes later.</p>
                <ButtonLink href={`/projects/${project.id}/scope/edit`} variant="outline">Add exclusions</ButtonLink>
              </div>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="panel">
            <div className="panel-head"><h2 className="panel-title">Commercial terms</h2></div>
            <div className="panel-body">
              <dl className="ledger">
                {[
                  ["Original price", formatMoney(project.quoteMinor, project.currency)],
                  ["Pricing rule", "AED 350 / hour"],
                  ["Included revisions", `${project.revisionLimit}`],
                  ["Timeline", "8 weeks"],
                  ["Currency", project.currency]
                ].map(([term, value]) => (
                  <div key={term} className="ledger-line">
                    <dt className="ledger-label">{term}</dt>
                    <dd className="ledger-value num">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2 className="panel-title">Supporting agreement</h2></div>
            <div className="row grid-cols-[auto_minmax(0,1fr)]">
              <span className="row-lead"><FileText size={18} aria-hidden /></span>
              <div className="row-main">
                <p className="row-title">Client-quote-v3.pdf</p>
                <p className="row-sub">2.4 MB</p>
              </div>
              <div className="row-end col-start-2 justify-start text-left">
                <Status tone="success">Scan passed</Status>
                <Button variant="outline" className="button-sm" type="button">Download</Button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
