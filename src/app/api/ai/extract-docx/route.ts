import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const projectSchema = z.uuid();
const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_DOCX_BYTES = 5 * 1024 * 1024;
const MAX_EXTRACTED_CHARACTERS = 40_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const projectId = projectSchema.safeParse(form?.get("projectId"));
  const file = form?.get("file");
  if (!projectId.success || !(file instanceof File)) {
    return NextResponse.json({ error: "Choose a Word document." }, { status: 400 });
  }
  if (
    file.size < 1 ||
    file.size > MAX_DOCX_BYTES ||
    file.type !== DOCX_TYPE ||
    !file.name.toLowerCase().endsWith(".docx")
  ) {
    return NextResponse.json(
      { error: "Use a DOCX file no larger than 5 MB." },
      { status: 415 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId.data)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project unavailable." }, { status: 404 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    return NextResponse.json({ error: "The file is not a valid DOCX archive." }, { status: 415 });
  }

  try {
    const extracted = await mammoth.extractRawText({ buffer: bytes });
    const completeText = extracted.value.trim();
    const text = completeText.slice(0, MAX_EXTRACTED_CHARACTERS);
    if (text.length < 10) {
      return NextResponse.json({ error: "No readable text was found." }, { status: 422 });
    }
    return NextResponse.json({
      text,
      truncated: completeText.length > MAX_EXTRACTED_CHARACTERS,
      warnings: extracted.messages.length
    });
  } catch {
    return NextResponse.json({ error: "The Word document could not be read." }, { status: 422 });
  }
}
