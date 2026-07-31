import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ONE_TIME_TOKEN = "9d4f1b9c7e2a6d8f3c5b0a1e4f7d9c2b6a8e3f5d1c7b9a4e2f6d8c0b3a5e7f1d";

export async function POST(request: Request) {
  if (request.headers.get("x-unitpulse-reset") !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_events").delete().not("id", "is", null);
  const { error: businessError } = await admin.from("businesses").delete().not("id", "is", null);
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 });

  const results = await Promise.all(data.users.map((user) => admin.auth.admin.deleteUser(user.id)));
  const failed = results.filter((result) => result.error).length;
  return NextResponse.json({ deletedUsers: data.users.length - failed, failed });
}
