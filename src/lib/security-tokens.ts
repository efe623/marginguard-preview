import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual
} from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function digestOpaqueToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function keyedDigest(value: string, secret: string) {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function safeDigestEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function signClientSession(
  tokenId: string,
  expiresAtSeconds: number,
  secret: string
) {
  const payload = `${tokenId}.${expiresAtSeconds}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return Buffer.from(`${payload}.${signature}`, "utf8").toString("base64url");
}

export function verifyClientSession(value: string, secret: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const [tokenId, expiresAt, signature] = decoded.split(".");
    if (!tokenId || !expiresAt || !signature) return null;
    const expected = createHmac("sha256", secret)
      .update(`${tokenId}.${expiresAt}`)
      .digest("base64url");
    const valid =
      signature.length === expected.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid || Number(expiresAt) <= Math.floor(Date.now() / 1000)) return null;
    return { tokenId, expiresAt: Number(expiresAt) };
  } catch {
    return null;
  }
}

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(10).toString("hex").toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15)}`;
  });
}
