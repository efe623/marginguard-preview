import { cn } from "@/lib/cn";

export function Status({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  return <span className={cn("status", `status-${tone}`)}>{children}</span>;
}
