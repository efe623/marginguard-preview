"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { AuthNotice, AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function MfaPanel({ next = "/dashboard" }: { next?: string }) {
  const [factorId, setFactorId] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp.find((factor) => factor.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        return;
      }
      for (const factor of data?.totp ?? []) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "UnitPulse authenticator"
      });
      if (enrollError || !enrolled?.totp) {
        setError("Authenticator setup could not be started.");
        return;
      }
      const authenticatorUri = `otpauth://totp/${encodeURIComponent("UnitPulse")}?secret=${encodeURIComponent(enrolled.totp.secret)}&issuer=${encodeURIComponent("UnitPulse")}&algorithm=SHA1&digits=6&period=30`;
      const brandedQrCode = await QRCode.toDataURL(authenticatorUri, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 440
      });
      setFactorId(enrolled.id);
      setEnrollment({
        factorId: enrolled.id,
        qrCode: brandedQrCode,
        secret: enrolled.totp.secret
      });
    })();
  }, []);

  function verify() {
    startTransition(async () => {
      if (!isSupabaseConfigured) {
        window.location.assign(next);
        return;
      }
      setError("");
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code
      });
      if (verifyError) {
        setError("That authenticator code is invalid.");
        return;
      }
      if (enrollment) {
        const response = await fetch("/api/auth/recovery-codes", { method: "POST" });
        if (response.ok) {
          const result = (await response.json()) as { codes: string[] };
          setRecoveryCodes(result.codes);
          return;
        }
      }
      window.location.assign(next);
    });
  }

  if (recoveryCodes.length) {
    return (
      <AuthShell
        icon={<KeyRound size={24} />}
        title="Save your recovery codes"
        description="Store these somewhere safe. UnitPulse only stores protected digests and cannot show them again."
      >
        <ul className="m-0 grid list-none grid-cols-2 gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface-2)] p-4 font-mono text-sm">
          {recoveryCodes.map((recoveryCode) => <li key={recoveryCode}>{recoveryCode}</li>)}
        </ul>
        <button className="auth-button auth-button-primary w-full" onClick={() => window.location.assign(next)}>
          I saved the codes
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={<ShieldCheck size={24} />}
      title={enrollment ? "Scan, then verify" : "Enter your authenticator code"}
      description={enrollment ? "Scan the QR code with an authenticator app, then enter the six-digit code it shows." : "Use the six-digit code from Google Authenticator or another TOTP app."}
      footer={<Link href="/recovery" className={authLinkClass}>Use a recovery code</Link>}
    >
      {enrollment ? (
        <div className="grid justify-items-center gap-3">
          <Image
            className="rounded-[var(--radius-sm)] border border-[var(--line)]"
            alt="Authenticator QR code"
            src={enrollment.qrCode}
            width={200}
            height={200}
            unoptimized
          />
          <p className="hint text-center">Can’t scan? Enter this key instead:</p>
          <p className="break-all text-center font-mono text-xs">{enrollment.secret}</p>
        </div>
      ) : null}
      <div className="field">
        <label className="field-label" htmlFor="mfa-code">Six-digit code</label>
        <input
          id="mfa-code"
          className="auth-input text-center text-xl tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          aria-invalid={error ? true : undefined}
        />
      </div>
      {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}
      <button
        className="auth-button auth-button-primary w-full"
        type="button"
        disabled={pending || code.length !== 6 || (isSupabaseConfigured && !factorId)}
        onClick={verify}
      >
        {pending ? "Verifying…" : "Verify code"}
      </button>
    </AuthShell>
  );
}
