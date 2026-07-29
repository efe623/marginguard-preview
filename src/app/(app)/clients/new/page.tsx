import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/features/core/actions";

export default async function NewClientPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="page max-w-5xl">
      <Link href="/clients" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold hover:text-[var(--signal)]">
        <ArrowLeft size={16} /> Back to clients
      </Link>
      <p className="eyebrow mb-4">Client directory</p>
      <h1 className="page-title">Add a client.</h1>
      {error ? <p className="mt-6 border border-[var(--danger)] p-4 text-sm">{error}</p> : null}
      <form action={createClient} className="card mt-10 grid grid-cols-2 gap-6 p-8">
        <label>
          <span className="field-label">Client or business name</span>
          <input className="input" name="name" required />
        </label>
        <label>
          <span className="field-label">Primary contact email</span>
          <input className="input" name="email" type="email" />
        </label>
        <label>
          <span className="field-label">Phone</span>
          <input className="input" name="phone" type="tel" />
        </label>
        <label>
          <span className="field-label">Location</span>
          <input className="input" name="location" placeholder="Dubai, UAE" />
        </label>
        <label className="col-span-2">
          <span className="field-label">Internal notes</span>
          <textarea className="textarea" name="notes" />
        </label>
        <div className="col-span-2 flex justify-end border-t border-[var(--line)] pt-6">
          <Button type="submit">Save client</Button>
        </div>
      </form>
    </div>
  );
}
