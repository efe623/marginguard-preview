import { ActivityList } from "@/components/activity-center";
import { PageHeader } from "@/components/ui/page-header";
import { getActivityCenterData } from "@/features/operations/queries";

export default async function NotificationsPage() {
  const rows = await getActivityCenterData();
  const unread = rows.filter((row) => row.unread).length;
  return (
    <div className="page page-narrow">
      <PageHeader title="Alerts & activity" description="Notifications, approvals, security changes, payments, and audit history in one timeline." />
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Timeline</h2>
          <p className="panel-sub">{unread} unread · {rows.length} events</p>
        </div>
        <ActivityList items={rows} />
      </section>
    </div>
  );
}
