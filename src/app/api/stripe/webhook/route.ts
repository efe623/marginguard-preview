import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function isCheckoutEvent(
  event: Stripe.Event
): event is Stripe.Event & { data: { object: Stripe.Checkout.Session } } {
  return [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed"
  ].includes(event.type);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const env = getServerEnv();
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = createStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const accountId = event.account;
  if (!accountId) {
    return NextResponse.json({ error: "Connected account is required" }, { status: 400 });
  }
  const { error: insertError } = await admin.from("stripe_events").insert({
    stripe_event_id: event.id,
    stripe_account_id: accountId,
    event_type: event.type,
    payload: JSON.parse(rawBody)
  });
  if (insertError && insertError.code !== "23505") {
    return NextResponse.json({ error: "Event could not be recorded" }, { status: 503 });
  }
  if (insertError?.code === "23505") {
    const { data: existing } = await admin
      .from("stripe_events")
      .select("processed_at")
      .eq("stripe_event_id", event.id)
      .single();
    if (existing?.processed_at) return NextResponse.json({ received: true, duplicate: true });
  }
  if (!isCheckoutEvent(event)) {
    await admin
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const requestId = session.metadata?.payment_request_id;
  const paymentLinkId =
    typeof session.payment_link === "string" ? session.payment_link : session.payment_link?.id;
  const { data: paymentRequest } = requestId
    ? await admin
        .from("payment_requests")
        .select("id, business_id, change_order_version_id, kind, amount_minor, currency, status, stripe_payment_link_id")
        .eq("id", requestId)
        .maybeSingle()
    : { data: null };
  const { data: connection } = paymentRequest
    ? await admin
        .from("stripe_connections")
        .select("stripe_account_id")
        .eq("business_id", paymentRequest.business_id)
        .is("disconnected_at", null)
        .maybeSingle()
    : { data: null };

  const matches =
    paymentRequest &&
    connection?.stripe_account_id === accountId &&
    paymentRequest.stripe_payment_link_id === paymentLinkId &&
    Number(paymentRequest.amount_minor) === session.amount_total &&
    paymentRequest.currency.toLowerCase() === session.currency?.toLowerCase();
  if (!matches) {
    await admin
      .from("stripe_events")
      .update({
        processing_error: "Account, Payment Link, amount, or currency mismatch.",
        processed_at: new Date().toISOString()
      })
      .eq("stripe_event_id", event.id);
    return NextResponse.json({ received: true, matched: false });
  }

  if (event.type === "checkout.session.async_payment_failed") {
    await admin.from("payment_requests").update({ status: "failed" }).eq("id", paymentRequest.id);
  } else if (
    event.type === "checkout.session.async_payment_succeeded" ||
    session.payment_status === "paid"
  ) {
    const confirmedAt = new Date().toISOString();
    await admin
      .from("payment_requests")
      .update({ status: "confirmed", confirmed_at: confirmedAt })
      .eq("id", paymentRequest.id)
      .neq("status", "confirmed");

    const { data: version } = await admin
      .from("change_order_versions")
      .select("project_id")
      .eq("id", paymentRequest.change_order_version_id)
      .single();
    const nextStatus = paymentRequest.kind === "deposit" ? "authorized" : "paid";
    await admin
      .from("change_order_versions")
      .update({ status: nextStatus })
      .eq("id", paymentRequest.change_order_version_id);
    if (version && paymentRequest.kind === "deposit") {
      await admin.from("projects").update({ status: "authorized" }).eq("id", version.project_id);
    }
  } else {
    await admin.from("payment_requests").update({ status: "processing" }).eq("id", paymentRequest.id);
  }

  await admin
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString(), processing_error: null })
    .eq("stripe_event_id", event.id);
  return NextResponse.json({ received: true });
}
