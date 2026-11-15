import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "dark" | "outline";

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      className={cn("button", `button-${variant}`, className)}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  // API routes (downloads, exports) are plain anchors: Next must not prefetch them.
  if (href.startsWith("/api/")) {
    return (
      <a className={cn("button", `button-${variant}`, className)} href={href}>
        {children}
      </a>
    );
  }
  return (
    <Link className={cn("button", `button-${variant}`, className)} href={href}>
      {children}
    </Link>
  );
}
