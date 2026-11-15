"use client";

import { IconMoon, IconSun } from "@/components/icons";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(listener: () => void) {
  window.addEventListener("unitpulse-theme-change", listener);
  return () => window.removeEventListener("unitpulse-theme-change", listener);
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getCurrentTheme, () => "dark" as Theme);

  function chooseTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      localStorage.setItem("unitpulse-theme", nextTheme);
    } catch {}
    window.dispatchEvent(new Event("unitpulse-theme-change"));
  }

  if (compact) {
    const next: Theme = theme === "dark" ? "light" : "dark";
    return (
      <button type="button" className="icon-button theme-compact" aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`} onClick={() => chooseTheme(next)}>
        {theme === "dark" ? <IconSun size={19} /> : <IconMoon size={19} />}
      </button>
    );
  }

  return (
    <div className="theme-switch" role="group" aria-label="Color theme">
      <button type="button" title="Light theme" aria-pressed={theme === "light"} onClick={() => chooseTheme("light")}>
        <IconSun size={17} /> <span>Light</span>
      </button>
      <button type="button" title="Dark theme" aria-pressed={theme === "dark"} onClick={() => chooseTheme("dark")}>
        <IconMoon size={17} /> <span>Dark</span>
      </button>
    </div>
  );
}
