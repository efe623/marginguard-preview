import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MfaPanel } from "@/components/auth/mfa-panel";

export default async function MfaPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
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
