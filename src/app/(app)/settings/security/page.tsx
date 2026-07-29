import { KeyRound, Laptop, ShieldCheck } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";

export default function SecurityPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Account protection"
        title="Security"
        description="MFA, recovery, trusted devices, and high-risk action controls."
      />
      <SettingsNav active="security" />
      <div className="mt-7 grid grid-cols-2 gap-6">
        <section className="card p-7">
          <div className="flex items-center justify-between">
            <ShieldCheck size={24} />
            <Status tone="success">Enabled</Status>
          </div>
          <h2 className="section-title mt-8">Authenticator MFA</h2>
          <p className="quiet mt-3 leading-7">Required for owner access and binding financial actions.</p>
          <Button className="mt-7" variant="outline">Manage authenticator</Button>
        </section>
        <section className="card p-7">
          <KeyRound size={24} />
          <h2 className="section-title mt-8">Recovery codes</h2>
          <p className="quiet mt-3 leading-7">8 unused one-time codes. Regenerating them invalidates the current set.</p>
          <Button className="mt-7" variant="outline">Regenerate codes</Button>
        </section>
      </div>
      <section className="card mt-6">
        <div className="border-b border-[var(--line)] p-7">
          <p className="eyebrow mb-3">Active devices</p>
          <h2 className="section-title">Sessions</h2>
        </div>
        {[
          ["Windows · Chrome", "Dubai · Active now", "Current device"],
          ["Windows · Edge", "Dubai · 2 days ago", "Trusted"]
        ].map(([device, meta, state]) => (
          <div key={device} className="grid grid-cols-[48px_1fr_160px_140px] items-center gap-4 border-b border-[var(--line)] p-6 last:border-0">
            <span className="grid size-11 place-items-center border border-[var(--line)]"><Laptop size={20} /></span>
            <div><p className="font-semibold">{device}</p><p className="quiet mt-1 text-xs">{meta}</p></div>
            <Status tone={state === "Current device" ? "success" : "neutral"}>{state}</Status>
            <Button variant="outline" disabled={state === "Current device"}>Sign out</Button>
          </div>
        ))}
      </section>
    </div>
  );
}
