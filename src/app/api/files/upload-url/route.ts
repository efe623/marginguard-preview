import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain"
]);
const allowedExtensions = new Set(["pdf", "docx", "jpg", "jpeg", "png", "webp", "txt"]);
const schema = z.object({
  projectId: z.uuid(),
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(160),
  size: z.number().int().min(1).max(20 * 1024 * 1024)
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ preview: true });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  const extension = parsed.data.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedTypes.has(parsed.data.type) || !allowedExtensions.has(extension)) {
    return NextResponse.json(
      { error: "Use PDF, DOCX, JPG, PNG, WebP, or TXT files." },
      { status: 415 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { data: project } = await supabase
    .from("projects")
    .select("id, business_id")
    .eq("id", parsed.data.projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const safeName = parsed.data.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180);
  const fileId = randomUUID();
  const path = `${project.business_id}/${project.id}/${fileId}-${safeName}`;
  const { error: rowError } = await supabase
    .from("project_files")
    .insert({
      id: fileId,
      business_id: project.business_id,
      project_id: project.id,
      storage_path: path,
      original_name: parsed.data.name,
      content_type: parsed.data.type,
      size_bytes: parsed.data.size,
      uploaded_by: user.id
    });
  if (rowError) return NextResponse.json({ error: rowError.message }, { status: 403 });

  const { data: signed, error } = await supabase.storage
    .from("quarantine")
    .createSignedUploadUrl(path);
  if (error) {
    await supabase.from("project_files").update({ scan_status: "failed" }).eq("id", fileId);
    return NextResponse.json({ error: "Upload could not be prepared" }, { status: 503 });
  }
  return NextResponse.json({ fileId, path, token: signed.token });
}
