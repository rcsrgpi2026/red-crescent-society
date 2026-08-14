import { Plus, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageListUploadField } from "@/components/admin/image-list-upload-field";
import { adminGetNotices, adminGetNoticeAttachments } from "@/lib/queries";
import { saveNotice, deleteNotice } from "@/lib/admin-actions";
import { NOTICE_CATEGORIES, formatDate } from "@/lib/constants";
import { Input, Label, Textarea, Checkbox } from "@/components/ui";

export default async function AdminNoticesPage() {
  const notices = await adminGetNotices();
  const attachmentsByNotice = await Promise.all(
    notices.map((notice) => adminGetNoticeAttachments(notice.id))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish and schedule announcements for the notice board.
          </p>
        </div>
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
          {(errors) => <NoticeFields errors={errors} />}
        </AdminFormDialog>
      </div>

      {notices.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Notice</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((notice, index) => (
                <TableRow key={notice.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{notice.title}</p>
                    <p className="text-xs text-muted-foreground">/notices/{notice.slug}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{notice.category ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(notice.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {notice.pinned && <StatusBadge label="Pinned" tone="crescent" />}
                      {notice.publish_at && (
                        <StatusBadge label="Scheduled" tone="poly" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={notice.published ? "Published" : "Draft"}
                      tone={statusTone(notice.published ? "PUBLISHED" : "DRAFT")}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <AdminFormDialog
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        }
                        title={`Edit ${notice.title}`}
                        action={saveNotice}
                        submitLabel="Save changes"
                      >
                        {(errors) => (
                          <NoticeFields errors={errors} notice={notice} attachments={attachmentsByNotice[index] ?? []} />
                        )}
                      </AdminFormDialog>
                      <ConfirmDelete
                        action={deleteNotice}
                        id={notice.id}
                        description={`Delete "${notice.title}"?`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState title="No notices yet" description="Publish your first announcement." />
      )}
    </div>
  );
}

function NoticeFields({
  errors,
  notice,
  attachments,
}: {
  errors?: Record<string, string[]>;
  notice?: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    category: string | null;
    pinned: boolean;
    published: boolean;
    publish_at: string | null;
    expires_at: string | null;
  };
  attachments?: { url: string }[];
}) {
  return (
    <>
      {notice && <input type="hidden" name="id" value={notice.id} />}
      <div>
        <Label htmlFor="n-title">Title</Label>
        <Input id="n-title" name="title" defaultValue={notice?.title} placeholder="e.g. General meeting this Friday" className="mt-1.5" />
        <FieldError errors={errors} name="title" />
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="n-publishAt">Publish at (schedule)</Label>
          <Input id="n-publishAt" name="publishAt" type="datetime-local" defaultValue={notice?.publish_at?.slice(0, 16) ?? ""} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="n-expiresAt">Expires at</Label>
          <Input id="n-expiresAt" name="expiresAt" type="datetime-local" defaultValue={notice?.expires_at?.slice(0, 16) ?? ""} className="mt-1.5" />
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="published" defaultChecked={notice?.published ?? true} />
          Published
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
