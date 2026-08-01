import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getOwnerAal2 } from "@/features/auth/authorization";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";
import { createOpaqueToken } from "@/lib/security-tokens";

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.redirect(
      new URL("/settings/connections?preview=connect", getServerEnv().NEXT_PUBLIC_APP_URL)
    );
  }
  const owner = await getOwnerAal2();
  if (!owner) {
    return NextResponse.redirect(
      new URL("/mfa?next=/settings/connections", getServerEnv().NEXT_PUBLIC_APP_URL)
    );
  }
  const env = getServerEnv();
  if (!env.STRIPE_CONNECT_CLIENT_ID) {
    return NextResponse.redirect(
      new URL("/settings/connections?error=Stripe%20Connect%20is%20not%20configured", env.NEXT_PUBLIC_APP_URL)
    );
  }

  const state = createOpaqueToken();
  const cookieStore = await cookies();
  cookieStore.set("mg_stripe_connect_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/stripe/callback",
    maxAge: 10 * 60
  });
  const authorize = new URL("https://connect.stripe.com/oauth/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", env.STRIPE_CONNECT_CLIENT_ID);
  authorize.searchParams.set("scope", "read_write");
  authorize.searchParams.set(
    "redirect_uri",
    `${env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`
  );
  authorize.searchParams.set("state", state);
  return NextResponse.redirect(authorize);
}
