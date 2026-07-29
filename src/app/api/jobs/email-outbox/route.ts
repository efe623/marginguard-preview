import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character] ?? character);
}

function renderEmail(template: string, payload: Record<string, unknown>) {
  if (template === "client_approval_otp") {
    const code = escapeHtml(String(payload.code ?? ""));
    return {
      subject: "Your MarginGuard verification code",
      html: `<h1>Verification code</h1><p style="font-size:28px;letter-spacing:8px"><strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`
    };
  }
  if (template === "change_order_approval") {
    const order = escapeHtml(String(payload.order_number ?? ""));
    const url = escapeHtml(String(payload.approval_url ?? ""));
    return {
      subject: `Change Order CO-${String(order).padStart(3, "0")} needs your decision`,
      html: `<h1>Review Change Order CO-${order}</h1><p>Verify your email, review the exact version, and record your decision.</p><p><a href="${url}">Open protected Change Order</a></p>`
    };
  }
  return null;
}

export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 });
  }
  const admin = createAdminClient();
  const { data: messages, error } = await admin
    .from("notification_outbox")
    .select("id, recipient_email, template, payload, attempt_count")
    .is("sent_at", null)
    .is("failed_at", null)
    .lte("next_attempt_at", new Date().toISOString())
    .order("id")
    .limit(10);
  if (error) return NextResponse.json({ error: "Outbox unavailable" }, { status: 503 });

  let sent = 0;
  for (const message of messages ?? []) {
    const rendered = renderEmail(message.template, message.payload as Record<string, unknown>);
    if (!rendered) {
      await admin.from("notification_outbox").update({ failed_at: new Date().toISOString() }).eq("id", message.id);
      continue;
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [message.recipient_email],
        subject: rendered.subject,
        html: rendered.html
      })
    });
    if (response.ok) {
      sent += 1;
      await admin
        .from("notification_outbox")
        .update({ sent_at: new Date().toISOString(), attempt_count: message.attempt_count + 1 })
        .eq("id", message.id)
        .is("sent_at", null);
    } else {
      const attempts = message.attempt_count + 1;
      await admin
        .from("notification_outbox")
        .update({
          attempt_count: attempts,
          next_attempt_at: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000).toISOString(),
          failed_at: attempts >= 5 ? new Date().toISOString() : null
        })
        .eq("id", message.id);
    }
  }
  return NextResponse.json({ processed: messages?.length ?? 0, sent });
}
