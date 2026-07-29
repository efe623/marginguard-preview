import { Banknote, FileText, Receipt } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { QuoteDraftForm } from "@/components/quote-draft-form";
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
  const todayDate = new Date();
  const today = todayDate.toISOString().slice(0, 10);
  const dueDate = new Date(todayDate);
  dueDate.setDate(dueDate.getDate() + 14);
  const due = dueDate.toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader eyebrow={project.code} title="Project money" description="Quotes, costs, invoices, and remaining profit in one place." />
      <ProjectTabs projectId={projectId} active="money" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="eyebrow">Quoted budget</p><p className="mt-2 text-3xl font-bold">{formatMoney(budget, project.currency)}</p></div>
        <div className="card p-5"><p className="eyebrow">Costs so far</p><p className="mt-2 text-3xl font-bold">{formatMoney(expenseTotal + laborCost, project.currency)}</p></div>
        <div className="card p-5"><p className="eyebrow">Remaining profit</p><p className={`mt-2 text-3xl font-bold ${remaining < 0 ? "text-[var(--danger)]" : ""}`}>{formatMoney(remaining, project.currency)}</p></div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-6">
          <h2 className="section-title flex items-center gap-2"><Receipt size={20} /> Expenses</h2>
          <form action={addExpense} className="mt-5 space-y-3">
            <input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="currency" value={project.currency} />
            <select className="input" name="category" defaultValue="material"><option value="material">Material</option><option value="subcontractor">Subcontractor</option><option value="travel">Travel</option><option value="software">Software</option><option value="other">Other</option></select>
            <input className="input" name="vendor" placeholder="Vendor" />
            <input className="input" name="description" placeholder="What was purchased?" required />
            <input className="input" name="amount" inputMode="decimal" placeholder="Amount" required />
            <input className="input" name="incurredOn" type="date" defaultValue={today} required />
            <button className="button button-primary w-full" type="submit">Record expense</button>
          </form>
          <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-4">
            {expenses.slice(0, 8).map((expense) => <div key={expense.id} className="flex justify-between gap-3 text-sm"><div><p>{expense.description}</p><p className="quiet">{expense.vendor || expense.category}</p></div><strong>{formatMoney(Number(expense.amount_minor), expense.currency)}</strong></div>)}
          </div>
        </section>
        <section className="card p-6">
          <h2 className="section-title flex items-center gap-2"><FileText size={20} /> Quotes</h2>
          <QuoteDraftForm projectId={projectId} currency={project.currency} templates={templates} />
          <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-4">
            {quotes.map((quote) => <div key={quote.id} className="flex justify-between gap-3 text-sm"><div><p>{quote.quote_number}</p><p className="quiet">{quote.title}</p></div><div className="text-right"><strong>{formatMoney(Number(quote.amount_minor), quote.currency)}</strong><br /><Status tone="neutral">{quote.status}</Status></div></div>)}
          </div>
        </section>
        <section className="card p-6">
          <h2 className="section-title flex items-center gap-2"><Banknote size={20} /> Invoices</h2>
          <form action={createInvoice} className="mt-5 space-y-3">
            <input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="currency" value={project.currency} />
            <textarea className="input min-h-20" name="description" placeholder="Invoice description" />
            <input className="input" name="amount" inputMode="decimal" placeholder="Amount" required />
            <input className="input" name="dueDate" type="date" min={today} defaultValue={due} required />
            <button className="button button-primary w-full" type="submit">Create invoice</button>
          </form>
          <div className="mt-5 space-y-4 border-t border-[var(--line)] pt-4">
            {invoices.map((invoice) => <div key={invoice.id} className="text-sm"><div className="flex justify-between gap-3"><div><p>{invoice.invoice_number}</p><p className="quiet">Due {invoice.due_date}</p></div><strong>{formatMoney(Number(invoice.amount_minor), invoice.currency)}</strong></div><form action={updateInvoiceStatus} className="mt-2 flex gap-2"><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="invoiceId" value={invoice.id} /><select className="input" name="status" defaultValue={invoice.status}><option value="draft">Draft</option><option value="sent">Sent</option><option value="partially_paid">Partially paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="void">Void</option></select><button className="button button-dark" type="submit">Save</button></form></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
