import "server-only";

import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import {
  createOpaqueToken,
  signClientSession,
  verifyClientSession
} from "@/lib/security-tokens";

export const ownerSetupFlowCookie = "unitpulse_owner_setup_flow";
const ownerSetupFlowSeconds = 10 * 60;

export async function beginOwnerSetupFlow() {
  const secret = getServerEnv().OWNER_SETUP_SECRET;
  if (!secret) return false;

  const expiresAt = Math.floor(Date.now() / 1000) + ownerSetupFlowSeconds;
  const value = signClientSession(createOpaqueToken(18), expiresAt, secret);
  (await cookies()).set(ownerSetupFlowCookie, value, {
    httpOnly: true,
    maxAge: ownerSetupFlowSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return true;
}

export async function hasOwnerSetupFlow() {
  const secret = getServerEnv().OWNER_SETUP_SECRET;
  const value = (await cookies()).get(ownerSetupFlowCookie)?.value;
  return Boolean(secret && value && verifyClientSession(value, secret));
}

export async function clearOwnerSetupFlow() {
  (await cookies()).delete(ownerSetupFlowCookie);
}
