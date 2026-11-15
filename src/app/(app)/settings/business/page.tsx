import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { updateBusinessProfile } from "@/features/operations/actions";
import { getBusinessSettingsData } from "@/features/operations/queries";
import { formatMoney } from "@/lib/money";

export default async function BusinessSettingsPage() {
  const business = await getBusinessSettingsData();
  const currency = business?.currency ?? "AED";
  const rate = business?.default_hourly_rate_minor
    ? formatMoney(Number(business.default_hourly_rate_minor), currency).replace(`${currency} `, "")
    : "";
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[{ label: "Settings", href: "/settings" }, { label: "Business profile" }]}
        title="Business profile"
        description="Defaults used for project pricing, reports, invoices, and AI estimates."
      />
      <SettingsNav active="business" />
      <form action={updateBusinessProfile} className="panel mt-6">
        <div className="panel-body stack">
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="biz-name">Business name</label>
              <input id="biz-name" className="input" name="name" defaultValue={business?.name ?? ""} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="biz-type">Business type</label>
              <input id="biz-type" className="input" name="businessType" defaultValue={business?.business_type ?? ""} placeholder="Agency, contractor, studio…" required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="biz-currency">Currency</label>
              <input id="biz-currency" className="input" name="currency" defaultValue={currency} maxLength={3} required />
              <p className="hint">Three-letter code, for example AED.</p>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="biz-rate">Default hourly rate</label>
              <input id="biz-rate" className="input" name="defaultHourlyRate" defaultValue={rate} inputMode="decimal" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="biz-tz">Timezone</label>
              <input id="biz-tz" className="input" name="timezone" defaultValue={business?.timezone ?? "Asia/Dubai"} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="biz-country">Country code</label>
              <input id="biz-country" className="input" name="countryCode" defaultValue={business?.country_code ?? "AE"} maxLength={2} required />
            </div>
          </div>
          <div className="form-actions border-t border-[var(--line)] pt-4">
            <Button type="submit">Save business profile</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
