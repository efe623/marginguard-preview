"use client";

import { useRef } from "react";

/**
 * Empty states often say "add the first one below". This button does it for
 * the user: it scrolls to the next form on the page, highlights it briefly,
 * and puts the cursor in its first field, so the first step is one click.
 */
export function FocusFormButton({ label, variant = "primary" }: { label: string; variant?: "primary" | "outline" }) {
  const ref = useRef<HTMLButtonElement>(null);

  function go() {
    const button = ref.current;
    if (!button) return;
    const forms = Array.from(document.querySelectorAll<HTMLFormElement>("main form:not(.status-select)"));
    const target = forms.find((form) => button.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING) ?? forms[forms.length - 1];
    if (!target) return;
    target.closest("details")?.setAttribute("open", "");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    target.classList.remove("form-nudge");
    void target.offsetWidth;
    target.classList.add("form-nudge");
    const field = target.querySelector<HTMLElement>("input:not([type=hidden]):not([type=file]):not([type=checkbox]), textarea, select");
    window.setTimeout(() => field?.focus({ preventScroll: true }), reduced ? 0 : 380);
  }

  return (
    <button ref={ref} type="button" className={`button button-${variant}`} onClick={go}>
      {label}
    </button>
  );
}
