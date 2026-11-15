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
let loadedAt = 0;
function readBaseline() {
  if (baseline === undefined) {
    try {
      baseline = localStorage.getItem(VISIT_KEY);
    } catch {
      baseline = null;
    }
    loadedAt = Date.now();
  }
  return baseline;
}
function readLoadedAt() {
  readBaseline();
  return loadedAt;
}
function readProject() {
  try {
    return localStorage.getItem(PROJECT_KEY);
  } catch {
    return null;
  }
}
const noop = () => () => {};

function ago(ms: number) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 2) return "a moment ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

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
  const now = useSyncExternalStore(noop, readLoadedAt, () => 0);
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
    return <section className="panel brief-since" aria-busy="true" aria-label="Since you were last here" />;
  }

  let previous: { ts: number; needs: number } | null = null;
  try {
    previous = raw ? (JSON.parse(raw) as { ts: number; needs: number }) : null;
  } catch {
    previous = null;
  }

  const fresh = previous ? items.filter((item) => new Date(item.createdAt).getTime() > previous!.ts) : items.slice(0, 3);
  const shown = fresh.slice(0, 4);
  const delta = previous ? previous.needs - needs : 0;
  const resume = projects.find((project) => project.id === lastProject);

  let heading = "Recent activity";
  let line = "The latest from your projects.";
  if (previous) {
    heading = "Since you were last here";
    if (delta > 0) line = `${delta} fewer ${delta === 1 ? "thing" : "things"} waiting on you than last time, ${ago(now - previous.ts)}.`;
    else if (delta < 0) line = `${-delta} new ${-delta === 1 ? "thing needs" : "things need"} you since ${ago(now - previous.ts)}.`;
    else line = `You were last here ${ago(now - previous.ts)}.`;
  }

  return (
    <section className="panel brief-since" aria-labelledby="since-title">
      <div className="panel-head">
        <div>
          <h2 id="since-title" className="panel-title">{heading}</h2>
          <p className="panel-sub">{line}</p>
        </div>
      </div>
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
      ) : (
        <div className="empty empty-sm">
          <p className="empty-title">{previous ? "Nothing new" : "No activity yet"}</p>
          <p className="empty-text">{previous ? "No new payments, approvals or messages since your last visit." : "Payments, approvals and client messages will show up here."}</p>
        </div>
      )}
      {resume ? (
        <Link href={`/projects/${resume.id}`} className="resume">
          <span>Pick up where you left off</span>
          <strong>{resume.name}</strong>
          <IconChevron size={16} />
        </Link>
      ) : null}
    </section>
  );
}
