import { Plus, Pencil, Images } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminFormDialog, FieldError } from "@/components/admin/admin-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { ImageListUploadField } from "@/components/admin/image-list-upload-field";
import { adminGetAlbums, getAlbumImages } from "@/lib/queries";
import { saveAlbum, deleteAlbum } from "@/lib/admin-actions";
import { formatDate } from "@/lib/constants";
import { Input, Label, Textarea } from "@/components/ui";

export default async function AdminGalleryPage() {
  const albums = await adminGetAlbums();
  const imagesByAlbum = await Promise.all(
    albums.map(async (album) => getAlbumImages(album.id))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize photos into albums for the public gallery.
          </p>
        </div>
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
          {(errors) => <AlbumFields errors={errors} />}
        </AdminFormDialog>
      </div>

      {albums.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist/60">
                <TableHead>Album</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {albums.map((album, index) => (
                <TableRow key={album.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{album.title}</p>
                    <p className="text-xs text-muted-foreground">/gallery/{album.slug}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(album.date)}</TableCell>
                  <TableCell className="text-xs">{imagesByAlbum[index]?.length ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <AdminFormDialog
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        }
                        title={`Edit ${album.title}`}
                        action={saveAlbum}
                        submitLabel="Save changes"
                      >
                        {(errors) => (
                          <AlbumFields errors={errors} album={album} images={imagesByAlbum[index] ?? []} />
                        )}
                      </AdminFormDialog>
                      <ConfirmDelete
                        action={deleteAlbum}
                        id={album.id}
                        description={`Delete "${album.title}" and its photos?`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Images}
          title="No albums yet"
          description="Create an album and upload or paste photo URLs."
        />
      )}
    </div>
  );
}

function AlbumFields({
  errors,
  album,
  images,
}: {
  errors?: Record<string, string[]>;
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
        <FieldError errors={errors} name="title" />
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
