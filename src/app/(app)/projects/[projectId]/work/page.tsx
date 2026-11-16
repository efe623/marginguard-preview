import { EmptyState } from "@/components/ui/empty-state";
import { CircleCheck, CircleDashed, Clock3, OctagonAlert, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusSelect } from "@/components/ui/status-select";
import { createTask, logTime, updateTaskStatus } from "@/features/operations/actions";
import { formatDay } from "@/lib/dates";
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
const taskStatusOptions = [
  { value: "todo", label: "To do", tone: "neutral" as const },
  { value: "in_progress", label: "In progress", tone: "warning" as const },
  { value: "blocked", label: "Blocked", tone: "danger" as const },
  { value: "done", label: "Done", tone: "success" as const }
];

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
  const open = tasks.filter((task) => task.status !== "done").length;
  const crumbs = [
    { label: "Projects", href: "/projects" },
    { label: project.name, href: `/projects/${projectId}` }
  ];

  return (
    <div className="page">
      <PageHeader
        crumbs={crumbs}
        title="Tasks and time"
        description="Keep deliverables, deadlines, and effort connected to the job."
      />
      <ProjectTabs projectId={projectId} active="work" />

      <div className="split split-work">
        <div className="stack">
          <section className="panel panel-lead" aria-labelledby="tasks-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="tasks-title">Tasks</h2>
                <p className="panel-sub">{open} open of {tasks.length}</p>
              </div>
            </div>
            {tasks.length ? (
              <div className="rows">
                {tasks.map((task) => {
                  const Icon = task.status === "done" ? CircleCheck : task.status === "blocked" ? OctagonAlert : CircleDashed;
                  return (
                    <div key={task.id} className="row">
                      <span className="row-lead"><Icon size={18} aria-hidden="true" /></span>
                      <div className="row-main">
                        <p className="row-title">{task.title}</p>
                        {task.description ? <p className="row-sub">{task.description}</p> : null}
                        <p className="row-sub">
                          <span className="capitalize">{task.priority}</span> priority
                          {task.due_at
                            ? ` · due ${new Date(task.due_at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}`
                            : " · no due date"}
                        </p>
                      </div>
                      <div className="row-end">
                        <StatusSelect
                          action={updateTaskStatus}
                          fields={{ projectId, taskId: task.id }}
                          value={task.status}
                          label={`Status for ${task.title}`}
                          options={taskStatusOptions}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState art="tasks" title="Add the first task" text="Break the job into tasks with due dates, and deadlines show up on Today." focus="Add a task" />
            )}
          </section>

          <details className="disclosure">
            <summary className="disclosure-summary"><Plus size={16} aria-hidden="true" /> Add a task</summary>
          <form action={createTask} className="disclosure-body">
            <div className="stack">
              <input type="hidden" name="projectId" value={projectId} />
              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="task-title">Task</label>
                  <input id="task-title" className="input" name="title" required placeholder="Prepare first design draft" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="task-priority">Priority</label>
                  <select id="task-priority" className="select" name="priority" defaultValue="normal">
                    <option value="low">Low</option><option value="normal">Normal</option>
                    <option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="task-due">Due</label>
                  <input id="task-due" className="input" name="dueAt" type="datetime-local" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="task-desc">Description</label>
                  <input id="task-desc" className="input" name="description" placeholder="Acceptance notes" />
                </div>
              </div>
              <div className="form-actions"><Button type="submit">Add task</Button></div>
            </div>
          </form>
          </details>
        </div>

        <div className="stack">
          <section className="panel" aria-labelledby="time-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="time-title">Time</h2>
                <p className="panel-sub">Total logged</p>
              </div>
              <span className="num inline-flex items-center gap-2 font-semibold">
                <Clock3 size={16} aria-hidden="true" />
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </span>
            </div>
            {entries.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Work</th><th className="num">Time</th></tr>
                  </thead>
                  <tbody>
                    {entries.slice(0, 8).map((entry) => (
                      <tr key={entry.id}>
                        <td className="whitespace-nowrap">{formatDay(entry.work_date)}</td>
                        <td>
                          {entry.description || "Project work"}
                          {entry.billable ? null : <span className="quiet"> (non-billable)</span>}
                        </td>
                        <td className="num">{entry.minutes}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState art="tasks" title="Log your first hour" text="Track minutes against this job to see what it really costs you." focus="Log time" />
            )}
          </section>

          <details className="disclosure">
            <summary className="disclosure-summary"><Plus size={16} aria-hidden="true" /> Log time</summary>
          <form action={logTime} className="disclosure-body">
            <div className="stack">
              <input type="hidden" name="projectId" value={projectId} />
              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="time-minutes">Minutes</label>
                  <input id="time-minutes" className="input" name="minutes" type="number" min="1" max="1440" required />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="time-date">Date</label>
                  <input id="time-date" className="input" name="workDate" type="date" defaultValue={today} required />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="time-desc">Work completed</label>
                <textarea id="time-desc" className="textarea" name="description" />
              </div>
              <label className="check"><input name="billable" type="checkbox" defaultChecked /> Billable time</label>
              <div className="form-actions"><Button type="submit">Log time</Button></div>
            </div>
          </form>
          </details>
        </div>
      </div>
    </div>
  );
}
