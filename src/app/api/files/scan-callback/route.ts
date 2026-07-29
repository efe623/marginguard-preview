import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  fileId: z.uuid(),
  status: z.enum(["clean", "rejected", "failed"]),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  detail: z.string().max(2000).optional()
});

export async function POST(request: Request) {
  const secret = getServerEnv().SCANNER_CALLBACK_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid scan result" }, { status: 400 });
  const admin = createAdminClient();
  const { data: file } = await admin
    .from("project_files")
    .select("id, storage_path, scan_status")
    .eq("id", parsed.data.fileId)
    .maybeSingle();
  if (!file || !["quarantined", "scanning"].includes(file.scan_status)) {
    return NextResponse.json({ error: "File is not awaiting a scan" }, { status: 409 });
  }

  if (parsed.data.status === "clean") {
    const { data: source, error: downloadError } = await admin.storage
      .from("quarantine")
      .download(file.storage_path);
    if (downloadError || !source) {
      return NextResponse.json({ error: "Quarantined file is missing" }, { status: 409 });
    }
    const { error: cleanError } = await admin.storage
      .from("clean-project-files")
      .upload(file.storage_path, source, { upsert: false });
    if (cleanError) return NextResponse.json({ error: "Clean copy failed" }, { status: 503 });
    await admin.storage.from("quarantine").remove([file.storage_path]);
  }

  const { error } = await admin
    .from("project_files")
    .update({
      scan_status: parsed.data.status,
      sha256: parsed.data.sha256 ?? null,
      scan_detail: parsed.data.detail ?? null,
      scanned_at: new Date().toISOString()
    })
    .eq("id", file.id);
  if (error) return NextResponse.json({ error: "Scan result could not be stored" }, { status: 503 });
  return NextResponse.json({ recorded: true });
}
