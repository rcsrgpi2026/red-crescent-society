"use client";

import { useState } from "react";
import {
  Mail,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Droplet,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailCampaign } from "@/types/database";

interface CampaignHistoryProps {
  campaigns: EmailCampaign[];
}

export function CampaignHistory({ campaigns }: CampaignHistoryProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);

  function getCategoryBadge(category: string) {
    switch (category) {
      case "notice":
        return { label: "Notice", icon: FileText, className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" };
      case "training":
        return { label: "Training", icon: GraduationCap, className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" };
      case "event":
        return { label: "Event", icon: Calendar, className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" };
      case "blood_appeal":
        return { label: "Blood Appeal", icon: Droplet, className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" };
      default:
        return { label: "Announcement", icon: Sparkles, className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" };
    }
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
        <Mail className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          No Campaigns Dispatched Yet
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          When you broadcast notices, training invitations, or emergency appeals, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Subject & Category</th>
                <th className="px-4 py-3">Target Audiences</th>
                <th className="px-4 py-3 text-center">Recipients</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Dispatched At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {campaigns.map((camp) => {
                const cat = getCategoryBadge(camp.category);
                const Icon = cat.icon;
                const formattedDate = new Date(camp.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <tr
                    key={camp.id}
                    className="transition hover:bg-slate-50/70 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            cat.className
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {cat.label}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {camp.subject}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {camp.heading}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {camp.target_audiences?.map((aud) => (
                          <span
                            key={aud}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
                          >
                            {aud.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {camp.sent_count} / {camp.total_recipients}
                      </div>
                      {camp.failed_count > 0 && (
                        <div className="text-[10px] font-medium text-red-500">
                          {camp.failed_count} failed
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                          camp.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : camp.status === "SENDING"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        )}
                      >
                        {camp.status === "COMPLETED" && <CheckCircle2 className="h-3 w-3" />}
                        {camp.status === "SENDING" && <Clock className="h-3 w-3 animate-spin" />}
                        {camp.status === "FAILED" && <AlertCircle className="h-3 w-3" />}
                        {camp.status}
                      </span>
                    </td>

                    <td
                      className="px-4 py-3.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap"
                      suppressHydrationWarning
                    >
                      {formattedDate}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCampaign(camp)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Eye className="h-3 w-3 text-slate-400" />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedCampaign.subject}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Campaign Details & Delivery Stats
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
              {/* Delivery Stats Bar */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center dark:bg-white/5">
                <div>
                  <span className="block text-slate-400">Total Audience</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedCampaign.total_recipients}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Successfully Sent</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedCampaign.sent_count}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Failed / Bounced</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {selectedCampaign.failed_count}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-white/10">
                <div className="font-bold text-slate-900 dark:text-white">
                  {selectedCampaign.heading}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedCampaign.body}
                </div>
                {selectedCampaign.button_text && selectedCampaign.button_url && (
                  <div className="pt-2">
                    <a
                      href={selectedCampaign.button_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg bg-crescent px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
                    >
                      {selectedCampaign.button_text} &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 p-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
