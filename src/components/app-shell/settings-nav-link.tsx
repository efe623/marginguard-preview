"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function SettingsNavLink() {
  const pathname = usePathname();
  const active = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <Link
      href="/settings"
      className={cn("topbar-icon-button", active && "topbar-icon-button-active")}
      aria-label="Settings"
      aria-current={active ? "page" : undefined}
    >
      <Settings size={19} />
    </Link>
  );
}
