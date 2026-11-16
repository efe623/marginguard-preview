import { cn } from "@/lib/cn";

export function Status({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const label = typeof children === "string" ? children.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()) : children;
  return <span className={cn("status", `status-${tone}`)}>{label}</span>;
}
