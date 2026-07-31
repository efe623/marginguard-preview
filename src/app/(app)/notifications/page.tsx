import { ActivityList } from "@/components/activity-center";
import { PageHeader } from "@/components/ui/page-header";
import { getActivityCenterData } from "@/features/operations/queries";

export default async function NotificationsPage() {
  const rows = await getActivityCenterData();
  const unread = rows.filter((row) => row.unread).length;
  return (
    <div className="page">
      <PageHeader eyebrow={`${unread} unread · ${rows.length} events`} title="Alerts & activity" description="Notifications, approvals, security changes, payments, and audit history in one timeline." />
      <section className="card mt-8">
        <ActivityList items={rows} />
      </section>
    </div>
  );
}
