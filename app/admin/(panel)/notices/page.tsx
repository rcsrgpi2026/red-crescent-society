import Image from "next/image";
import { Plus, Pencil, Megaphone, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetNotices, adminGetNoticeAttachments, adminGetEvents } from "@/lib/queries";
import { saveNotice, deleteNotice } from "@/lib/admin-actions";
import { formatDate } from "@/lib/constants";
import { NoticeFormFields } from "@/components/admin/notice-form-fields";

export default async function AdminNoticesPage() {
  const [notices, events] = await Promise.all([
    adminGetNotices(),
    adminGetEvents(),
  ]);
  const eventsById = new Map(events.map((e) => [e.id, e]));

  const attachmentLists = await Promise.all(
    notices.map((notice) => adminGetNoticeAttachments(notice.id))
  );
  const attachmentsByNotice = new Map(
    notices.map((notice, index) => [notice.id, attachmentLists[index] ?? []])
  );

  const columns: Column<(typeof notices)[number]>[] = [
    {
      header: "Notice",
      render: (notice) => (
        <div className="flex items-center gap-3">
          {notice.cover_image && (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-mist">
              <Image
                src={notice.cover_image}
                alt={notice.title}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate max-w-xs">{notice.title}</p>
            <p className="text-xs text-muted-foreground">/notices/{notice.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (notice) => (
        <span className="inline-flex rounded-full bg-poly-soft px-2.5 py-0.5 text-xs font-semibold text-poly">
          {notice.category ?? "—"}
        </span>
      ),
    },
    {
      header: "Linked Event",
      render: (notice) => {
        const linkedEvent = notice.event_id ? eventsById.get(notice.event_id) : null;
        if (!linkedEvent) {
          return <span className="text-xs text-muted-foreground/60">—</span>;
        }
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-brand">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[150px]">{linkedEvent.title}</span>
          </div>
        );
      },
    },
    {
      header: "Created",
      render: (notice) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(notice.created_at)}
        </span>
      ),
    },
    {
      header: "Flags",
      render: (notice) => (
        <div className="flex gap-1.5">
          {notice.pinned && <StatusBadge label="Pinned" tone="crescent" />}
        </div>
      ),
    },
    {
      header: "Visibility",
      render: (notice) => (
        <StatusBadge
          label={notice.published ? "Published" : "Draft"}
          tone={statusTone(notice.published ? "PUBLISHED" : "DRAFT")}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Megaphone}
        title="Notices"
        description="Publish announcements for the notice board — they go live the moment you publish."
        tone="bg-gradient-to-br from-amber-400 to-orange-500"
        actions={
          <AdminFormDialog
            trigger={
              <Button>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                New notice
              </Button>
            }
            title="Create notice"
            action={saveNotice}
            submitLabel="Publish notice"
            size="3xl"
          >
            <NoticeFormFields events={events} />
          </AdminFormDialog>
        }
      />

      <ResponsiveTable
        columns={columns}
        rows={notices}
        keyFor={(notice) => notice.id}
        minWidth="min-w-[720px]"
        actions={(notice) => (
          <>
            <AdminFormDialog
              trigger={
                <Button variant="ghost" size="sm" aria-label={`Edit ${notice.title}`}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
              }
              title={`Edit ${notice.title}`}
              action={saveNotice}
              submitLabel="Save changes"
              size="3xl"
            >
              <NoticeFormFields
                notice={notice}
                attachments={attachmentsByNotice.get(notice.id) ?? []}
                events={events}
              />
            </AdminFormDialog>
            <ConfirmDelete
              action={deleteNotice}
              id={notice.id}
              description={`Delete "${notice.title}"?`}
            />
          </>
        )}
        empty={
          <EmptyState
            icon={Megaphone}
            title="No notices yet"
            description="Publish your first announcement."
          />
        }
      />
    </div>
  );
}
