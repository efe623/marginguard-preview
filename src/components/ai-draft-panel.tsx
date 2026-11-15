"use client";

import { FileUp, Info, Sparkles } from "lucide-react";
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
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">New draft</h2>
          <p className="panel-sub">Analyse client text with Gemini without taking action.</p>
        </div>
      </div>
      <div className="panel-body stack">
      <div className="field">
          <label className="field-label" htmlFor="ai-workflow">Workflow</label>
          <select id="ai-workflow" className="select" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            {workflows.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
      </div>
      <p className="notice notice-info">
        <Info size={18} aria-hidden="true" />
        <span>AI output is always a draft. UnitPulse never sends, approves, prices, or confirms payment automatically.</span>
      </p>
      <div className="field">
        <label className="field-label" htmlFor="ai-source">Quote, email, WhatsApp chat, or instructions</label>
        <textarea
          id="ai-source"
          className="textarea min-h-48"
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder="Paste the client text or quote you want analysed…"
        />
      </div>
      <div className="cluster">
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
          className="button button-outline"
          type="button"
          disabled={pending}
          onClick={() => wordInput.current?.click()}
        >
          <FileUp size={16} aria-hidden="true" /> Import Word quote
        </button>
        <p className="hint">
          DOCX only, up to 5 MB. Text is extracted before AI consent.
        </p>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          I confirm I am allowed to send this text to Google Gemini. I understand the free tier may use submitted content to improve Google products.
        </span>
      </label>
      <div className="form-actions">
      <button
        className="button button-primary"
        type="button"
        disabled={pending || !consent || sourceText.trim().length < 10}
        onClick={generate}
      >
        <Sparkles size={16} aria-hidden="true" /> {pending ? "Creating draft…" : "Create AI draft"}
      </button>
      </div>
      {message ? <p className="text-sm" role="status">{message}</p> : null}
      </div>
    </section>
  );
}
