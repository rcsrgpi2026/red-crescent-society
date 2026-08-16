import { Plus, Pencil, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageListUploadField } from "@/components/admin/image-list-upload-field";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetNotices, adminGetNoticeAttachments } from "@/lib/queries";
import { saveNotice, deleteNotice } from "@/lib/admin-actions";
import { NOTICE_CATEGORIES, formatDate } from "@/lib/constants";
import { Input, Label, Textarea, Checkbox } from "@/components/ui";

export default async function AdminNoticesPage() {
  const notices = await adminGetNotices();
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
        <div>
          <p className="font-medium text-foreground">{notice.title}</p>
          <p className="text-xs text-muted-foreground">/notices/{notice.slug}</p>
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
          >
            <NoticeFields />
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
            >
              <NoticeFields
                notice={notice}
                attachments={attachmentsByNotice.get(notice.id) ?? []}
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

function NoticeFields({
  notice,
  attachments,
}: {
  notice?: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    category: string | null;
    pinned: boolean;
    published: boolean;
  };
  attachments?: { url: string }[];
}) {
  return (
    <>
      {notice && <input type="hidden" name="id" value={notice.id} />}
      <div>
        <Label htmlFor="n-title">Title</Label>
        <Input id="n-title" name="title" defaultValue={notice?.title} placeholder="e.g. General meeting this Friday" className="mt-1.5" />
        <FieldError name="title" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="n-slug">Slug</Label>
          <Input id="n-slug" name="slug" defaultValue={notice?.slug} placeholder="auto" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="n-category">Category</Label>
          <select id="n-category" name="category" defaultValue={notice?.category ?? NOTICE_CATEGORIES[0]} className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            {NOTICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="n-content">Content</Label>
        <Textarea id="n-content" name="content" defaultValue={notice?.content ?? ""} rows={6} className="mt-1.5" />
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="published" defaultChecked={notice?.published ?? true} />
          Published (visible immediately)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="pinned" defaultChecked={notice?.pinned} />
          Pinned (highlight)
        </label>
      </div>
      <ImageListUploadField
        name="attachments"
        label="Attachment images"
        defaultValue={attachments?.map((a) => a.url).join("\n") ?? ""}
        folder="notices"
        uploadLabel="Upload attachments"
        description="Shown as downloadable attachments on the notice. Saving replaces this list."
      />
    </>
  );
}
