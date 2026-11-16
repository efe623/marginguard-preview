"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { IconChevron } from "@/components/icons";

type Item = { id: string; title: string; body: string; href: string; createdAt: string };

const VISIT_KEY = "unitpulse-visit";
const PROJECT_KEY = "unitpulse-lastproject";

/*
 * "Since you were last here" reads the previous visit once per page load.
 * The new visit is written afterwards, so this page still shows what changed
 * since the last time, and a reload then starts from now.
 */
let baseline: string | null | undefined;
function readBaseline() {
  if (baseline === undefined) {
    try {
      baseline = localStorage.getItem(VISIT_KEY);
    } catch {
      baseline = null;
    }
  }
  return baseline;
}
function readProject() {
  try {
    return localStorage.getItem(PROJECT_KEY);
  } catch {
    return null;
  }
}
const noop = () => () => {};

export function TodayBrief({
  needs,
  items,
  projects
}: {
  needs: number;
  items: Item[];
  projects: Array<{ id: string; name: string }>;
}) {
  const raw = useSyncExternalStore(noop, readBaseline, () => undefined);
  const lastProject = useSyncExternalStore(noop, readProject, () => null);

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(VISIT_KEY, JSON.stringify({ ts: Date.now(), needs }));
      } catch {}
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    save();
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [needs]);

  if (raw === undefined) {
    return null;
  }

  let previous: { ts: number; needs: number } | null = null;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<{ ts: number; needs: number }>) : null;
    // Older builds stored a bare timestamp; anything without a real time is ignored.
    previous = parsed && Number.isFinite(parsed.ts) ? { ts: Number(parsed.ts), needs: Number(parsed.needs) || 0 } : null;
  } catch {
    previous = null;
  }

  const fresh = previous ? items.filter((item) => new Date(item.createdAt).getTime() > previous!.ts) : items.slice(0, 3);
  const shown = fresh.slice(0, 4);
  const resume = projects.find((project) => project.id === lastProject);

  // Nothing new and nothing to resume: say nothing rather than fill the page.
  if (!shown.length && !resume) return null;
  const heading = previous ? "Since your last visit" : "Recent activity";

  return (
    <section className="flat" aria-labelledby="since-title">
      <h2 id="since-title" className="flat-title">{heading}</h2>
      {shown.length ? (
        <div className="rows">
          {shown.map((item) => (
            <Link key={item.id} href={item.href} className="row">
              <div className="row-main">
                <p className="row-title">{item.title}</p>
                <p className="row-sub">{item.body}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      {resume ? (
        <Link href={`/projects/${resume.id}`} className="resume">
          <span>Resume</span>
          <strong>{resume.name}</strong>
          <IconChevron size={16} />
        </Link>
      ) : null}
    </section>
  );
}
