import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MfaPanel } from "@/components/auth/mfa-panel";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function MfaPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");
  }
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <div>
        <ShieldCheck className="mx-auto mb-5" size={28} />
        <MfaPanel next={next?.startsWith("/") ? next : "/dashboard"} />
        <Link href="/recovery" className="mt-6 block text-center text-sm font-semibold underline underline-offset-4">Use a recovery code</Link>
      </div>
    </main>
  );
}
