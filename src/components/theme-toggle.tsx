"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(listener: () => void) {
  window.addEventListener("unitpulse-theme-change", listener);
  return () => window.removeEventListener("unitpulse-theme-change", listener);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getCurrentTheme, () => "light");

  function chooseTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("unitpulse-theme", nextTheme);
    window.dispatchEvent(new Event("unitpulse-theme-change"));
  }

  return (
    <div className="theme-switch" aria-label="Color theme">
      <button
        type="button"
        aria-label="Use light theme"
        aria-pressed={theme === "light"}
        onClick={() => chooseTheme("light")}
      >
        <Sun size={15} />
      </button>
      <span aria-hidden="true" className="theme-pulse" />
      <button
        type="button"
        aria-label="Use dark theme"
        aria-pressed={theme === "dark"}
        onClick={() => chooseTheme("dark")}
      >
        <Moon size={15} />
      </button>
    </div>
  );
}
