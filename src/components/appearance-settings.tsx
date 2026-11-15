"use client";

import { useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "@/components/icons";

type Choice = { value: string; label: string; hint: string };
type Pref = {
  key: "theme" | "density" | "text" | "motion" | "sidebar";
  title: string;
  description: string;
  fallback: string;
  choices: Choice[];
};

const prefs: Pref[] = [
  {
    key: "theme",
    title: "Theme",
    description: "Dark is easier on the eyes in a dim room. Light suits bright offices.",
    fallback: "dark",
    choices: [
      { value: "dark", label: "Dark", hint: "Charcoal surfaces" },
      { value: "light", label: "Light", hint: "Warm paper surfaces" }
    ]
  },
  {
    key: "density",
    title: "Density",
    description: "Compact fits more rows on screen. Comfortable gives each row more room.",
    fallback: "comfortable",
    choices: [
      { value: "comfortable", label: "Comfortable", hint: "Roomy rows and tables" },
      { value: "compact", label: "Compact", hint: "More on each screen" }
    ]
  },
  {
    key: "text",
    title: "Text size",
    description: "Scales every label, row and number in the app.",
    fallback: "default",
    choices: [
      { value: "default", label: "Default", hint: "Standard size" },
      { value: "large", label: "Large", hint: "About 12% bigger" }
    ]
  },
  {
    key: "motion",
    title: "Motion",
    description: "Reduced motion turns off page fades, hover lifts and sliding panels.",
    fallback: "full",
    choices: [
      { value: "full", label: "Full", hint: "Animations on" },
      { value: "reduced", label: "Reduced", hint: "Nothing moves" }
    ]
  },
  {
    key: "sidebar",
    title: "Sidebar",
    description: "Collapse it to an icon rail for more room. You can also toggle it from the sidebar itself.",
    fallback: "open",
    choices: [
      { value: "open", label: "Expanded", hint: "Icons and names" },
      { value: "collapsed", label: "Collapsed", hint: "Icons only" }
    ]
  }
];

const EVENT = "unitpulse-prefs-change";

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("unitpulse-sidebar-change", listener);
  window.addEventListener("unitpulse-theme-change", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("unitpulse-sidebar-change", listener);
    window.removeEventListener("unitpulse-theme-change", listener);
  };
}

function read(pref: Pref): string {
  try {
    const stored = localStorage.getItem(`unitpulse-${pref.key}`);
    if (stored && pref.choices.some((choice) => choice.value === stored)) return stored;
  } catch {}
  return pref.fallback;
}

function write(pref: Pref, value: string) {
  try {
    localStorage.setItem(`unitpulse-${pref.key}`, value);
  } catch {}
  const root = document.documentElement;
  if (pref.key === "theme") {
    root.dataset.theme = value;
    root.style.colorScheme = value;
    window.dispatchEvent(new Event("unitpulse-theme-change"));
  } else if (pref.key === "sidebar") {
    window.dispatchEvent(new Event("unitpulse-sidebar-change"));
  } else {
    root.dataset[pref.key] = value;
  }
  window.dispatchEvent(new Event(EVENT));
}

function PrefGroup({ pref }: { pref: Pref }) {
  const value = useSyncExternalStore(subscribe, () => read(pref), () => pref.fallback);
  return (
    <section className="panel" aria-labelledby={`pref-${pref.key}`}>
      <div className="panel-head">
        <div>
          <h2 className="panel-title" id={`pref-${pref.key}`}>{pref.title}</h2>
          <p className="panel-sub">{pref.description}</p>
        </div>
      </div>
      <div className="panel-body">
        <div className="options" role="radiogroup" aria-labelledby={`pref-${pref.key}`}>
          {pref.choices.map((choice) => {
            const selected = value === choice.value;
            return (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className="option"
                onClick={() => write(pref, choice.value)}
              >
                {pref.key === "theme" ? (
                  <span className={`option-swatch option-swatch-${choice.value}`} aria-hidden>
                    <i /><i /><i />
                    {choice.value === "dark" ? <IconMoon size={16} /> : <IconSun size={16} />}
                  </span>
                ) : null}
                <span className="option-label">{choice.label}</span>
                <span className="option-hint">{choice.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AppearanceSettings() {
  return (
    <div className="stack mt-6">
      {prefs.map((pref) => <PrefGroup key={pref.key} pref={pref} />)}
    </div>
  );
}
