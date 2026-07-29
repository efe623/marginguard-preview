"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
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
        friendlyName: "MarginGuard authenticator"
      });
      if (enrollError || !enrolled?.totp) {
        setError("Authenticator setup could not be started.");
        return;
      }
      setFactorId(enrolled.id);
      setEnrollment({
        factorId: enrolled.id,
        qrCode: enrolled.totp.qr_code,
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
      <div className="card w-full max-w-2xl p-9">
        <p className="eyebrow">Save once</p>
        <h1 className="font-display mt-4 text-5xl font-bold">Recovery codes</h1>
        <p className="quiet mt-4 leading-7">
          Store these somewhere safe. MarginGuard only stores protected digests and cannot show them again.
        </p>
        <pre className="mt-7 grid grid-cols-2 gap-3 border border-[var(--line)] bg-[var(--paper-deep)] p-6 font-mono text-sm">
          {recoveryCodes.map((recoveryCode) => <span key={recoveryCode}>{recoveryCode}</span>)}
        </pre>
        <button className="button button-primary mt-7 w-full" onClick={() => window.location.assign(next)}>
          I saved the codes
        </button>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-lg p-9">
      <p className="eyebrow">{enrollment ? "Set up second factor" : "Second factor"}</p>
      <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">
        {enrollment ? "Scan, then verify." : "Enter your authenticator code."}
      </h1>
      {enrollment ? (
        <div className="mt-7">
          <Image
            className="mx-auto border border-[var(--line)]"
            alt="Authenticator QR code"
            src={enrollment.qrCode}
            width={220}
            height={220}
            unoptimized
          />
          <p className="quiet mt-4 break-all text-center font-mono text-xs">{enrollment.secret}</p>
        </div>
      ) : (
        <p className="quiet mt-4 leading-7">
          Use the six-digit code from Google Authenticator or another TOTP app.
        </p>
      )}
      <label className="mt-8 block">
        <span className="field-label">Six-digit code</span>
        <input
          className="input text-center text-2xl tracking-[0.5em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        />
      </label>
      {error ? <p role="alert" className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <button
        className="button button-primary mt-5 w-full"
        type="button"
        disabled={pending || code.length !== 6 || (isSupabaseConfigured && !factorId)}
        onClick={verify}
      >
        {pending ? "Verifying…" : "Verify code"}
      </button>
    </div>
  );
}
