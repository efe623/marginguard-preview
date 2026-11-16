import { changeOrders as fixtureChangeOrders, clients as fixtureClients, projects as fixtureProjects } from "@/data/fixtures";

/**
 * Sample records for preview mode (no Supabase configured). Dates are relative
 * to "now" so overdue and due-soon states always show something realistic.
 * Only the first project is fully populated; the others stay sparse on purpose
 * so empty states remain visible in the preview.
 */
export function buildPreviewData() {
  const day = 86400000;
  const at = (offset: number) => new Date(Date.now() + offset * day);
  const iso = (offset: number) => at(offset).toISOString();
  const date = (offset: number) => iso(offset).slice(0, 10);

  const projects = fixtureProjects.map((project, index) => ({
    id: project.id,
    code: project.code,
    name: project.name,
    client_id: project.clientId,
    currency: project.currency,
    quote_amount_minor: project.quoteMinor,
    status: project.status,
    revision_limit: project.revisionLimit,
    hourly_rate_minor: 25000,
    due_date: date(index === 0 ? 12 : index === 1 ? 26 : 40),
    clients: { id: project.clientId, name: project.clientName, primary_email: fixtureClients.find((c) => c.id === project.clientId)?.email ?? null }
  }));

  const clients = fixtureClients.map((client) => ({ id: client.id, name: client.name }));

  const tasks = [
    { id: "t1", project_id: "ecommerce-redesign", title: "Homepage review", description: "Walk the client through the new homepage layout.", status: "in_progress", priority: "high", due_at: iso(1), position: 1 },
    { id: "t2", project_id: "ecommerce-redesign", title: "Checkout flow QA", description: "Test card, wallet and cash-on-delivery paths.", status: "todo", priority: "medium", due_at: iso(4), position: 2 },
    { id: "t3", project_id: "ecommerce-redesign", title: "Arabic copy handover", description: "Receive translated strings from the client.", status: "blocked", priority: "high", due_at: iso(-2), position: 3 },
    { id: "t4", project_id: "ecommerce-redesign", title: "Product page templates", description: "Three layouts signed off.", status: "done", priority: "medium", due_at: iso(-9), position: 4 },
    { id: "t5", project_id: "villa-renderings", title: "Send lighting options to client", description: "Dusk and midday variants.", status: "todo", priority: "medium", due_at: iso(2), position: 1 },
    { id: "t6", project_id: "brand-package", title: "Final logo files", description: "SVG, PNG and a one-page usage guide.", status: "in_progress", priority: "low", due_at: iso(7), position: 1 }
  ];

  const timeEntries = [
    { id: "te1", project_id: "ecommerce-redesign", minutes: 210, work_date: date(-1), description: "Homepage layout revisions", billable: true },
    { id: "te2", project_id: "ecommerce-redesign", minutes: 95, work_date: date(-3), description: "Client call and notes", billable: false },
    { id: "te3", project_id: "ecommerce-redesign", minutes: 340, work_date: date(-5), description: "Checkout prototype", billable: true },
    { id: "te4", project_id: "villa-renderings", minutes: 180, work_date: date(-2), description: "Scene setup", billable: true }
  ];

  const expenses = [
    { id: "e1", project_id: "ecommerce-redesign", category: "Software", description: "Stock photography licence", vendor: "Pixel Stock", amount_minor: 185000, currency: "AED", incurred_on: date(-14) },
    { id: "e2", project_id: "ecommerce-redesign", category: "Subcontractor", description: "Arabic copy translation", vendor: "Layla Haddad", amount_minor: 620000, currency: "AED", incurred_on: date(-6) },
    { id: "e3", project_id: "villa-renderings", category: "Software", description: "Render farm credits", vendor: "CloudRender", amount_minor: 1665000, currency: "AED", incurred_on: date(-10) }
  ];

  const invoices = [
    { id: "inv-204", project_id: "ecommerce-redesign", client_id: "spark-retail", invoice_number: "INV-204", description: "Milestone 2: checkout and payments", amount_minor: 1250000, paid_amount_minor: 0, currency: "AED", status: "sent", due_date: date(-6) },
    { id: "inv-190", project_id: "ecommerce-redesign", client_id: "spark-retail", invoice_number: "INV-190", description: "Milestone 1: design system", amount_minor: 2000000, paid_amount_minor: 2000000, currency: "AED", status: "paid", due_date: date(-28) },
    { id: "inv-198", project_id: "brand-package", client_id: "nomad-cafe", invoice_number: "INV-198", description: "Deposit for brand package", amount_minor: 750000, paid_amount_minor: 0, currency: "AED", status: "sent", due_date: date(9) }
  ];

  const changeOrders = fixtureChangeOrders.map((order) => ({
    project_id: order.projectId,
    amount_minor: order.amountMinor,
    currency: order.currency,
    status: order.status
  }));

  const messages = [
    { id: "m1", project_id: "ecommerce-redesign", source_type: "email", sender_name: "Maya (Spark Retail)", sender_address: "contact@sparkretail.example", content: "Could we also add Arabic support to the storefront? We are launching in Riyadh next quarter.", occurred_at: iso(-4), created_at: iso(-4) },
    { id: "m2", project_id: "ecommerce-redesign", source_type: "manual", sender_name: "You", sender_address: null, content: "Sent a priced change order for Arabic localisation, 2 weeks added to the timeline.", occurred_at: iso(-3), created_at: iso(-3) }
  ];

  const updates = [
    { id: "u1", project_id: "ecommerce-redesign", title: "Checkout prototype ready", body: "The prototype covers card, wallet and cash-on-delivery. Review link sent to Maya.", visible_to_client: true, created_at: iso(-2) },
    { id: "u2", project_id: "ecommerce-redesign", title: "Waiting on translated strings", body: "Arabic work cannot start until the deposit lands and copy arrives.", visible_to_client: false, created_at: iso(-1) }
  ];

  const aiDrafts = [
    { id: "ai1", project_id: "ecommerce-redesign", generation_type: "scope_check", output: { summary: "Arabic localisation is not in the agreed scope. The quote covers an English storefront only.", confidence: 0.86, findings: [{ type: "request", title: "Arabic storefront", evidence: "Could we also add Arabic support to the storefront?", recommendation: "Price it as a separate change order before any Arabic work starts." }], timeline: "Adds about 2 weeks", priceEstimate: { amount: 2500, currency: "AED", rationale: "Right-to-left layouts for 6 templates plus copy handover.", assumptions: ["Client supplies translated copy"] }, changeOrder: { title: "Arabic localisation", reason: "Price it as a separate change order before any Arabic work starts.", description: "Right-to-left versions of the storefront templates.", timelineImpact: "Adds about 2 weeks", depositPercentage: 50 } }, model: "preview-model", status: "draft", created_at: iso(-3) }
  ];

  const quotes = [
    { id: "q1", project_id: "ecommerce-redesign", quote_number: "Q-0146", title: "E-commerce redesign, full build", amount_minor: 8500000, currency: "AED", status: "accepted", valid_until: date(-40) }
  ];

  return { projects, clients, tasks, timeEntries, expenses, invoices, changeOrders, messages, updates, aiDrafts, quotes };
}

export function buildPreviewFiles(projectId: string) {
  if (projectId !== "ecommerce-redesign") return [];
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  return [
    { id: "f1", original_name: "Homepage-v3.fig", content_type: "application/octet-stream", size_bytes: 8_400_000, kind: "design", scan_status: "clean", created_at: ago(2) },
    { id: "f2", original_name: "Arabic-scope-request.pdf", content_type: "application/pdf", size_bytes: 412_000, kind: "evidence", scan_status: "clean", created_at: ago(4) },
    { id: "f3", original_name: "Brand-guidelines.docx", content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size_bytes: 1_900_000, kind: "reference", scan_status: "pending", created_at: ago(6) }
  ];
}
