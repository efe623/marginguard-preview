import { CircleCheck, CircleDashed, Clock3, OctagonAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { Button } from "@/components/ui/button";
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

      <div className="split">
        <div className="stack">
          <section className="panel" aria-labelledby="tasks-title">
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
                        <Status tone={task.status === "done" ? "success" : task.status === "blocked" ? "danger" : task.status === "in_progress" ? "warning" : "neutral"}>
                          {task.status.replace("_", " ")}
                        </Status>
                        <form action={updateTaskStatus} className="cluster">
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="taskId" value={task.id} />
                          <label className="sr-only" htmlFor={`status-${task.id}`}>Status for {task.title}</label>
                          <select id={`status-${task.id}`} className="select" name="status" defaultValue={task.status}>
                            <option value="todo">To do</option><option value="in_progress">In progress</option>
                            <option value="blocked">Blocked</option><option value="done">Done</option>
                          </select>
                          <Button variant="outline" className="button-sm" type="submit">Save</Button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty" data-art="tasks">
                <p className="empty-title">No tasks yet</p>
                <p className="empty-text">Add the first deliverable below so deadlines stay visible.</p>
              </div>
            )}
          </section>

          <form action={createTask} className="panel">
            <div className="panel-head"><h2 className="panel-title">Add a task</h2></div>
            <div className="panel-body stack">
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
                        <td className="whitespace-nowrap">{entry.work_date}</td>
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
              <div className="empty" data-art="tasks">
                <p className="empty-title">No time logged</p>
                <p className="empty-text">Log minutes below to see effort against this job.</p>
              </div>
            )}
          </section>

          <form action={logTime} className="panel">
            <div className="panel-head"><h2 className="panel-title">Log time</h2></div>
            <div className="panel-body stack">
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
        </div>
      </div>
    </div>
  );
}
