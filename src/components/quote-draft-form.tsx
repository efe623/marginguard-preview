"use client";

import { useState } from "react";
import { createQuote } from "@/features/operations/actions";

type QuoteTemplate = {
  id: string;
  name: string;
  title: string;
  introduction: string;
  terms: string;
  default_valid_days: number;
};

function addDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

export function QuoteDraftForm({
  projectId,
  currency,
  templates
}: {
  projectId: string;
  currency: string;
  templates: QuoteTemplate[];
}) {
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [terms, setTerms] = useState("");
  const [validUntil, setValidUntil] = useState("");

  function chooseTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setTitle(template.title);
    setIntroduction(template.introduction);
    setTerms(template.terms);
    setValidUntil(addDays(template.default_valid_days));
  }

  return (
    <form action={createQuote} className="mt-5 space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="currency" value={currency} />
      <select
        className="input"
        name="templateId"
        value={templateId}
        onChange={(event) => chooseTemplate(event.target.value)}
      >
        <option value="">Start without a template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>{template.name}</option>
        ))}
      </select>
      <input
        className="input"
        name="title"
        placeholder="Proposal title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        className="input min-h-20"
        name="introduction"
        placeholder="Introduction"
        value={introduction}
        onChange={(event) => setIntroduction(event.target.value)}
      />
      <textarea
        className="input min-h-20"
        name="terms"
        placeholder="Terms and exclusions"
        value={terms}
        onChange={(event) => setTerms(event.target.value)}
      />
      <input className="input" name="amount" inputMode="decimal" placeholder="Quote amount" required />
      <input
        className="input"
        name="validUntil"
        type="date"
        value={validUntil}
        onChange={(event) => setValidUntil(event.target.value)}
      />
      <button className="button button-primary w-full" type="submit">Save quote draft</button>
    </form>
  );
}
