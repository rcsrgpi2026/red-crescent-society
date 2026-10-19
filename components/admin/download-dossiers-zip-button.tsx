"use client";

import { useState } from "react";
import { FolderArchive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DownloadDossiersZipButtonProps {
  status?: string;
  campaignId?: string;
  search?: string;
  count?: number;
  className?: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadDossiersZipButton({
  status,
  campaignId,
  search,
  count,
  className,
  variant = "outline",
  size = "sm",
}: DownloadDossiersZipButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    const toastId = toast.loading("Generating student dossiers ZIP archive...");

    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (campaignId) params.set("campaignId", campaignId);
      if (search) params.set("search", search);

      const qs = params.toString();
      const exportUrl = `/admin/recruitment/applications/export-zip${qs ? `?${qs}` : ""}`;

      const res = await fetch(exportUrl);

      if (!res.ok) {
        let errorMsg = "Failed to download ZIP archive.";
        try {
          const json = await res.json();
          if (json?.message) errorMsg = json.message;
        } catch {
          const txt = await res.text();
          if (txt) errorMsg = txt;
        }
        toast.error(errorMsg, { id: toastId });
        return;
      }

      // Extract filename from Content-Disposition header if available
      const disposition = res.headers.get("content-disposition");
      let filename = `Student-Dossiers-${new Date().toISOString().slice(0, 10)}.zip`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
        if (match && match[1]) {
          filename = match[1].trim();
        }
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Student dossiers ZIP downloaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("ZIP download error:", err);
      toast.error(err?.message || "An error occurred while downloading the ZIP archive.", { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
      className={cn("gap-2 font-medium text-xs sm:text-sm", className)}
      title="Download all student application dossiers with credentials as a ZIP archive"
    >
      {downloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          <span>Generating ZIP...</span>
        </>
      ) : (
        <>
          <FolderArchive className="h-4 w-4 text-brand" />
          <span>
            Download Dossiers (ZIP)
            {typeof count === "number" && count > 0 ? ` (${count})` : ""}
          </span>
        </>
      )}
    </Button>
  );
}
