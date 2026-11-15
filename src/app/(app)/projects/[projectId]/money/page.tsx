import { EmptyState } from "@/components/ui/empty-state";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { QuoteDraftForm } from "@/components/quote-draft-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import {
  addExpense,
  createInvoice,
  updateInvoiceStatus
} from "@/features/operations/actions";
import {
  getOperationsProjectData,
  getProjectContext,
  getQuoteTemplates
} from "@/features/operations/queries";
import { formatMoney } from "@/lib/money";

type ExpenseRow = { id: string; category: string; description: string; vendor: string | null; amount_minor: number; currency: string; incurred_on: string };
type InvoiceRow = { id: string; invoice_number: string; description: string; amount_minor: number; paid_amount_minor: number; currency: string; status: string; due_date: string };
type QuoteRow = { id: string; quote_number: string; title: string; amount_minor: number; currency: string; status: string; valid_until: string | null };

function invoiceTone(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "overdue") return "danger" as const;
  if (status === "sent" || status === "partially_paid") return "warning" as const;
  return "neutral" as const;
}

export default async function ProjectMoneyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, data, templates] = await Promise.all([
    getProjectContext(projectId),
    getOperationsProjectData(projectId),
    getQuoteTemplates()
  ]);
  if (!project) notFound();
  const expenses = data.expenses as ExpenseRow[];
  const invoices = data.invoices as InvoiceRow[];
  const quotes = data.quotes as QuoteRow[];
  const expenseTotal = expenses.reduce((sum, row) => sum + Number(row.amount_minor), 0);
  const trackedMinutes = (data.timeEntries as Array<{ minutes: number; billable: boolean }>).reduce((sum, row) => sum + Number(row.minutes), 0);
  const laborCost = project.hourly_rate_minor ? Math.round((trackedMinutes / 60) * Number(project.hourly_rate_minor)) : 0;
  const approvedExtra = 0;
  const budget = Number(project.quote_amount_minor) + approvedExtra;
  const remaining = budget - expenseTotal - laborCost;
  const live = invoices.filter((row) => row.status !== "void");
  const invoicedTotal = live.reduce((sum, row) => sum + Number(row.amount_minor), 0);
  const paidTotal = live.reduce((sum, row) => sum + Number(row.paid_amount_minor ?? 0), 0);
  const outstanding = invoicedTotal - paidTotal;
  const money = (value: number) => formatMoney(value, project.currency);
  const todayDate = new Date();
  const today = todayDate.toISOString().slice(0, 10);
  const dueDate = new Date(todayDate);
  dueDate.setDate(dueDate.getDate() + 14);
  const due = dueDate.toISOString().slice(0, 10);
  const crumbs = [
    { label: "Projects", href: "/projects" },
    { label: project.name, href: `/projects/${projectId}` }
  ];

  return (
    <div className="page">
      <PageHeader crumbs={crumbs} title="Money" description="Quotes, costs, invoices, and remaining profit in one place." />
      <ProjectTabs projectId={projectId} active="money" />
      <div className="stack">
        <section className="panel" aria-labelledby="statement-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="statement-title">Statement</h2>
              <p className="panel-sub">All amounts in {project.currency}</p>
            </div>
          </div>
          <div className="panel-body">
            <dl className="ledger">
              <div className="ledger-line"><dt className="ledger-label">Original quote</dt><dd className="ledger-value">{money(Number(project.quote_amount_minor))}</dd></div>
              <div className="ledger-line"><dt className="ledger-label">Approved extras</dt><dd className="ledger-value">{money(approvedExtra)}</dd></div>
              <div className="ledger-line"><dt className="ledger-label">Expenses</dt><dd className="ledger-value">{money(expenseTotal)}</dd></div>
              <div className="ledger-line"><dt className="ledger-label">Labour cost</dt><dd className="ledger-value">{money(laborCost)}</dd></div>
              <div className="ledger-line"><dt className="ledger-label">Invoiced</dt><dd className="ledger-value">{money(invoicedTotal)}</dd></div>
              <div className="ledger-line"><dt className="ledger-label">Paid</dt><dd className="ledger-value">{money(paidTotal)}</dd></div>
              <div className="ledger-line"><dt className="ledger-label">Outstanding</dt><dd className="ledger-value">{money(outstanding)}</dd></div>
              <div className="ledger-line is-total">
                <dt className="ledger-label">Expected profit</dt>
                <dd className={`ledger-value ${remaining < 0 ? "text-[var(--danger)]" : ""}`}>{money(remaining)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="panel" aria-labelledby="invoices-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="invoices-title">Invoices</h2>
              <p className="panel-sub">{invoices.length} on this project</p>
            </div>
          </div>
          {invoices.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Invoice</th><th>Due</th><th className="num">Amount</th><th className="num">Paid</th><th>Status</th><th>Change status</th></tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <p className="font-semibold">{invoice.invoice_number}</p>
                        {invoice.description ? <p className="meta">{invoice.description}</p> : null}
                      </td>
                      <td className="whitespace-nowrap">{invoice.due_date}</td>
                      <td className="num">{formatMoney(Number(invoice.amount_minor), invoice.currency)}</td>
                      <td className="num">{formatMoney(Number(invoice.paid_amount_minor ?? 0), invoice.currency)}</td>
                      <td><Status tone={invoiceTone(invoice.status)}>{invoice.status.replace("_", " ")}</Status></td>
                      <td>
                        <form action={updateInvoiceStatus} className="cluster">
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <label className="sr-only" htmlFor={`inv-${invoice.id}`}>Status for {invoice.invoice_number}</label>
                          <select id={`inv-${invoice.id}`} className="select" name="status" defaultValue={invoice.status}>
                            <option value="draft">Draft</option><option value="sent">Sent</option><option value="partially_paid">Partially paid</option>
                            <option value="paid">Paid</option><option value="overdue">Overdue</option><option value="void">Void</option>
                          </select>
                          <Button variant="outline" className="button-sm" type="submit">Save</Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState art="money" title="Raise the first invoice" text="Bill the work that is ready, and its payment status is tracked for you." focus="Create an invoice" />
          )}
        </section>

        <form action={createInvoice} className="panel">
          <div className="panel-head"><h2 className="panel-title">Create an invoice</h2></div>
          <div className="panel-body stack">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="currency" value={project.currency} />
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="inv-amount">Amount ({project.currency})</label>
                <input id="inv-amount" className="input" name="amount" inputMode="decimal" placeholder="2,500.00" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="inv-due">Due date</label>
                <input id="inv-due" className="input" name="dueDate" type="date" min={today} defaultValue={due} required />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="inv-desc">Description</label>
              <textarea id="inv-desc" className="textarea" name="description" placeholder="Invoice description" />
            </div>
            <div className="form-actions"><Button type="submit">Create invoice</Button></div>
          </div>
        </form>

        <section className="panel" aria-labelledby="expenses-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="expenses-title">Expenses</h2>
              <p className="panel-sub">{money(expenseTotal)} recorded</p>
            </div>
          </div>
          {expenses.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Description</th><th>Vendor</th><th className="num">Amount</th></tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 8).map((expense) => (
                    <tr key={expense.id}>
                      <td className="whitespace-nowrap">{expense.incurred_on}</td>
                      <td>{expense.description}</td>
                      <td className="quiet capitalize">{expense.vendor || expense.category}</td>
                      <td className="num">{formatMoney(Number(expense.amount_minor), expense.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState art="money" title="Record the first expense" text="Add materials, subcontractors and travel so the profit figure is the real one." focus="Add an expense" />
          )}
        </section>

        <form action={addExpense} className="panel">
          <div className="panel-head"><h2 className="panel-title">Record an expense</h2></div>
          <div className="panel-body stack">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="currency" value={project.currency} />
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="exp-category">Category</label>
                <select id="exp-category" className="select" name="category" defaultValue="material">
                  <option value="material">Material</option><option value="subcontractor">Subcontractor</option><option value="travel">Travel</option>
                  <option value="software">Software</option><option value="other">Other</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="exp-vendor">Vendor</label>
                <input id="exp-vendor" className="input" name="vendor" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="exp-desc">What was purchased?</label>
                <input id="exp-desc" className="input" name="description" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="exp-amount">Amount ({project.currency})</label>
                <input id="exp-amount" className="input" name="amount" inputMode="decimal" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="exp-date">Date</label>
                <input id="exp-date" className="input" name="incurredOn" type="date" defaultValue={today} required />
              </div>
            </div>
            <div className="form-actions"><Button type="submit">Record expense</Button></div>
          </div>
        </form>

        <section className="panel" aria-labelledby="quotes-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="quotes-title">Quotes</h2>
              <p className="panel-sub">{quotes.length} on this project</p>
            </div>
          </div>
          {quotes.length ? (
            <div className="rows">
              {quotes.map((quote) => (
                <div key={quote.id} className="row">
                  <div className="row-main">
                    <p className="row-title">{quote.quote_number}</p>
                    <p className="row-sub">{quote.title}{quote.valid_until ? ` · valid until ${quote.valid_until}` : ""}</p>
                  </div>
                  <div className="row-end">
                    <span className="num font-semibold">{formatMoney(Number(quote.amount_minor), quote.currency)}</span>
                    <Status tone="neutral">{quote.status}</Status>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState art="money" title="Draft the quote" text="A written quote fixes the agreed price, and everything after is measured against it." focus="Draft a quote" />
          )}
          <div className="panel-body" style={{ borderTop: "1px solid var(--line)" }}>
            <QuoteDraftForm projectId={projectId} currency={project.currency} templates={templates} />
          </div>
        </section>
      </div>
    </div>
  );
}
