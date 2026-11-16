"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { IconPlus } from "@/components/icons";

type Project = { id: string; name: string; detail?: string };

function lastProject(projects: Project[]) {
  try {
    const id = localStorage.getItem("unitpulse-lastproject");
    if (id && projects.some((project) => project.id === id)) return id;
  } catch {}
  return projects[0]?.id ?? "";
}

/**
 * Logging a client's extra request is the moment UnitPulse exists for, so it
 * is one step from anywhere: pick the project (the last one you opened is
 * already chosen) and land on the request form with the cursor ready.
 */
export function LogRequestDialog({ open, onClose, projects }: { open: boolean; onClose: () => void; projects: Project[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const titleId = useId();
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const chosen = projectId || lastProject(projects);

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby={titleId}
      onClose={() => {
        setProjectId("");
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          ref.current?.close();
          router.push(projects.length ? `/projects/${chosen}/requests/new?focus=first` : "/projects/new?focus=first");
        }}
      >
        <h2 className="confirm-title" id={titleId}>Log a request</h2>
        {projects.length ? (
          <div className="confirm-text">
            <p>Which project is the client asking about? You decide next whether it is extra work.</p>
            <label className="field mt-2">
              <span className="field-label">Project</span>
              <select className="select" value={chosen} onChange={(event) => setProjectId(event.target.value)} autoFocus>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}{project.detail ? `, ${project.detail}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <p className="confirm-text">Requests belong to a project. Create the project first, then log what the client asked for.</p>
        )}
        <div className="confirm-actions">
          <button type="button" className="button button-outline" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="button button-primary">{projects.length ? "Continue" : "Create a project"}</button>
        </div>
      </form>
    </dialog>
  );
}

export function LogRequestButton({ projects, className = "button button-primary" }: { projects: Project[]; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <IconPlus size={18} /> Log a request
      </button>
      <LogRequestDialog open={open} onClose={() => setOpen(false)} projects={projects} />
    </>
  );
}
