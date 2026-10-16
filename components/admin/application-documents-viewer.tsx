"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Camera,
  FileCheck,
  FileText,
  Eye,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileQuestion,
  User,
  Shield,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { VolunteerApplication } from "@/types/database";

interface ApplicationDocumentsViewerProps {
  application: VolunteerApplication;
}

interface DocumentItem {
  key: string;
  title: string;
  banglaTitle: string;
  url: string | null | undefined;
  icon: typeof Camera;
  required: boolean;
  typeHint: string;
}

export function ApplicationDocumentsViewer({
  application,
}: ApplicationDocumentsViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<{
    title: string;
    url: string;
    isPdf: boolean;
  } | null>(null);

  const documents: DocumentItem[] = [
    {
      key: "photo",
      title: "Passport Size Photo",
      banglaTitle: "পাসপোর্ট সাইজ ছবি",
      url: application.photo_url,
      icon: Camera,
      required: true,
      typeHint: "Official ID Photo",
    },
    {
      key: "nid",
      title: "Applicant NID / Birth Certificate",
      banglaTitle: "জাতীয় পরিচয়পত্র বা জন্ম নিবন্ধন সনদ",
      url: application.nid_or_birth_cert_url,
      icon: FileCheck,
      required: true,
      typeHint: "Primary Identification",
    },
    {
      key: "college_card",
      title: "College Registration Card / Student ID",
      banglaTitle: "কলেজ রেজিস্ট্রেশন বা আইডি কার্ড",
      url: application.college_reg_card_url,
      icon: Layers,
      required: true,
      typeHint: "Academic Enrollment",
    },
    {
      key: "father_nid",
      title: "Father's NID",
      banglaTitle: "পিতার জাতীয় পরিচয়পত্র",
      url: application.father_nid_url,
      icon: Shield,
      required: false,
      typeHint: "Parent Verification",
    },
    {
      key: "mother_nid",
      title: "Mother's NID",
      banglaTitle: "মাতার জাতীয় পরিচয়পত্র",
      url: application.mother_nid_url,
      icon: Shield,
      required: false,
      typeHint: "Parent Verification",
    },
  ];

  const providedCount = documents.filter((d) => Boolean(d.url)).length;

  const checkIsPdf = (url: string) => {
    const lower = url.toLowerCase();
    return lower.endsWith(".pdf") || lower.includes(".pdf?") || lower.includes("/raw/");
  };

  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-brand" />
          <div>
            <h2 className="text-base font-bold text-foreground">
              Submitted Verification Documents
            </h2>
            <p className="text-xs text-muted-foreground">
              প্রয়োজনীয় প্রমাণীকরণ কাগজপত্র ও পাসপোর্ট ছবি ({providedCount} of {documents.length} attached)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
            {providedCount} Uploaded
          </span>
        </div>
      </div>

      {/* Grid of Documents */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const hasUrl = Boolean(doc.url);
          const isPdf = hasUrl ? checkIsPdf(doc.url!) : false;
          const Icon = doc.icon;

          return (
            <div
              key={doc.key}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                hasUrl
                  ? "border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-xs"
                  : "border-dashed border-line bg-mist/20"
              }`}
            >
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        hasUrl
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-mist text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground leading-tight">
                        {doc.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {doc.banglaTitle}
                      </p>
                    </div>
                  </div>
                  {doc.required ? (
                    <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                      Required
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                      Optional
                    </span>
                  )}
                </div>

                {/* Preview / Status */}
                <div className="mt-3.5">
                  {hasUrl ? (
                    isPdf ? (
                      <div
                        onClick={() =>
                          setSelectedDoc({
                            title: doc.title,
                            url: doc.url!,
                            isPdf: true,
                          })
                        }
                        className="group flex items-center gap-3 rounded-xl border border-red-200/70 bg-red-50/40 p-2.5 cursor-pointer transition-colors hover:bg-red-50"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 font-bold">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700">
                            PDF Document
                          </span>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Click to inspect or preview
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() =>
                          setSelectedDoc({
                            title: doc.title,
                            url: doc.url!,
                            isPdf: false,
                          })
                        }
                        className="group relative h-28 w-full overflow-hidden rounded-xl border border-line bg-mist cursor-pointer"
                      >
                        <Image
                          src={doc.url!}
                          alt={doc.title}
                          fill
                          sizes="280px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                            <Eye className="h-3.5 w-3.5" />
                            Zoom
                          </span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white/50 py-6 text-center">
                      <FileQuestion className="h-6 w-6 text-muted-foreground/50 mb-1" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Not Provided
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {doc.required ? "Applicant skipped this document" : "Optional verification item"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {hasUrl && (
                <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDoc({
                        title: doc.title,
                        url: doc.url!,
                        isPdf,
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>

                  <a
                    href={doc.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Original
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox / Preview Dialog */}
      <Dialog
        open={Boolean(selectedDoc)}
        onOpenChange={(open) => {
          if (!open) setSelectedDoc(null);
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
          <DialogHeader className="p-4 sm:p-5 border-b border-line flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {selectedDoc?.title}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Applicant: {application.name} ({application.roll})
              </p>
            </div>
            {selectedDoc && (
              <a
                href={selectedDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-mist transition-colors mr-6"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Full Tab
              </a>
            )}
          </DialogHeader>

          <div className="relative min-h-[300px] max-h-[75vh] overflow-auto bg-slate-900/5 p-4 flex items-center justify-center">
            {selectedDoc?.isPdf ? (
              <iframe
                src={selectedDoc.url}
                className="h-[65vh] w-full rounded-xl border border-line bg-white shadow-xs"
                title={selectedDoc.title}
              />
            ) : selectedDoc?.url ? (
              <div className="relative max-h-[70vh] w-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedDoc.url}
                  alt={selectedDoc.title}
                  className="max-h-[68vh] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
