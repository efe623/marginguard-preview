import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="preview-bar" role="note">
      <Info size={14} aria-hidden />
      Interactive product preview. Sample data only, nothing is saved or sent.
    </div>
  );
}
