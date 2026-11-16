import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { QuoteDraftForm } from "@/components/quote-draft-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { StatusSelect } from "@/components/ui/status-select";
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
import { getProjectView } from "@/features/core/queries";
import { formatMoney } from "@/lib/money";
import { formatDay } from "@/lib/dates";

type ExpenseRow = { id: string; category: string; description: string; vendor: string | null; amount_minor: number; currency: string; incurred_on: string };
type InvoiceRow = { id: string; invoice_number: string; description: string; amount_minor: number; paid_amount_minor: number; currency: string; status: string; due_date: string };
type QuoteRow = { id: string; quote_number: string; title: string; amount_minor: number; currency: string; status: string; valid_until: string | null };

const invoiceStatusOptions = [
  { value: "draft", label: "Draft", tone: "neutral" as const },
  { value: "sent", label: "Sent", tone: "warning" as const },
  { value: "partially_paid", label: "Partially paid", tone: "warning" as const },
  { value: "paid", label: "Paid", tone: "success" as const },
  { value: "overdue", label: "Overdue", tone: "danger" as const },
  { value: "void", label: "Void", tone: "neutral" as const }
];

export default async function ProjectMoneyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, data, templates, view] = await Promise.all([
    getProjectContext(projectId),
    getOperationsProjectData(projectId),
    getQuoteTemplates(),
    getProjectView(projectId).catch(() => null)
  ]);
  if (!project) notFound();
  const expenses = data.expenses as ExpenseRow[];
  const invoices = data.invoices as InvoiceRow[];
  const quotes = data.quotes as QuoteRow[];
  const expenseTotal = expenses.reduce((sum, row) => sum + Number(row.amount_minor), 0);
  const trackedMinutes = (data.timeEntries as Array<{ minutes: number; billable: boolean }>).reduce((sum, row) => sum + Number(row.minutes), 0);
  const laborCost = project.hourly_rate_minor ? Math.round((trackedMinutes / 60) * Number(project.hourly_rate_minor)) : 0;
  // Same figure the project list and overview show: approved change orders.
  const approvedExtra = view?.approvedExtrasMinor ?? 0;
  const budget = Number(project.quote_amount_minor) + approvedExtra;
  const remaining = budget - expenseTotal - laborCost;
  const live = invoices.filter((row) => row.status !== "void");
  const invoicedTotal = live.reduce((sum, row) => sum + Number(row.amount_minor), 0);
  const paidTotal = live.reduce((sum, row) => sum + Number(row.paid_amount_minor ?? 0), 0);
  const outstanding = invoicedTotal - paidTotal;
  const lateCount = live.filter((row) => row.status !== "paid" && (row.status === "overdue" || row.due_date < new Date().toISOString().slice(0, 10))).length;
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
        <dl className="money-lead" aria-label="Where this project stands">
          <div className={lateCount ? "is-late" : ""}>
            <dt>Outstanding payment</dt>
            <dd>{money(outstanding)}</dd>
            <p>{outstanding === 0 ? "Every invoice is paid." : lateCount ? `${lateCount} ${lateCount === 1 ? "invoice is" : "invoices are"} past due. Chase before starting new work.` : `Invoiced and not yet paid, of ${money(invoicedTotal)} billed.`}</p>
          </div>
          <div className={remaining < 0 ? "is-late" : ""}>
            <dt>Expected profit</dt>
            <dd>{money(remaining)}</dd>
            <p>{budget > 0 ? `${Math.round((remaining / budget) * 100)}% of ${money(budget)}, after ${money(expenseTotal + laborCost)} in costs and time.` : "Add a quote to see the margin."}</p>
          </div>
        </dl>

        <section className="panel" aria-labelledby="statement-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="statement-title">How it adds up</h2>
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
                  <tr><th>Invoice</th><th>Due</th><th className="num">Amount</th><th className="num">Paid</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    // Same rule as the Invoices page: unpaid and past its due date reads as Overdue.
                    const daysLate = Math.round((Date.parse(today) - Date.parse(invoice.due_date)) / 86400000);
                    const late = ["sent", "partially_paid"].includes(invoice.status) && daysLate > 0;
                    const options = late
                      ? invoiceStatusOptions.map((option) =>
                          option.value === invoice.status
                            ? { ...option, label: option.value === "sent" ? "Overdue" : "Overdue, part paid", tone: "danger" as const }
                            : option
                        )
                      : invoiceStatusOptions;
                    return (
                    <tr key={invoice.id}>
                      <td>
                        <p className="font-semibold">{invoice.invoice_number}</p>
                        {invoice.description ? <p className="meta">{invoice.description}</p> : null}
                      </td>
                      <td className="whitespace-nowrap">
                        {formatDay(invoice.due_date)}
                        {late ? <p className="meta text-[var(--danger)]">{daysLate} {daysLate === 1 ? "day" : "days"} late</p> : null}
                      </td>
                      <td className="num">{formatMoney(Number(invoice.amount_minor), invoice.currency)}</td>
                      <td className="num">{formatMoney(Number(invoice.paid_amount_minor ?? 0), invoice.currency)}</td>
                      <td>
                        <StatusSelect
                          action={updateInvoiceStatus}
                          fields={{ projectId, invoiceId: invoice.id }}
                          value={invoice.status}
                          label={`Status for ${invoice.invoice_number}`}
                          options={options}
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState art="money" title="Raise the first invoice" text="Bill the work that is ready, and its payment status is tracked for you." focus="Create an invoice" />
          )}
        </section>

        <details className="disclosure">
          <summary className="disclosure-summary"><Plus size={16} aria-hidden="true" /> Create an invoice</summary>
        <form action={createInvoice} className="disclosure-body">
          <div className="stack">
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
        </details>

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
                      <td className="whitespace-nowrap">{formatDay(expense.incurred_on)}</td>
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

        <details className="disclosure">
          <summary className="disclosure-summary"><Plus size={16} aria-hidden="true" /> Record an expense</summary>
        <form action={addExpense} className="disclosure-body">
          <div className="stack">
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
        </details>

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
                    <p className="row-sub">{quote.title}{quote.valid_until ? ` · valid until ${formatDay(quote.valid_until)}` : ""}</p>
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
        </section>
        <details className="disclosure">
          <summary className="disclosure-summary"><Plus size={16} aria-hidden="true" /> Draft a new quote</summary>
          <div className="disclosure-body">
            <QuoteDraftForm projectId={projectId} currency={project.currency} templates={templates} />
          </div>
        </details>
      </div>
    </div>
  );
}
