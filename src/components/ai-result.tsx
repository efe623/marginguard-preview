import Link from "next/link";
import { formatMoney } from "@/lib/money";

type Finding = { type?: string; title?: string; evidence?: string; recommendation?: string };
type Output = {
  summary?: string;
  suggestion?: string;
  confidence?: number;
  findings?: Finding[];
  deliverables?: string[];
  exclusions?: string[];
  limits?: string[];
  timeline?: string | null;
  priceEstimate?: { amount: number; currency: string; rationale?: string; assumptions?: string[] } | null;
  estimatedHours?: number | null;
  changeOrder?: { title: string; reason: string; description?: string; timelineImpact?: string; depositPercentage?: number } | null;
  followUp?: { subject: string; message: string; tone?: string } | null;
};

type Verdict = { label: string; tone: "success" | "warning" | "danger" | "neutral" };

function verdictFor(type: string, out: Output): Verdict {
  const findings = out.findings ?? [];
  const outside =
    Boolean(out.changeOrder) ||
    findings.some((f) => f.type === "request" || f.type === "risk") ||
    /outside|not (in|part of) the (agreed )?scope|extra work/i.test(out.summary ?? "");
  if (out.followUp) return { label: "Payment reminder ready", tone: "neutral" };
  if (type === "scope_extraction" || (out.deliverables?.length && !outside)) return { label: "Scope extracted", tone: "neutral" };
  if (outside) return { label: "Outside agreed scope", tone: "warning" };
  if (findings.some((f) => f.type === "scope_match")) return { label: "Inside agreed scope", tone: "success" };
  return { label: "Draft ready", tone: "neutral" };
}

function sureness(value: number) {
  if (value >= 0.8) return "Pulse is fairly sure";
  if (value >= 0.5) return "Pulse is unsure, check the evidence";
  return "Low confidence, treat as a guess";
}

/**
 * An AI draft shown as a decision, not as JSON: what Pulse concluded, why,
 * what it proposes, and the one thing to do next.
 */
export function AiResult({
  type,
  output,
  projectId,
  currency,
  children
}: {
  children?: React.ReactNode;
  type: string;
  output: Record<string, unknown>;
  projectId: string;
  currency: string;
}) {
  const out = output as Output;
  const verdict = verdictFor(type, out);
  const reasons = (out.findings ?? []).filter((f) => f.evidence || f.recommendation);
  const reason = out.changeOrder?.reason ?? reasons[0]?.recommendation ?? out.suggestion;
  const evidence = reasons[0]?.evidence;
  const price = out.priceEstimate ? formatMoney(Math.round(out.priceEstimate.amount * 100), out.priceEstimate.currency || currency) : null;
  const timeline = out.changeOrder?.timelineImpact ?? out.timeline ?? null;
  const proposal = [
    price ? { label: "Proposed price", value: price } : null,
    timeline ? { label: "Timeline", value: timeline } : null,
    out.estimatedHours ? { label: "Effort", value: `About ${out.estimatedHours} hours` } : null,
    out.changeOrder?.depositPercentage ? { label: "Deposit", value: `${out.changeOrder.depositPercentage}% before work starts` } : null
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const next =
    verdict.label === "Outside agreed scope"
      ? { href: `/projects/${projectId}/change-orders/new`, label: "Draft the change order" }
      : out.followUp
        ? { href: `/projects/${projectId}/messages`, label: "Open the conversation" }
        : verdict.label === "Scope extracted"
          ? { href: `/projects/${projectId}/scope/edit`, label: "Review the scope" }
          : null;

  return (
    <div className="ai-result">
      <p className={`ai-verdict status-${verdict.tone}`}>{verdict.label}</p>
      {out.summary ? <p className="ai-summary">{out.summary}</p> : null}

      {reason || evidence ? (
        <div className="ai-why">
          <p className="ai-label">Why</p>
          {evidence ? <blockquote className="ai-evidence">“{evidence}”</blockquote> : null}
          {reason ? <p>{reason}</p> : null}
        </div>
      ) : null}

      {proposal.length ? (
        <dl className="ai-proposal">
          {proposal.map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
      ) : null}

      {out.deliverables?.length ? (
        <div className="ai-list"><p className="ai-label">Deliverables</p><ul>{out.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>
      ) : null}
      {out.exclusions?.length ? (
        <div className="ai-list"><p className="ai-label">Not included</p><ul>{out.exclusions.map((item) => <li key={item}>{item}</li>)}</ul></div>
      ) : null}

      {out.followUp ? (
        <div className="ai-why">
          <p className="ai-label">Draft message: {out.followUp.subject}</p>
          <p className="whitespace-pre-wrap">{out.followUp.message}</p>
        </div>
      ) : null}

      {typeof out.confidence === "number" ? (
        <p className="ai-confidence">{sureness(out.confidence)} ({Math.round(out.confidence * 100)}%). Nothing is sent or priced until you do it.</p>
      ) : null}

      {next || children ? (
        <div className="ai-actions">
          {next ? <Link href={next.href} className="button button-primary">{next.label}</Link> : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
