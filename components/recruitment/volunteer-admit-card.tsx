"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Download, Camera, Scissors, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { useLogos } from "@/components/providers/logo-provider";
import type { VolunteerApplication } from "@/types/database";

import { cn } from "@/lib/utils";

interface VolunteerAdmitCardProps {
  application: VolunteerApplication;
  /** When true, hides the print/download action buttons (useful for embedded PDF/print views). */
  hideActions?: boolean;
}

const CARD_NATURAL_WIDTH = 680;

/** Inlines all remote and local raster images inside the card as base64 data URLs before capture. */
async function inlineAllCardImages(node: HTMLElement): Promise<() => void> {
  const images = Array.from(node.querySelectorAll<HTMLImageElement>("img"));
  const originals: { img: HTMLImageElement; src: string; srcset: string }[] = [];

  const pending = images.map(async (img) => {
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith("data:")) return;

    originals.push({ img, src, srcset: img.srcset });

    try {
      let dataUrl: string | null = null;
      // If absolute remote URL (e.g. Cloudinary), fetch via server proxy to avoid CORS
      if (/^https?:\/\//i.test(src)) {
        try {
          const proxyRes = await fetch(`/api/id-card/image-data?url=${encodeURIComponent(src)}`);
          if (proxyRes.ok) {
            const json = await proxyRes.json();
            if (json.dataUrl) dataUrl = json.dataUrl;
          }
        } catch {
          // Fallback to direct client fetch
        }
      }

      // If local asset or proxy fallback
      if (!dataUrl) {
        try {
          const res = await fetch(src, { mode: "cors" });
          if (res.ok) {
            const blob = await res.blob();
            dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject();
              reader.readAsDataURL(blob);
            });
          }
        } catch {
          // Ignore
        }
      }

      if (dataUrl) {
        img.srcset = "";
        img.src = dataUrl;
        if (!img.complete) {
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 2000);
          });
        }
      }
    } catch (err) {
      console.warn("Could not inline admit card image:", src, err);
    }
  });

  await Promise.all(pending);

  return () => {
    for (const item of originals) {
      item.img.src = item.src;
      if (item.srcset) item.img.srcset = item.srcset;
    }
  };
}

