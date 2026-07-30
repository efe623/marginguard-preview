import { SettingsNav } from "@/components/settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { updateBusinessProfile } from "@/features/operations/actions";
import { getBusinessSettingsData } from "@/features/operations/queries";
import { formatMoney } from "@/lib/money";

export default async function BusinessSettingsPage() {
  const business = await getBusinessSettingsData();
  const currency = business?.currency ?? "AED";
  const rate = business?.default_hourly_rate_minor
    ? formatMoney(Number(business.default_hourly_rate_minor), currency).replace(`${currency}\u00a0`, "")
    : "";
  return (
    <div className="page">
      <PageHeader eyebrow="Owner controls" title="Business profile" description="Defaults used for project pricing, reports, invoices, and AI estimates." />
      <SettingsNav active="business" />
      <form action={updateBusinessProfile} className="card mt-8 grid max-w-3xl gap-5 p-7 md:grid-cols-2">
        <label><span className="field-label">Business name</span><input className="input" name="name" defaultValue={business?.name ?? ""} required /></label>
        <label><span className="field-label">Business type</span><input className="input" name="businessType" defaultValue={business?.business_type ?? ""} placeholder="Agency, contractor, studio…" required /></label>
        <label><span className="field-label">Currency</span><input className="input" name="currency" defaultValue={currency} maxLength={3} required /></label>
        <label><span className="field-label">Default hourly rate</span><input className="input" name="defaultHourlyRate" defaultValue={rate} inputMode="decimal" /></label>
        <label><span className="field-label">Timezone</span><input className="input" name="timezone" defaultValue={business?.timezone ?? "Asia/Dubai"} required /></label>
        <label><span className="field-label">Country code</span><input className="input" name="countryCode" defaultValue={business?.country_code ?? "AE"} maxLength={2} required /></label>
        <button className="button button-primary md:col-span-2" type="submit">Save business profile</button>
      </form>
    </div>
  );
}
