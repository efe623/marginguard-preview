"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(listener: () => void) {
  window.addEventListener("unitpulse-theme-change", listener);
  return () => window.removeEventListener("unitpulse-theme-change", listener);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getCurrentTheme, () => "dark" as Theme);

  function chooseTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      localStorage.setItem("unitpulse-theme", nextTheme);
    } catch {}
    window.dispatchEvent(new Event("unitpulse-theme-change"));
  }

  return (
    <div className="theme-switch" role="group" aria-label="Color theme">
      <button type="button" aria-pressed={theme === "light"} onClick={() => chooseTheme("light")}>
        <Sun size={16} /> Light
      </button>
      <button type="button" aria-pressed={theme === "dark"} onClick={() => chooseTheme("dark")}>
        <Moon size={16} /> Dark
      </button>
    </div>
  );
}
