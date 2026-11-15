import "server-only";
import { cookies } from "next/headers";
import { projects as fixtureProjects } from "@/data/fixtures";

/*
 * The preview has no database, so a delete there is remembered in a cookie.
 * That lets the whole flow be tried: the item disappears from every list, the
 * dashboard and the counts, on this browser only. Nothing here runs when
 * Supabase is configured.
 */
const NAME = "unitpulse-preview-deleted";

type Stored = { p: string[]; c: string[] };

async function read(): Promise<Stored> {
  const jar = await cookies();
  try {
    const parsed = JSON.parse(jar.get(NAME)?.value ?? "{}") as Partial<Stored>;
    return { p: Array.isArray(parsed.p) ? parsed.p : [], c: Array.isArray(parsed.c) ? parsed.c : [] };
  } catch {
    return { p: [], c: [] };
  }
}

export async function addPreviewDeleted(kind: "project" | "client", id: string) {
  const stored = await read();
  const list = kind === "project" ? stored.p : stored.c;
  if (!list.includes(id)) list.push(id);
  const jar = await cookies();
  jar.set(NAME, JSON.stringify(stored), { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
}

/** Hidden ids. A deleted client takes its projects with it. */
export async function getPreviewDeleted() {
  const stored = await read();
  const clients = new Set(stored.c);
  const projects = new Set(stored.p);
  for (const project of fixtureProjects) {
    if (clients.has(project.clientId)) projects.add(project.id);
  }
  return { projects, clients };
}
