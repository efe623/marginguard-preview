// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  digestOpaqueToken,
  generateRecoveryCodes,
  keyedDigest,
  safeDigestEqual,
  signClientSession,
  verifyClientSession
} from "@/lib/security-tokens";

describe("security tokens", () => {
  it("does not store opaque tokens directly", () => {
    expect(digestOpaqueToken("secret-token")).not.toContain("secret-token");
  });

  it("compares keyed digests safely", () => {
    const digest = keyedDigest("123456", "pepper");
    expect(safeDigestEqual(digest, keyedDigest("123456", "pepper"))).toBe(true);
    expect(safeDigestEqual(digest, keyedDigest("654321", "pepper"))).toBe(false);
  });

  it("signs and verifies a client session", () => {
    const expiry = Math.floor(Date.now() / 1000) + 60;
    const session = signClientSession("token-id", expiry, "secret");
    expect(verifyClientSession(session, "secret")).toEqual({
      tokenId: "token-id",
      expiresAt: expiry
    });
    expect(verifyClientSession(session, "wrong")).toBeNull();
  });

  it("generates distinct printable recovery codes", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    expect(codes[0]).toMatch(/^[A-F0-9]{5}(-[A-F0-9]{5}){3}$/);
  });
});
