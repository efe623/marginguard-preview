import { Clock3, ListTodo } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { createTask, logTime, updateTaskStatus } from "@/features/operations/actions";
import {
  getOperationsProjectData,
  getProjectContext
} from "@/features/operations/queries";

type TaskRow = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: string;
  due_at: string | null;
};
type TimeRow = {
  id: string;
  minutes: number;
  work_date: string;
  description: string;
  billable: boolean;
};

export default async function ProjectWorkPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, data] = await Promise.all([
    getProjectContext(projectId),
    getOperationsProjectData(projectId)
  ]);
  if (!project) notFound();
  const tasks = data.tasks as TaskRow[];
  const entries = data.timeEntries as TimeRow[];
  const today = new Date().toISOString().slice(0, 10);
  const totalMinutes = entries.reduce((sum, entry) => sum + Number(entry.minutes), 0);

  return (
    <div>
      <PageHeader
        eyebrow={project.code}
        title="Tasks and time"
        description="Keep deliverables, owners, deadlines, and effort connected to the job."
      />
      <ProjectTabs projectId={projectId} active="work" />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2"><ListTodo size={20} /> Task board</h2>
            <span className="quiet text-sm">{tasks.filter((task) => task.status !== "done").length} open</span>
          </div>
          <form action={createTask} className="mt-6 grid gap-3 border border-[var(--line)] p-4 md:grid-cols-2">
            <input type="hidden" name="projectId" value={projectId} />
            <label>
              <span className="field-label">Task</span>
              <input className="input" name="title" required placeholder="Prepare first design draft" />
            </label>
            <label>
              <span className="field-label">Priority</span>
              <select className="input" name="priority" defaultValue="normal">
                <option value="low">Low</option><option value="normal">Normal</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </label>
            <label>
              <span className="field-label">Due</span>
              <input className="input" name="dueAt" type="datetime-local" />
            </label>
            <label>
              <span className="field-label">Description</span>
              <input className="input" name="description" placeholder="Acceptance notes" />
            </label>
            <button className="button button-primary md:col-span-2" type="submit">Add task</button>
          </form>
          <div className="mt-5 space-y-3">
            {tasks.length ? tasks.map((task) => (
              <article key={task.id} className="border border-[var(--line)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Status tone={task.status === "done" ? "success" : task.status === "blocked" ? "danger" : "neutral"}>
                        {task.status.replace("_", " ")}
                      </Status>
                    </div>
                    {task.description ? <p className="quiet mt-2 text-sm">{task.description}</p> : null}
                    <p className="quiet mt-2 text-xs">{task.priority} priority{task.due_at ? ` · due ${new Date(task.due_at).toLocaleString()}` : ""}</p>
                  </div>
                  <form action={updateTaskStatus} className="flex gap-2">
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <select className="input min-w-36" name="status" defaultValue={task.status}>
                      <option value="todo">To do</option><option value="in_progress">In progress</option>
                      <option value="blocked">Blocked</option><option value="done">Done</option>
                    </select>
                    <button className="button button-dark" type="submit">Save</button>
                  </form>
                </div>
              </article>
            )) : <p className="quiet py-8 text-center">No tasks yet.</p>}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="section-title flex items-center gap-2"><Clock3 size={20} /> Time tracking</h2>
          <p className="mt-2 text-3xl font-bold">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
          <form action={logTime} className="mt-6 space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            <label><span className="field-label">Minutes</span><input className="input" name="minutes" type="number" min="1" max="1440" required /></label>
            <label><span className="field-label">Date</span><input className="input" name="workDate" type="date" defaultValue={today} required /></label>
            <label><span className="field-label">Work completed</span><textarea className="input min-h-24" name="description" /></label>
            <label className="flex gap-2 text-sm"><input name="billable" type="checkbox" defaultChecked /> Billable time</label>
            <button className="button button-primary w-full" type="submit">Log time</button>
          </form>
          <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
            {entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex justify-between gap-4 text-sm">
                <div><p>{entry.description || "Project work"}</p><p className="quiet">{entry.work_date}</p></div>
                <strong>{entry.minutes}m</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
