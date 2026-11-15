"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const FIELD = "input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]):not([disabled]), textarea:not([disabled]), select:not([disabled])";

/**
 * Empty-state buttons link to the page where the thing is created, with
 * `?focus=first` (or `?focus=<field id>`). On arrival this scrolls to that form,
 * highlights it briefly and puts the cursor in the field, so the person never
 * has to look for where to start. The parameter is removed afterwards so a
 * refresh or the back button does not repeat it.
 */
export function ArrivalFocus() {
  const pathname = usePathname();
  const params = useSearchParams();
  const target = params.get("focus");

  useEffect(() => {
    if (!target) return;
    let tries = 0;
    let timer = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";

    const run = () => {
      const byId = target === "first" ? null : document.getElementById(target);
      const form = target === "first" ? document.querySelector<HTMLElement>("main form") : (byId?.closest("form") ?? byId);
      if (!form) {
        if (tries++ < 24) timer = window.setTimeout(run, 50);
        return;
      }
      form.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      form.classList.remove("form-nudge");
      void form.offsetWidth;
      form.classList.add("form-nudge");
      const field = byId && byId.matches(FIELD) ? byId : form.querySelector<HTMLElement>(FIELD);
      timer = window.setTimeout(() => {
        field?.focus({ preventScroll: true });
        const url = new URL(window.location.href);
        url.searchParams.delete("focus");
        window.history.replaceState(window.history.state, "", url);
      }, reduced ? 0 : 380);
    };

    run();
    return () => window.clearTimeout(timer);
  }, [pathname, target]);

  return null;
}
