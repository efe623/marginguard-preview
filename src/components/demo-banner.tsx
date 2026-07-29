import { isSupabaseConfigured } from "@/lib/env";

export function DemoBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="border-b border-[#6f5a00] bg-[#fff0aa] px-5 py-2 text-center text-xs font-semibold tracking-wide text-[#4e4000]">
      Preview mode — sample data only. Connect Supabase to enable secure writes.
    </div>
  );
}
