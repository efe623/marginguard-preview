"use client";

import { FileUp, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const workflows = [
  ["scope_extraction", "Extract scope"],
  ["request_detection", "Detect requests"],
  ["scope_creep", "Check scope creep"],
  ["extra_work_estimate", "Estimate extra work"],
  ["change_order", "Draft change order"],
  ["payment_follow_up", "Draft payment follow-up"]
] as const;

export function AiDraftPanel({
  projectId,
  defaultSource = ""
}: {
  projectId: string;
  defaultSource?: string;
}) {
  const router = useRouter();
  const wordInput = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<(typeof workflows)[number][0]>("request_detection");
  const [sourceText, setSourceText] = useState(defaultSource);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function extractWord(file: File) {
    setPending(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("projectId", projectId);
      form.set("file", file);
      const response = await fetch("/api/ai/extract-docx", { method: "POST", body: form });
      const body = (await response.json()) as {
        error?: string;
        text?: string;
        truncated?: boolean;
      };
      if (!response.ok || !body.text) {
        throw new Error(body.error ?? "The Word document could not be read.");
      }
      setSourceText(body.text);
      setType("scope_extraction");
      setMessage(
        body.truncated
          ? "Word text loaded. Only the first 40,000 characters will be analysed."
          : "Word text loaded locally. Review it before sending it to Gemini."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Word import failed.");
    } finally {
      setPending(false);
      if (wordInput.current) wordInput.current.value = "";
    }
  }

  async function generate() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type,
          sourceText,
          sourceIds: [],
          consentConfirmed: consent
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "AI draft failed.");
      setMessage("Draft created. Review it below before accepting anything.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI draft failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center gap-3">
        <Sparkles className="signal" size={22} />
        <div>
          <p className="eyebrow">Gemini draft assistant</p>
          <h2 className="section-title mt-1">Analyse without taking action</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <label>
          <span className="field-label">Workflow</span>
          <select className="input" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            {workflows.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <div className="border border-[var(--line)] bg-[var(--paper-deep)] p-4 text-sm leading-6">
          AI output is always a draft. UnitPulse never sends, approves, prices, or confirms payment automatically.
        </div>
      </div>
      <label className="mt-5 block">
        <span className="field-label">Quote, email, WhatsApp chat, or instructions</span>
        <textarea
          className="input min-h-48 resize-y"
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder="Paste the client text or quote you want analysed…"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={wordInput}
          className="sr-only"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void extractWord(file);
          }}
        />
        <button
          className="button button-dark"
          type="button"
          disabled={pending}
          onClick={() => wordInput.current?.click()}
        >
          <FileUp size={16} /> Import Word quote
        </button>
        <p className="quiet text-xs">
          DOCX only, up to 5 MB. Text is extracted before AI consent.
        </p>
      </div>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6">
        <input
          className="mt-1"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          I confirm I am allowed to send this text to Google Gemini. I understand the free tier may use submitted content to improve Google products.
        </span>
      </label>
      <button
        className="button button-primary mt-5"
        type="button"
        disabled={pending || !consent || sourceText.trim().length < 10}
        onClick={generate}
      >
        <Sparkles size={16} /> {pending ? "Creating draft…" : "Create AI draft"}
      </button>
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
    </section>
  );
}
