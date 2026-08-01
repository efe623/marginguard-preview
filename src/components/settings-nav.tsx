"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SettingsTransitionLink } from "@/components/settings-transition-link";

const items = [
  ["business", "Business", "/settings/business"],
  ["quotes", "Quote templates", "/settings/quotes"],
  ["ai", "AI", "/settings/ai"],
  ["members", "Members", "/settings/members"],
  ["security", "Security", "/settings/security"],
  ["connections", "Connections", "/settings/connections"],
  ["support", "Support access", "/settings/support"],
  ["deletion", "Deletion", "/settings/deletion"]
] as const;

export function SettingsNav({ active }: { active: string }) {
  const router = useRouter();

  useEffect(() => {
    items.forEach(([, , href]) => router.prefetch(href));
  }, [router]);

  return (
    <nav className="settings-subnav" aria-label="Settings sections">
      {items.map(([key, label, href]) => (
        <SettingsTransitionLink
          key={key}
          href={href}
          className={active === key ? "settings-subnav-link is-active" : "settings-subnav-link"}
        >
          {label}
        </SettingsTransitionLink>
      ))}
    </nav>
  );
}
