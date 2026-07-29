import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";

export function createStripeClient() {
  const secret = getServerEnv().STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe is not configured.");
  return new Stripe(secret, {
    maxNetworkRetries: 2,
    timeout: 20_000
  });
}
