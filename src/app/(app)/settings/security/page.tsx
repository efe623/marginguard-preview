import { KeyRound, Laptop, ShieldCheck } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";

const sessions = [
  ["Windows · Chrome", "Dubai · Active now", "Current device"],
  ["Windows · Edge", "Dubai · 2 days ago", "Trusted"]
];

export default function SecurityPage() {
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[{ label: "Settings", href: "/settings/business" }, { label: "Security" }]}
        title="Security"
        description="MFA, recovery, trusted devices, and high-risk action controls."
      />
      <SettingsNav active="security" />
      <div className="stack mt-6">
        <section className="panel" aria-labelledby="sec-protection">
          <div className="panel-head">
            <h2 className="panel-title" id="sec-protection">Sign-in protection</h2>
          </div>
          <div className="rows">
            <div className="row">
              <span className="row-lead"><ShieldCheck size={18} aria-hidden="true" /></span>
              <div className="row-main">
                <p className="row-title">Authenticator MFA</p>
                <p className="row-sub">Required for owner access and binding financial actions.</p>
              </div>
              <div className="row-end">
                <Status tone="success">Enabled</Status>
                <Button variant="outline">Manage authenticator</Button>
              </div>
            </div>
            <div className="row">
              <span className="row-lead"><KeyRound size={18} aria-hidden="true" /></span>
              <div className="row-main">
                <p className="row-title">Recovery codes</p>
                <p className="row-sub">8 unused one-time codes. Regenerating them invalidates the current set, so save the new ones straight away.</p>
              </div>
              <div className="row-end">
                <Button variant="outline">Regenerate codes</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="sec-sessions">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="sec-sessions">Sessions</h2>
              <p className="panel-sub">Devices signed in to this account.</p>
            </div>
          </div>
          <div className="rows">
            {sessions.map(([device, meta, state]) => (
              <div key={device} className="row">
                <span className="row-lead"><Laptop size={18} aria-hidden="true" /></span>
                <div className="row-main">
                  <p className="row-title">{device}</p>
                  <p className="row-sub">{meta}</p>
                </div>
                <div className="row-end">
                  <Status tone={state === "Current device" ? "success" : "neutral"}>{state}</Status>
                  <Button variant="outline" disabled={state === "Current device"}>Sign out</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
