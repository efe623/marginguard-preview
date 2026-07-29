import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getOwnerAal2 } from "@/features/auth/authorization";
import { getServerEnv } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe";

export async function GET(request: Request) {
  const env = getServerEnv();
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("mg_stripe_connect_state")?.value;
  cookieStore.delete("mg_stripe_connect_state");
  if (!state || !expectedState || state !== expectedState || !code) {
    return NextResponse.redirect(
      new URL("/settings/stripe?error=Connection%20could%20not%20be%20verified", env.NEXT_PUBLIC_APP_URL)
    );
  }

  const owner = await getOwnerAal2();
  if (!owner) {
    return NextResponse.redirect(new URL("/mfa?next=/settings/stripe", env.NEXT_PUBLIC_APP_URL));
  }

  try {
    const stripe = createStripeClient();
    const result = await stripe.oauth.token({
      grant_type: "authorization_code",
      code
    });
    if (!result.stripe_user_id) throw new Error("Stripe account was not returned.");
    const account = await stripe.accounts.retrieve(result.stripe_user_id);
    const { error } = await owner.supabase.from("stripe_connections").upsert({
      business_id: owner.membership.business_id,
      stripe_account_id: result.stripe_user_id,
      connected_by: owner.user.id,
      charges_enabled: account.charges_enabled,
      disconnected_at: null,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    return NextResponse.redirect(new URL("/settings/stripe?connected=1", env.NEXT_PUBLIC_APP_URL));
  } catch {
    return NextResponse.redirect(
      new URL("/settings/stripe?error=Stripe%20connection%20failed", env.NEXT_PUBLIC_APP_URL)
    );
  }
}
