import { Info } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { updateBusinessAiSettings } from "@/features/operations/actions";
import { getBusinessSettingsData } from "@/features/operations/queries";

export default async function AiSettingsPage() {
  const business = await getBusinessSettingsData();
  const enabled = Boolean(business?.ai_enabled);
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[{ label: "Settings", href: "/settings" }, { label: "AI and privacy" }]}
        title="AI and privacy"
        description="Gemini is draft-only and can be disabled for the whole business or individual projects."
      />
      <SettingsNav active="ai" />
      <form action={updateBusinessAiSettings} className="panel mt-6">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Gemini draft assistant</h2>
            <p className="panel-sub">Model: gemini-3.5-flash-lite · daily free-plan cap: 20 drafts</p>
          </div>
          <Status tone={enabled ? "success" : "neutral"}>{enabled ? "Enabled" : "Disabled"}</Status>
        </div>
        <div className="panel-body stack">
          <div className="notice notice-info">
            <Info size={18} aria-hidden="true" />
            <p>
              The Gemini free tier may use submitted content to improve Google products. Staff must confirm consent for every draft. UnitPulse stores the structured output, model, source hash, reviewer, and audit event.
            </p>
          </div>
          <div className="stack-sm">
            <label className="check">
              <input name="aiEnabled" type="checkbox" defaultChecked={enabled} />
              <span>Enable Gemini draft tools</span>
            </label>
            <label className="check">
              <input name="acknowledged" type="checkbox" defaultChecked={Boolean(business?.ai_terms_acknowledged_at)} />
              <span>I understand the external processing and will only submit data the business is allowed to share.</span>
            </label>
          </div>
          <div className="form-actions border-t border-[var(--line)] pt-4">
            <Button type="submit">Save AI settings</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
