const DAY = 86400000;

type Invoice = { status: string; due_date: string };
type Task = { status: string; due_at: string | null };

/**
 * How many things genuinely need the owner right now. The same rules the
 * dashboard uses for "Needs you", so the sidebar badge and the page never
 * disagree: blocked projects, overdue invoices (max 4) and tasks due within
 * three days (max 4), capped at eight in total.
 */
export function computeAttention(
  data: { invoices: unknown[]; tasks: unknown[] },
  projects: Array<{ status: string }>,
  nowMs: number
) {
  const today = new Date(nowMs).toISOString().slice(0, 10);
  const cutoff = nowMs + 3 * DAY;
  const invoices = data.invoices as Invoice[];
  const tasks = data.tasks as Task[];
  const blocked = projects.filter((project) => project.status === "awaiting_deposit" || project.status === "awaiting_approval").length;
  const overdue = invoices.filter((invoice) => invoice.status !== "void" && invoice.status !== "paid" && invoice.due_date < today).length;
  const urgent = tasks.filter((task) => task.status !== "done" && task.due_at && new Date(task.due_at).getTime() < cutoff).length;
  return {
    needs: Math.min(8, blocked + Math.min(4, overdue) + Math.min(4, urgent)),
    overdue
  };
}
