import { SettingsNav } from "@/components/settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { updateBusinessAiSettings } from "@/features/operations/actions";
import { getBusinessOperationsData } from "@/features/operations/queries";

export default async function AiSettingsPage() {
  const { business } = await getBusinessOperationsData();
  const enabled = Boolean(business?.ai_enabled);
  return (
    <div>
      <PageHeader eyebrow="Owner controls" title="AI and privacy" description="Gemini is draft-only and can be disabled for the whole business or individual projects." />
      <SettingsNav active="ai" />
      <section className="card mt-8 max-w-3xl p-7">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="section-title">Gemini draft assistant</h2><p className="quiet mt-2">Model: gemini-3.5-flash-lite · daily free-plan cap: 20 drafts</p></div>
          <Status tone={enabled ? "success" : "neutral"}>{enabled ? "Enabled" : "Disabled"}</Status>
        </div>
        <div className="mt-6 border border-[var(--line)] bg-[var(--paper-deep)] p-5 text-sm leading-7">
          The Gemini free tier may use submitted content to improve Google products. Staff must confirm consent for every draft. MarginGuard stores the structured output, model, source hash, reviewer, and audit event.
        </div>
        <form action={updateBusinessAiSettings} className="mt-6 space-y-4">
          <label className="flex gap-3 text-sm"><input name="aiEnabled" type="checkbox" defaultChecked={enabled} /> Enable Gemini draft tools</label>
          <label className="flex items-start gap-3 text-sm leading-6"><input className="mt-1" name="acknowledged" type="checkbox" defaultChecked={Boolean(business?.ai_terms_acknowledged_at)} /> I understand the external processing and will only submit data the business is allowed to share.</label>
          <button className="button button-primary" type="submit">Save AI settings</button>
        </form>
      </section>
    </div>
  );
}
