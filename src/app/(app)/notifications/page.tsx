import Link from "next/link";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getBusinessOperationsData } from "@/features/operations/queries";

export default async function NotificationsPage() {
  const { notifications } = await getBusinessOperationsData();
  const rows = notifications as Array<{ id: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string }>;
  return (
    <div>
      <PageHeader eyebrow={`${rows.filter((row) => !row.read_at).length} unread`} title="Notifications" description="Approvals, extra requests, deadlines, and payment reminders." />
      <section className="card mt-8">
        {rows.map((row) => {
          const content = <div className="grid grid-cols-[40px_1fr_auto] gap-4 border-b border-[var(--line)] p-6 last:border-0"><span className="grid size-10 place-items-center border border-[var(--line)]"><Bell size={18} /></span><div><h2 className="font-semibold">{row.title}</h2><p className="quiet mt-1 text-sm">{row.body}</p></div><time className="quiet text-xs">{new Date(row.created_at).toLocaleString()}</time></div>;
          return row.href ? <Link key={row.id} href={row.href}>{content}</Link> : <div key={row.id}>{content}</div>;
        })}
        {!rows.length ? <div className="p-10 text-center quiet">No notifications yet.</div> : null}
      </section>
    </div>
  );
}
