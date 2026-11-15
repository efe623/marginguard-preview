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
    <form action={createQuote} className="stack-sm">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="currency" value={currency} />
      <div className="field">
        <label className="field-label" htmlFor="quote-template">Template</label>
        <select
          id="quote-template"
          className="select"
          name="templateId"
          value={templateId}
          onChange={(event) => chooseTemplate(event.target.value)}
        >
          <option value="">Start without a template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>{template.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="quote-title">Proposal title</label>
        <input
          id="quote-title"
          className="input"
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="quote-introduction">Introduction</label>
        <textarea
          id="quote-introduction"
          className="textarea min-h-20"
          name="introduction"
          value={introduction}
          onChange={(event) => setIntroduction(event.target.value)}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="quote-terms">Terms and exclusions</label>
        <textarea
          id="quote-terms"
          className="textarea min-h-20"
          name="terms"
          value={terms}
          onChange={(event) => setTerms(event.target.value)}
        />
      </div>
      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor="quote-amount">Quote amount ({currency})</label>
          <input id="quote-amount" className="input num" name="amount" inputMode="decimal" required />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="quote-valid-until">Valid until</label>
          <input
            id="quote-valid-until"
            className="input"
            name="validUntil"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
          />
        </div>
      </div>
      <button className="button button-primary w-full" type="submit">Save quote draft</button>
    </form>
  );
}
