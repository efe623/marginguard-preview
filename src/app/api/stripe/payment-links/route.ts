import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerAal2 } from "@/features/auth/authorization";
import { isSupabaseConfigured } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe";

const schema = z.object({ paymentRequestId: z.uuid() });

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ preview: true, url: "https://buy.stripe.com/test_preview" });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const owner = await getOwnerAal2();
  if (!owner) return NextResponse.json({ error: "Owner MFA is required" }, { status: 403 });

  const { data: paymentRequest } = await owner.supabase
    .from("payment_requests")
    .select("id, business_id, change_order_version_id, kind, amount_minor, currency, status, stripe_payment_link_url")
    .eq("id", parsed.data.paymentRequestId)
    .maybeSingle();
  if (!paymentRequest || paymentRequest.business_id !== owner.membership.business_id) {
    return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  }
  if (paymentRequest.status === "link_created" && paymentRequest.stripe_payment_link_url) {
    return NextResponse.json({ url: paymentRequest.stripe_payment_link_url, reused: true });
  }
  if (paymentRequest.status !== "pending") {
    return NextResponse.json({ error: "Payment request is not payable" }, { status: 409 });
  }

  const { data: connection } = await owner.supabase
    .from("stripe_connections")
    .select("stripe_account_id, charges_enabled")
    .eq("business_id", paymentRequest.business_id)
    .is("disconnected_at", null)
    .maybeSingle();
  if (!connection?.charges_enabled) {
    return NextResponse.json(
      {
        error:
          "Stripe is not connected. The approved order remains recorded; confirm an external payment manually when it arrives."
      },
      { status: 409 }
    );
  }

  const { data: version } = await owner.supabase
    .from("change_order_versions")
    .select("order_number, snapshot")
    .eq("id", paymentRequest.change_order_version_id)
    .single();
  if (!version) return NextResponse.json({ error: "Change Order not found" }, { status: 404 });
  const snapshot = version.snapshot as { title?: string };
  const name = `UnitPulse CO-${String(version.order_number).padStart(3, "0")} ${paymentRequest.kind}`;
  const stripe = createStripeClient();
  try {
    const price = await stripe.prices.create(
      {
        currency: paymentRequest.currency.toLowerCase(),
        unit_amount: Number(paymentRequest.amount_minor),
        product_data: {
          name: snapshot.title ? `${name}: ${snapshot.title.slice(0, 240)}` : name
        },
        metadata: { payment_request_id: paymentRequest.id }
      },
      {
        stripeAccount: connection.stripe_account_id,
        idempotencyKey: `mg-price-${paymentRequest.id}`
      }
    );
    const link = await stripe.paymentLinks.create(
      {
        line_items: [{ price: price.id, quantity: 1 }],
        restrictions: { completed_sessions: { limit: 1 } },
        submit_type: "pay",
        metadata: {
          payment_request_id: paymentRequest.id,
          business_id: paymentRequest.business_id,
          change_order_version_id: paymentRequest.change_order_version_id,
          expected_amount_minor: String(paymentRequest.amount_minor),
          expected_currency: paymentRequest.currency
        },
        payment_intent_data: {
          metadata: { payment_request_id: paymentRequest.id }
        }
      },
      {
        stripeAccount: connection.stripe_account_id,
        idempotencyKey: `mg-link-${paymentRequest.id}`
      }
    );
    const { error } = await owner.supabase
      .from("payment_requests")
      .update({
        stripe_payment_link_id: link.id,
        stripe_payment_link_url: link.url,
        status: "link_created"
      })
      .eq("id", paymentRequest.id)
      .eq("status", "pending");
    if (error) throw error;
    return NextResponse.json({ url: link.url });
  } catch {
    return NextResponse.json({ error: "Stripe link creation failed" }, { status: 502 });
  }
}
