import { Bell } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { NotificationComposer } from "./composer";
import { NotificationAnalytics } from "./analytics";
import { adminGetNotificationHistory } from "@/lib/notifications/actions";

export default async function AdminNotificationsPage() {
  const history = await adminGetNotificationHistory();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        icon={Bell}
        title="Smart Notifications & Broadcasts"
        description="Compose smart targeted notifications, preview eligible audience in real-time, and track delivery analytics."
      />

      {/* Broadcast Composer */}
      <NotificationComposer />

      {/* Analytics & History */}
      <NotificationAnalytics history={history} />
    </div>
  );
}
