"use client";

import { useState } from "react";
import Link from "next/link";

export function SettingsTransitionLink({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  return (
    <>
      <Link href={href} prefetch className={className} onClick={() => setPending(true)}>
        {children}
      </Link>
      {pending ? (
        <div className="settings-route-loader" role="status" aria-label="Loading settings">
          <div className="settings-route-loader-bar" />
        </div>
      ) : null}
    </>
  );
}
