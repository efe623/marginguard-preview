import { buildPreviewData } from "@/data/preview-data";
import { previewExtrasMinor } from "@/data/fixtures";
import { formatMoney } from "@/lib/money";

/**
 * Pulse in the preview: no AI provider is connected, so answer the common
 * questions straight from the sample data instead of showing a setup error.
 */
export function previewPulseReply(question: string): string {
  const q = question.toLowerCase();
  const data = buildPreviewData();
  const today = new Date().toISOString().slice(0, 10);
  const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const names = new Map(data.projects.map((project) => [project.id, project.name]));
  const open = data.invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "void");
  const owed = (invoice: (typeof data.invoices)[number]) => invoice.amount_minor - invoice.paid_amount_minor;
  const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en", { day: "numeric", month: "short" });
  const line = (invoice: (typeof data.invoices)[number]) =>
    `• ${invoice.invoice_number}, ${names.get(invoice.project_id) ?? "Project"}: ${formatMoney(owed(invoice), invoice.currency)}, due ${day(invoice.due_date)}`;
  const overdue = open.filter((invoice) => invoice.due_date < today);

  if (/due|upcoming|next (7|seven) days|this week/.test(q)) {
    const soon = open.filter((invoice) => invoice.due_date >= today && invoice.due_date <= inDays(7));
    const parts = [soon.length ? `Due in the next 7 days:\n${soon.map(line).join("\n")}` : "Nothing is due in the next 7 days."];
    if (overdue.length) parts.push(`Already late:\n${overdue.map(line).join("\n")}`);
    return parts.join("\n\n");
  }

  if (/report|summary|overview|invoices?/.test(q)) {
    const billed = data.invoices.reduce((sum, invoice) => sum + invoice.amount_minor, 0);
    const paid = data.invoices.reduce((sum, invoice) => sum + invoice.paid_amount_minor, 0);
    return [
      `Invoice report (${data.invoices.length} invoices, AED):`,
      `• Billed: ${formatMoney(billed, "AED")}`,
      `• Paid: ${formatMoney(paid, "AED")}`,
      `• Waiting for payment: ${formatMoney(billed - paid, "AED")}`,
      overdue.length ? `• Late: ${overdue.map((invoice) => invoice.invoice_number).join(", ")}` : "• Nothing is late."
    ].join("\n");
  }

  if (/leak|losing|lose|risk|profit|margin/.test(q)) {
    const leaks: string[] = [];
    for (const invoice of overdue) {
      const late = Math.round((Date.parse(today) - Date.parse(invoice.due_date)) / 86400000);
      leaks.push(`• ${invoice.invoice_number} (${formatMoney(owed(invoice), invoice.currency)}) is ${late} days late. Chase it before starting new work on ${names.get(invoice.project_id)}.`);
    }
    for (const project of data.projects) {
      const costs = data.expenses.filter((expense) => expense.project_id === project.id).reduce((sum, expense) => sum + expense.amount_minor, 0);
      const invoiced = data.invoices.some((invoice) => invoice.project_id === project.id);
      if (costs && !invoiced) leaks.push(`• ${project.name} has ${formatMoney(costs, project.currency)} in costs and nothing invoiced yet.`);
    }
    const unbilledExtras = data.projects.filter((project) => previewExtrasMinor(project.id) > 0 && project.status === "awaiting_deposit");
    for (const project of unbilledExtras) leaks.push(`• ${project.name} has an approved change waiting on its deposit. Don't start that work until it is paid.`);
    return leaks.length ? `Possible money leaks:\n${leaks.join("\n")}` : "I can't see any money leaks right now.";
  }

  return "This is the preview, so I answer from the sample data. Try asking which invoices are due, for an invoice report, or about money leaks.";
}