export function VolunteerAdmitCard({
  application,
  hideActions = false,
}: VolunteerAdmitCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printFormat, setPrintFormat] = useState<"slip" | "a4">("slip");
  const [scale, setScale] = useState(1);
  const [cardHeight, setCardHeight] = useState(260);
  const logos = useLogos();

  // Responsive scale adjustment: automatically scales down on mobile viewports so there is NO horizontal scrolling
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const fit = () => {
      const containerWidth = el.clientWidth;
      if (containerWidth > 0) {
        setScale(Math.min(containerWidth / CARD_NATURAL_WIDTH, 1));
      }
      if (cardRef.current) {
        setCardHeight(cardRef.current.offsetHeight);
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener("resize", fit);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  // Official logo for Admit Card: custom configured logo from DB or local high-res official emblem
  const logoSrc = logos.rcs || "/logos/rcy-official-logo.png";

  // Roll or serial number to display (prioritize serial_no, fallback to roll)
  const rollOrSerial = application.serial_no || application.roll || "Pending";



  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    setDownloadingPdf(true);
    let restoreImages: (() => void) | null = null;
    try {
      restoreImages = await inlineAllCardImages(cardRef.current);
      await new Promise((r) => setTimeout(r, 120));

      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const { default: jsPDF } = await import("jspdf");

      const img = new window.Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const aspectRatio = img.width / (img.height || 1);

      let pdf: InstanceType<typeof jsPDF>;
      if (printFormat === "slip") {
        // Exact slip size: page width = 200mm, height matches exact proportions (e.g. ~82mm)
        // Zero unnecessary blank white page!
        const pdfWidth = 200;
        const pdfHeight = Math.round((pdfWidth / aspectRatio) * 10) / 10;

        pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      } else {
        // Standard full A4 portrait (210 x 297 mm)
        pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = 210;
        const marginX = 12; // 12mm side margins
        const printWidth = pageWidth - marginX * 2; // 186mm
        const printHeight = (img.height * printWidth) / img.width;
        const marginY = 14; // 14mm top margin

        pdf.addImage(dataUrl, "PNG", marginX, marginY, printWidth, printHeight, undefined, "FAST");
      }

      const cleanName = (application.name || "applicant")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const formatSuffix = printFormat === "a4" ? "-a4" : "";
      pdf.save(`rcy-admit-card-${cleanName}-${rollOrSerial}${formatSuffix}.pdf`);
      toast.success(
        printFormat === "slip"
          ? "প্রবেশ পত্র (কার্ড সাইজ PDF) ডাউনলোড সম্পন্ন হয়েছে!"
          : "প্রবেশ পত্র (A4 সাইজ PDF) ডাউনলোড সম্পন্ন হয়েছে!"
      );
    } catch (err) {
      console.error("Admit card PDF download error:", err);
      toast.error("PDF তৈরি করা যায়নি। প্রিন্ট অপশনটি ব্যবহার করুন।");
    } finally {
      restoreImages?.();
      setDownloadingPdf(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    let restoreImages: (() => void) | null = null;
    try {
      // 1. Inline all images (Cloudinary photos, logo) as base64 data URLs to prevent CORS / tainted canvas errors
      restoreImages = await inlineAllCardImages(cardRef.current);

      // 2. Small delay to ensure all fonts and inlined images are settled in DOM
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 3, // High resolution for crisp printing
        backgroundColor: "#ffffff",
      });

      const cleanName = (application.name || "applicant")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const link = document.createElement("a");
      link.download = `rcy-admit-card-${cleanName}-${rollOrSerial}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("প্রবেশ পত্র (PNG) ডাউনলোড সম্পন্ন হয়েছে!");
    } catch (err) {
      console.error("Admit card download error:", err);
      toast.error("প্রবেশ পত্র ডাউনলোড করা যায়নি। সরাসরি প্রিন্ট অপশনটি ব্যবহার করুন।");
    } finally {
      restoreImages?.();
      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Action buttons (hidden during print) */}
      {!hideActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">
                অফিসিয়াল প্রবেশ পত্র (Admit Card)
              </p>
              <p className="text-xs text-muted-foreground">
                অনুমোদন সাপেক্ষে ইস্যুকৃত অফিসিয়াল প্রবেশপত্র স্লিপ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format toggle: কার্ড সাইজ (স্লিপ) vs A4 পেজ */}
            <div className="flex items-center rounded-lg border border-emerald-600/30 bg-emerald-50/50 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintFormat("slip")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-all cursor-pointer",
                  printFormat === "slip"
                    ? "bg-[#006A4E] text-white shadow-2xs font-bold"
                    : "text-emerald-800 hover:text-emerald-950"
                )}
                title="প্রবেশ পত্রের হুবহু সমান সাইজ (কোনো বাড়তি ফাঁকা পৃষ্ঠা ছাড়া)"
              >
                কার্ড সাইজ (স্লিপ)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("a4")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-all cursor-pointer",
                  printFormat === "a4"
                    ? "bg-[#006A4E] text-white shadow-2xs font-bold"
                    : "text-emerald-800 hover:text-emerald-950"
                )}
                title="পূর্ণাঙ্গ A4 সাইজ পেপার"
              >
                A4 পেজ
              </button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="gap-1.5 bg-[#006A4E] hover:bg-[#00523C] text-white font-semibold text-xs shadow-xs cursor-pointer"
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF ডাউনলোড
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="gap-1.5 border-emerald-600/30 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-xs shadow-xs cursor-pointer"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PNG ছবি
            </Button>
          </div>
        </div>
      )}

      {/* Responsive Scaled Admit Card Container (Auto-fits mobile without horizontal scroll) */}
      <div
        ref={wrapperRef}
        className="w-full flex justify-center overflow-hidden py-1"
      >
        <div
          style={{
            width: CARD_NATURAL_WIDTH * scale,
            height: cardHeight * scale,
            position: "relative",
            overflow: "hidden",
            transition: "width 0.15s ease, height 0.15s ease",
          }}
        >
          <div
            style={{
              width: CARD_NATURAL_WIDTH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              ref={cardRef}
              data-admit-card-root="true"
              style={{ width: CARD_NATURAL_WIDTH }}
              className="relative mx-auto bg-white p-3.5 select-none print:w-full print:p-0 print:border-none"
            >
              {/* Top Scissors Cut Line */}
              <div className="relative mb-3 flex items-center gap-2 text-emerald-800/80">
                <Scissors className="h-4 w-4 shrink-0 -scale-x-100 rotate-90 text-[#006A4E]" />
                <div className="h-0 flex-1 border-t-2 border-dashed border-[#006A4E]/60" />
              </div>

              {/* Main Admit Card Container Box */}
              <div className="relative rounded-2xl border-2 border-[#006A4E] bg-white p-4 sm:p-5 shadow-sm print:shadow-none">
                {/* Top Row: Logo, Header Text, Photo */}
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Official Red Crescent Youth / Institute Logo */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center p-1">
                    <Image
                      src={logoSrc}
                      alt="যুব রেড ক্রিসেন্ট লোগো"
                      width={72}
                      height={72}
                      unoptimized
                      priority
                      className="h-auto w-full max-w-[72px] object-contain drop-shadow-xs"
                    />
                  </div>

                  {/* Center: Title & Subtitle */}
                  <div className="flex-1 text-center">
                    <h2 className="text-xl sm:text-2xl font-black text-[#006A4E] tracking-tight leading-tight">
                      যুব রেড ক্রিসেন্ট
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm font-bold text-gray-800">
                      রাজশাহী সরকারি পলিটেকনিক ইনস্টিটিউট শাখা
                    </p>
                    <p className="text-[11px] font-semibold text-gray-600">
                      সপুরা, রাজশাহী - ৬২০৩
                    </p>

                    {/* Center Badge: প্রবেশ পত্র */}
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="h-[2px] w-8 sm:w-12 bg-red-600 rounded-full" />
                      <span className="inline-block rounded-full bg-[#006A4E] px-6 py-0.5 text-xs sm:text-sm font-extrabold text-white tracking-wide shadow-xs">
                        প্রবেশ পত্র
                      </span>
                      <span className="h-[2px] w-8 sm:w-12 bg-red-600 rounded-full" />
                    </div>
                  </div>

                  {/* Right: Passport Photo Box */}
                  <div className="flex h-24 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-emerald-700/40 bg-emerald-50/20 text-center p-1 shadow-2xs">
                    {application.photo_url ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={application.photo_url}
                          alt={application.name}
                          fill
                          unoptimized
                          sizes="80px"
                          className="rounded-lg object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-emerald-800/80 p-0.5">
                        <Camera className="h-6 w-6 stroke-[1.5]" />
                        <span className="mt-1 text-[9px] font-bold leading-tight">
                          ১ কপি পাসপোর্ট
                          <br />
                          সাইজ ছবি
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: 4 Data Fields Grid with Rounded Borders */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2 border-t border-emerald-800/15 text-xs sm:text-[13px]">
                  {/* ১। নাম */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 font-bold text-gray-900">১। নাম :</span>
                    <div className="flex-1 min-w-0 truncate rounded-lg border border-emerald-700/40 bg-white px-2.5 py-1 font-semibold text-gray-900 shadow-2xs">
                      {application.name_bn || application.name}
                    </div>
                  </div>

                  {/* ২। ফর্ম এর ক্রমিক/ রোল নং */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 font-bold text-gray-900 whitespace-nowrap">
                      ২। ফর্ম এর ক্রমিক/ রোল নং :
                    </span>
                    <div className="flex-1 min-w-0 truncate rounded-lg border border-emerald-700/40 bg-emerald-50/50 px-2.5 py-1 font-black font-mono text-[#006A4E] shadow-2xs">
                      {rollOrSerial}
                    </div>
                  </div>

                  {/* ৩। মোবাইল নং */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 font-bold text-gray-900">৩। মোবাইল নং :</span>
                    <div className="flex-1 min-w-0 truncate rounded-lg border border-emerald-700/40 bg-white px-2.5 py-1 font-semibold text-gray-800 shadow-2xs font-mono">
                      {application.phone || "—"}
                    </div>
                  </div>

                  {/* ৪। বিভাগ */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 font-bold text-gray-900">৪। বিভাগ :</span>
                    <div className="flex-1 min-w-0 truncate rounded-lg border border-emerald-700/40 bg-white px-2.5 py-1 font-semibold text-gray-800 shadow-2xs">
                      {application.department || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
