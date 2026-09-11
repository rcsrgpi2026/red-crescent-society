"use client";

import { useState } from "react";
import { CalendarDays, Sparkles, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Input, Label, Textarea, Checkbox } from "@/components/ui";
import { FieldError } from "@/components/admin/admin-form-dialog";
import { NoticeAttachmentsManager } from "@/components/admin/notice-attachments-manager";
import { NOTICE_CATEGORIES, EVENT_CATEGORIES, formatDate } from "@/lib/constants";
import type { Event } from "@/types/database";

export function NoticeFormFields({
  notice,
  attachments,
  events = [],
}: {
  notice?: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    category: string | null;
    pinned: boolean;
    published: boolean;
    event_id?: string | null;
  };
  attachments?: { url: string }[];
  events?: Event[];
}) {
  const initialMode = notice?.event_id ? "existing" : "none";
  const [eventMode, setEventMode] = useState<"none" | "create_new" | "existing">(initialMode);
  const [enableRegistration, setEnableRegistration] = useState(true);

  return (
    <div className="space-y-4">
      {notice && <input type="hidden" name="id" value={notice.id} />}

      <div>
        <Label htmlFor="n-title" className="text-sm font-semibold">Title (নোটিশের শিরোনাম)</Label>
        <Input
          id="n-title"
          name="title"
          defaultValue={notice?.title}
          placeholder="e.g. বার্ষিক রক্তদান ক্যাম্প ২০২৬ সংক্রান্ত বিজ্ঞপ্তি"
          className="mt-1.5 h-10"
          required
        />
        <FieldError name="title" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="sm:col-span-2">
          <Label htmlFor="n-slug" className="text-xs font-medium text-muted-foreground">Slug (ইউআরএল স্লাগ)</Label>
          <Input
            id="n-slug"
            name="slug"
            defaultValue={notice?.slug}
            placeholder="auto (খালি রাখলে শিরোনাম থেকে তৈরি হবে)"
            className="mt-1.5 h-9 text-xs"
          />
        </div>
        <div>
          <Label htmlFor="n-category" className="text-xs font-medium text-muted-foreground">Category (বিভাগ)</Label>
          <select
            id="n-category"
            name="category"
            defaultValue={notice?.category ?? NOTICE_CATEGORIES[0]}
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-white px-3 text-xs shadow-2xs"
          >
            {NOTICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Link / Create Section */}
      <div className="rounded-2xl border border-brand/20 bg-mist/40 p-4">
        <input type="hidden" name="event_mode" value={eventMode} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
            <CalendarDays className="h-4 w-4 text-brand" />
            ইভেন্ট সংযোগ (Event Option)
          </Label>
          <span className="text-xs text-muted-foreground">একসাথে ইভেন্ট ও নোটিশ পাবলিশ করতে পারেন</span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-1.5 rounded-xl border border-line/80 bg-white p-1 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setEventMode("none")}
            className={`flex items-center justify-center rounded-lg py-2 px-3 font-medium transition-all text-center ${
              eventMode === "none"
                ? "bg-foreground text-background shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-mist/60 hover:text-foreground"
            }`}
          >
            <span>সাধারণ নোটিশ (ইভেন্ট ছাড়া)</span>
          </button>
          <button
            type="button"
            onClick={() => setEventMode("create_new")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 font-medium transition-all text-center ${
              eventMode === "create_new"
                ? "bg-brand text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-mist/60 hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>নতুন ইভেন্ট তৈরি</span>
          </button>
          <button
            type="button"
            onClick={() => setEventMode("existing")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 font-medium transition-all text-center ${
              eventMode === "existing"
                ? "bg-poly text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-mist/60 hover:text-foreground"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
            <span>বিদ্যমান ইভেন্ট সংযোগ</span>
          </button>
        </div>

        {/* Mode: Create New Event Form inside Notice */}
        {eventMode === "create_new" && (
          <div className="mt-4 space-y-4 rounded-xl border border-brand/20 bg-white p-4 sm:p-5 shadow-2xs animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand pb-2 border-b border-brand/10">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>ইভেন্টের সেটিংস (Notice সেভ করার সাথে সাথে এই Event-টিও তৈরি হয়ে যাবে)</span>
            </div>

            <div>
              <Label htmlFor="ev-title" className="text-xs font-medium">
                ইভেন্টের নাম (ঐচ্ছিক - খালি রাখলে নোটিশের নামই ব্যবহার হবে)
              </Label>
              <Input
                id="ev-title"
                name="event_title"
                placeholder="Notice-এর শিরোনাম ব্যবহার হবে"
                className="mt-1.5 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label htmlFor="ev-date" className="text-xs font-medium">
                  তারিখ (Date) *
                </Label>
                <Input
                  id="ev-date"
                  name="event_date"
                  type="date"
                  required={eventMode === "create_new"}
                  className="mt-1.5 h-9 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="ev-time" className="text-xs font-medium">
                  সময় (Time)
                </Label>
                <Input
                  id="ev-time"
                  name="event_time"
                  placeholder="e.g. 10:00 AM"
                  className="mt-1.5 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label htmlFor="ev-location" className="text-xs font-medium">
                  ভেন্যু / স্থান (Location)
                </Label>
                <Input
                  id="ev-location"
                  name="event_location"
                  placeholder="e.g. RGPI Auditorium"
                  className="mt-1.5 h-9 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="ev-category" className="text-xs font-medium">
                  ইভেন্ট ক্যাটাগরি
                </Label>
                <select
                  id="ev-category"
                  name="event_category"
                  defaultValue={EVENT_CATEGORIES[0]}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-white px-2.5 text-xs shadow-2xs"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Registration Settings */}
            <div className="rounded-xl border border-line bg-mist/30 p-3.5 space-y-3.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                <Checkbox
                  name="event_registration_enabled"
                  checked={enableRegistration}
                  onCheckedChange={(c) => setEnableRegistration(Boolean(c))}
                />
                অনলাইন রেজিস্ট্রেশন অপশন চালু রাখুন (Enable Registration)
              </label>

              {enableRegistration && (
                <div className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="ev-reg-type" className="text-[11px] font-medium text-muted-foreground">
                        রেজিস্ট্রেশন মাধ্যম (Registration Method)
                      </Label>
                      <select
                        id="ev-reg-type"
                        name="event_registration_type"
                        defaultValue="BUILT_IN"
                        className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2.5 text-xs shadow-2xs"
                      >
                        <option value="BUILT_IN">ওয়েবসাইটে নিজস্ব রেজিস্ট্রেশন ফর্ম (Built-in Form)</option>
                        <option value="EXTERNAL">বাহ্যিক লিংক / গুগল ফর্ম (Google Form / External Link)</option>
                        <option value="BOTH">উভয়ই (ওয়েবসাইট ফর্ম + গুগল ফর্ম লিংক)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="ev-seats" className="text-[11px] font-medium text-muted-foreground">
                        সর্বোচ্চ আসন সংখ্যা (ঐচ্ছিক - খালি রাখলে আনলিমিটেড)
                      </Label>
                      <Input
                        id="ev-seats"
                        name="event_max_participants"
                        type="number"
                        min={1}
                        placeholder="e.g. 50"
                        className="mt-1 h-9 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ev-reg-link" className="text-[11px] font-medium text-muted-foreground">
                      গুগল ফর্ম বা এক্সটার্নাল লিংক (ঐচ্ছিক - URL)
                    </Label>
                    <Input
                      id="ev-reg-link"
                      name="event_registration_link"
                      type="url"
                      placeholder="https://forms.gle/... বা https://forms.office.com/..."
                      className="mt-1 h-9 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ev-reg-inst" className="text-[11px] font-medium text-muted-foreground">
                      রেজিস্ট্রেশন নির্দেশনা ও শর্তাবলি (ফি, নিয়ম বা অতিরিক্ত বিবরণ)
                    </Label>
                    <Textarea
                      id="ev-reg-inst"
                      name="event_registration_instructions"
                      rows={2}
                      placeholder="e.g. রেজিস্ট্রেশন ফি ৫০ টাকা অথবা শুধুমাত্র ৩য় পর্বের শিক্ষার্থীদের জন্য প্রযোজ্য।"
                      className="mt-1 text-xs bg-white resize-y"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode: Select Existing Event */}
        {eventMode === "existing" && (
          <div className="mt-3 animate-in fade-in-50 duration-200">
            {events.length > 0 ? (
              <div>
                <Label htmlFor="n-event-select" className="text-xs">
                  বিদ্যমান ইভেন্ট নির্বাচন করুন
                </Label>
                <select
                  id="n-event-select"
                  name="event_id"
                  defaultValue={notice?.event_id ?? ""}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-xs"
                >
                  <option value="">-- কোনো ইভেন্ট নয় --</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} {e.date ? `(${formatDate(e.date)})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-white p-3 text-xs text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>বর্তমানে কোনো ইভেন্ট তৈরি নেই। আপনি উপরের &ldquo;নতুন ইভেন্ট তৈরি&rdquo; ট্যাব বেছে নিতে পারেন।</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="n-content">Content (বিজ্ঞপ্তির বিস্তারিত বিবরণ)</Label>
        <Textarea
          id="n-content"
          name="content"
          defaultValue={notice?.content ?? ""}
          rows={5}
          className="mt-1.5"
          placeholder="নোটিশের বিস্তারিত বক্তব্য এখানে লিখুন..."
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox name="published" defaultChecked={notice?.published ?? true} />
          Published (visible immediately)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox name="pinned" defaultChecked={notice?.pinned} />
          Pinned (highlighted on top)
        </label>
      </div>

      <NoticeAttachmentsManager
        initialAttachments={attachments}
      />
    </div>
  );
}
