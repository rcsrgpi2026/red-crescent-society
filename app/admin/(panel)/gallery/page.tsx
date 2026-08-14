import { Plus, Pencil, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ImageListUploadField } from "@/components/admin/image-list-upload-field";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { adminGetAlbums, getAlbumImages } from "@/lib/queries";
import { saveAlbum, deleteAlbum } from "@/lib/admin-actions";
import { formatDate } from "@/lib/constants";
import { Input, Label, Textarea } from "@/components/ui";

export default async function AdminGalleryPage() {
  const albums = await adminGetAlbums();
  const imageLists = await Promise.all(
    albums.map(async (album) => getAlbumImages(album.id))
  );
  const albumImages = new Map(
    albums.map((album, index) => [album.id, imageLists[index] ?? []])
  );

  const columns: Column<(typeof albums)[number]>[] = [
    {
      header: "Album",
      render: (album) => (
        <div>
          <p className="font-medium text-foreground">{album.title}</p>
          <p className="text-xs text-muted-foreground">/gallery/{album.slug}</p>
        </div>
      ),
    },
    {
      header: "Date",
      render: (album) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(album.date)}
        </span>
      ),
    },
    {
      header: "Photos",
      render: (album) => (
        <span className="text-xs font-semibold text-brand-dark">
          {albumImages.get(album.id)?.length ?? 0}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Images}
        title="Gallery"
        description="Organize photos into albums for the public gallery."
        tone="bg-gradient-to-br from-violet-500 to-purple-700"
        actions={
          <AdminFormDialog
            trigger={
              <Button>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                New album
              </Button>
            }
            title="Create album"
            action={saveAlbum}
            submitLabel="Create album"
          >
            <AlbumFields />
          </AdminFormDialog>
        }
      />

      <ResponsiveTable
        columns={columns}
        rows={albums}
        keyFor={(album) => album.id}
        minWidth="min-w-[560px]"
        actions={(album) => (
          <>
            <AdminFormDialog
              trigger={
                <Button variant="ghost" size="sm" aria-label={`Edit ${album.title}`}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
              }
              title={`Edit ${album.title}`}
              action={saveAlbum}
              submitLabel="Save changes"
            >
              <AlbumFields
                album={album}
                images={albumImages.get(album.id) ?? []}
              />
            </AdminFormDialog>
            <ConfirmDelete
              action={deleteAlbum}
              id={album.id}
              description={`Delete "${album.title}" and its photos?`}
            />
          </>
        )}
        empty={
          <EmptyState
            icon={Images}
            title="No albums yet"
            description="Create an album and upload or paste photo URLs."
          />
        }
      />
    </div>
  );
}

function AlbumFields({
  album,
  images,
}: {
  album?: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    cover_image: string | null;
    date: string | null;
  };
  images?: { url: string }[];
}) {
  return (
    <>
      {album && <input type="hidden" name="id" value={album.id} />}
      <div>
        <Label htmlFor="g-title">Title</Label>
        <Input id="g-title" name="title" defaultValue={album?.title} placeholder="e.g. Blood Donation 2026" className="mt-1.5" />
        <FieldError name="title" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="g-slug">Slug</Label>
          <Input id="g-slug" name="slug" defaultValue={album?.slug} placeholder="auto" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="g-date">Date</Label>
          <Input id="g-date" name="date" type="date" defaultValue={album?.date ?? ""} className="mt-1.5" />
        </div>
      </div>
      <ImageUploadField
        name="coverImage"
        label="Cover image"
        defaultValue={album?.cover_image}
        folder="gallery"
      />
      <div>
        <Label htmlFor="g-desc">Description</Label>
        <Textarea id="g-desc" name="description" defaultValue={album?.description ?? ""} rows={3} className="mt-1.5" />
      </div>
      <ImageListUploadField
        name="images"
        label="Photos"
        defaultValue={images?.map((i) => i.url).join("\n") ?? ""}
        folder="gallery"
        uploadLabel="Upload photos"
        description="Saving replaces the album's photos with this list."
      />
    </>
  );
}
