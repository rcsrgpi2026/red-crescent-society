"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Send,
  Users,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  FileText,
  Calendar,
  Sparkles,
  Droplet,
  GraduationCap,
  Play,
  Pause,
  RefreshCw,
  Search,
  ExternalLink,
  Smartphone,
  Monitor,
  Clock,
  Layers,
  Info,
  User,
  UserPlus,
  UserCheck,
  UserMinus,
  Target,
  Plus,
  X,
  CheckSquare,
  Square,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeCampaignUrl } from "@/lib/campaign-utils";
import { FacebookIcon, InstagramIcon } from "@/components/shared/social-icons";
import {
  getAudienceContacts,
  searchIndividualMembers,
  sendTestCampaignEmail,
  createCampaignRecord,
  dispatchCampaignBatch,
  type RecipientContact,
  type AudienceStatsResult,
} from "@/lib/campaign-actions";
import type { CampaignAudience, CampaignCategory } from "@/types/database";

interface ResourceNotice {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  category: string | null;
}

interface ResourceEvent {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  description: string | null;
}

interface CampaignComposerProps {
  resources: {
    notices: ResourceNotice[];
    events: ResourceEvent[];
  };
  currentUserEmail?: string;
  onCampaignCreated?: () => void;
}

const CATEGORIES: Array<{
  id: CampaignCategory;
  label: string;
  icon: any;
  defaultBadge: string;
  color: string;
}> = [
  {
    id: "notice",
    label: "Notice / Announcement",
    icon: FileText,
    defaultBadge: "Official Notice",
    color: "from-blue-600 to-indigo-700",
  },
  {
    id: "training",
    label: "Training Workshop",
    icon: GraduationCap,
    defaultBadge: "Training Alert",
    color: "from-emerald-600 to-teal-700",
  },
  {
    id: "event",
    label: "Event & Drive",
    icon: Calendar,
    defaultBadge: "Event Invitation",
    color: "from-purple-600 to-indigo-800",
  },
  {
    id: "blood_appeal",
    label: "Blood Appeal",
    icon: Droplet,
    defaultBadge: "Urgent Blood Appeal",
    color: "from-red-600 to-rose-700",
  },
  {
    id: "announcement",
    label: "General Message",
    icon: Sparkles,
    defaultBadge: "Community Update",
    color: "from-slate-700 to-slate-900",
  },
];

const BLOOD_GROUPS = ["ALL", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export function CampaignComposer({
  resources,
  currentUserEmail = "",
  onCampaignCreated,
}: CampaignComposerProps) {
  const [isPending, startTransition] = useTransition();

  // Category & Presets
  const [category, setCategory] = useState<CampaignCategory>("notice");
  const [selectedNoticeId, setSelectedNoticeId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  // Audience State
  const [audienceMode, setAudienceMode] = useState<"segment" | "individual" | "both">("segment");
  const [selectedAudiences, setSelectedAudiences] = useState<CampaignAudience[]>([
    "students",
    "volunteers",
  ]);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("ALL");
  const [audienceData, setAudienceData] = useState<AudienceStatsResult | null>(null);
  const [isLoadingAudience, setIsLoadingAudience] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");

  // Individual Recipients State
  const [individualRecipients, setIndividualRecipients] = useState<RecipientContact[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<RecipientContact[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");

  // Live Member Search
  useEffect(() => {
    const q = memberSearchQuery.trim();
    if (q.length < 2) {
      setMemberSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearchingMembers(true);
      searchIndividualMembers(q)
        .then((res) => setMemberSearchResults(res))
        .catch(console.error)
        .finally(() => setIsSearchingMembers(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [memberSearchQuery]);

  function addIndividualRecipient(contact: RecipientContact) {
    if (!individualRecipients.some((r) => r.email.toLowerCase() === contact.email.toLowerCase())) {
      setIndividualRecipients((prev) => [...prev, contact]);
    }
    setMemberSearchQuery("");
    setMemberSearchResults([]);
  }

  function removeIndividualRecipient(email: string) {
    setIndividualRecipients((prev) =>
      prev.filter((r) => r.email.toLowerCase() !== email.toLowerCase())
    );
  }

  function handleAddManualEmail() {
    const clean = manualEmail.trim().toLowerCase();
    if (!clean || !clean.includes("@")) return;
    addIndividualRecipient({
      email: clean,
      name: manualName.trim() || null,
      type: "Direct Recipient",
      details: "Manual Entry",
    });
    setManualEmail("");
    setManualName("");
  }

  // Deselected / Excluded individual emails
  const [excludedEmails, setExcludedEmails] = useState<string[]>([]);
  const [modalFilterTab, setModalFilterTab] = useState<"all" | "selected" | "excluded">("all");
  const [inlineMemberSearch, setInlineMemberSearch] = useState("");
  const [isMemberListExpanded, setIsMemberListExpanded] = useState(true);

  // Raw contacts aggregated from segments and individual picks
  const rawContacts: RecipientContact[] = (() => {
    const map = new Map<string, RecipientContact>();
    if (audienceMode !== "individual" && audienceData?.contacts) {
      for (const c of audienceData.contacts) {
        map.set(c.email.toLowerCase(), c);
      }
    }
    if (audienceMode !== "segment" && individualRecipients.length > 0) {
      for (const ind of individualRecipients) {
        map.set(ind.email.toLowerCase(), ind);
      }
    }
    return Array.from(map.values());
  })();

  // Filtered by exclusion to get the final active recipient list
  const activeContacts: RecipientContact[] = rawContacts.filter(
    (c) => !excludedEmails.includes(c.email.toLowerCase())
  );

  const excludedContacts: RecipientContact[] = rawContacts.filter((c) =>
    excludedEmails.includes(c.email.toLowerCase())
  );

  const totalRawRecipients = rawContacts.length;
  const totalActiveRecipients = activeContacts.length;
  const totalExcludedRecipients = excludedContacts.length;

  const filteredInlineContacts = rawContacts.filter((c) => {
    if (!inlineMemberSearch.trim()) return true;
    const q = inlineMemberSearch.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      c.type.toLowerCase().includes(q) ||
      (c.details && c.details.toLowerCase().includes(q))
    );
  });

  function toggleRecipientInclusion(email: string) {
    const lower = email.toLowerCase();
    setExcludedEmails((prev) =>
      prev.includes(lower) ? prev.filter((e) => e !== lower) : [...prev, lower]
    );
  }

  function selectAllRecipients() {
    setExcludedEmails([]);
  }

  function deselectAllRecipients() {
    const all = rawContacts.map((c) => c.email.toLowerCase());
    setExcludedEmails(all);
  }

  function selectFilteredRecipients(contactsToInclude: RecipientContact[]) {
    const includeSet = new Set(contactsToInclude.map((c) => c.email.toLowerCase()));
    setExcludedEmails((prev) => prev.filter((e) => !includeSet.has(e)));
  }

  function deselectFilteredRecipients(contactsToExclude: RecipientContact[]) {
    const toExclude = contactsToExclude.map((c) => c.email.toLowerCase());
    setExcludedEmails((prev) => Array.from(new Set([...prev, ...toExclude])));
  }

  // Email Content State
  const [badge, setBadge] = useState("Official Notice");
  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [secondaryInfo, setSecondaryInfo] = useState("");
  const [buttonText, setButtonText] = useState("Read Full Notice");
  const [buttonUrl, setButtonUrl] = useState("");

  // Preview Mode State
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Test Email State
  const [testEmail, setTestEmail] = useState(currentUserEmail || "redcrescentyouthrgpi@gmail.com");
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  // Batching & Dispatch State
  const [batchSize, setBatchSize] = useState<number>(10);
  const [delaySeconds, setDelaySeconds] = useState<number>(2.5);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    sentCount: number;
    failedCount: number;
    totalRecipients: number;
    isFinished: boolean;
  }>({
    currentBatch: 0,
    totalBatches: 0,
    sentCount: 0,
    failedCount: 0,
    totalRecipients: 0,
    isFinished: false,
  });

  const abortDispatchRef = useRef(false);

  function handleCancelDispatch() {
    abortDispatchRef.current = true;
    setDispatchLogs((prev) => ["⛔ Broadcast stopping by administrator request...", ...prev]);
  }

  // Fetch Audience Contacts whenever selections change
  useEffect(() => {
    if (selectedAudiences.length === 0) {
      setAudienceData({
        totalUnique: 0,
        breakdown: { students: 0, volunteers: 0, donors: 0, blood_requesters: 0, event_registrants: 0 },
        contacts: [],
      });
      return;
    }

    setIsLoadingAudience(true);
    getAudienceContacts(selectedAudiences, { bloodGroup: selectedBloodGroup })
      .then((res) => {
        setAudienceData(res);
      })
      .catch((err) => {
        console.error("Audience load error:", err);
      })
      .finally(() => {
        setIsLoadingAudience(false);
      });
  }, [selectedAudiences, selectedBloodGroup]);

  // Dynamic origin helper to avoid static DDNS domain triggers in spam filters
  const getBaseAppUrl = () => {
    if (typeof window !== "undefined" && window.location.origin) {
      if (!window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1")) {
        return window.location.origin;
      }
    }
    return "https://rgpircy.vercel.app";
  };

  // Handle Category Change & Default Templates
  function handleCategorySelect(cat: CampaignCategory) {
    setCategory(cat);
    const catConfig = CATEGORIES.find((c) => c.id === cat);
    setBadge(catConfig?.defaultBadge || "Announcement");
    const origin = getBaseAppUrl();

    if (cat === "notice") {
      setSubject("Important Notice: Red Crescent Youth RGPI");
      setHeading("New Official Notice Published");
      setBody(
        "Please review the latest circular and instructions published by the Red Crescent Youth unit. All members are requested to stay informed regarding upcoming activities and administrative directives."
      );
      setButtonText("View Notice Online");
      setButtonUrl(`${origin}/notices`);
      setSecondaryInfo("Rajshahi Govt. Polytechnic Institute • Red Crescent Youth Unit");
    } else if (cat === "training") {
      setSubject("Training Invitation: Basic First Aid & Disaster Management");
      setHeading("Upcoming Skills & Certification Workshop");
      setBody(
        "We are pleased to announce an upcoming hands-on training session organized by Red Crescent Youth RGPI.\n\nParticipants will learn life-saving first aid techniques, CPR methods, and emergency response coordination. Certificates of participation will be awarded upon successful completion."
      );
      setButtonText("Register for Training");
      setButtonUrl(`${origin}/volunteer`);
      setSecondaryInfo("Date: Next Saturday • Time: 10:00 AM • Venue: RCY RGPI Youth Office");
    } else if (cat === "event") {
      setSubject("Invitation: RCY Community Humanitarian Drive");
      setHeading("Join Us in Our Upcoming Humanitarian Event");
      setBody(
        "Our humanitarian mission continues with our upcoming field event. We invite all volunteers, students, and supporters to participate actively and help us make a difference in our community."
      );
      setButtonText("Explore Event Details");
      setButtonUrl(`${origin}/events`);
      setSecondaryInfo("Organizer: Red Crescent Youth Unit, Rajshahi");
    } else if (cat === "blood_appeal") {
      setSubject("Urgent Blood Request: O+ Blood Needed Urgently");
      setHeading("Emergency Blood Donor Appeal");
      setBody(
        "An urgent request for voluntary blood donation has been received for a critical patient.\n\nIf you or someone in your network is available and eligible to donate, please contact the coordinator or visit the blood bank immediately."
      );
      setButtonText("Respond / View Contact");
      setButtonUrl(`${origin}/blood-support`);
      setSecondaryInfo("Patient: Critical Care Unit • Hospital: Rajshahi Medical College Hospital (RMCH)");
      // Auto select blood donors
      setSelectedAudiences(["donors", "volunteers"]);
    } else {
      setSubject("Updates & Community Bulletin");
      setHeading("Red Crescent Youth Portal Updates");
      setBody(
        "Greetings from Red Crescent Youth RGPI. We are sharing important updates and accomplishments from our unit."
      );
      setButtonText("Open RCY Portal");
      setButtonUrl(origin);
      setSecondaryInfo("");
    }
  }

  // Handle Notice Import
  function handleNoticeSelect(noticeId: string) {
    setSelectedNoticeId(noticeId);
    if (!noticeId) return;
    const n = resources.notices.find((item) => item.id === noticeId);
    if (!n) return;
    const origin = getBaseAppUrl();

    setSubject(`Notice: ${n.title}`);
    setHeading(n.title);
    setBody(n.content || "Please read the full notice on the official Red Crescent Youth portal.");
    setBadge(n.category ? `Notice: ${n.category}` : "Official Notice");
    setButtonText("Read Notice Online");
    setButtonUrl(`${origin}/notices/${n.slug}`);
    setSecondaryInfo("Official circular issued by Red Crescent Youth RGPI");
  }

  // Handle Event Import
  function handleEventSelect(eventId: string) {
    setSelectedEventId(eventId);
    if (!eventId) return;
    const ev = resources.events.find((item) => item.id === eventId);
    if (!ev) return;
    const origin = getBaseAppUrl();

    setSubject(`Event: ${ev.title}`);
    setHeading(ev.title);
    setBody(
      ev.description ||
        "You are cordially invited to participate in this upcoming event organized by Red Crescent Youth RGPI."
    );
    setBadge("Upcoming Event");
    setButtonText("View Event & Register");
    setButtonUrl(`${origin}/events/${ev.slug}`);
    setSecondaryInfo(
      `Date: ${ev.date || "Announced soon"} • Time: ${ev.time || "TBA"} • Venue: ${ev.location || "RGPI Campus"}`
    );
  }

  // Toggle Audience Checkbox
  function toggleAudience(aud: CampaignAudience) {
    setSelectedAudiences((prev) =>
      prev.includes(aud) ? prev.filter((a) => a !== aud) : [...prev, aud]
    );
  }

  // Send Test Email
  async function handleSendTest() {
    if (!testEmail || !testEmail.includes("@")) {
      setTestStatus({ loading: false, success: false, message: "Please enter a valid email address." });
      return;
    }

    setTestStatus({ loading: true });
    try {
      const res = await sendTestCampaignEmail({
        recipientEmail: testEmail,
        subject,
        heading,
        body,
        badge,
        buttonText,
        buttonUrl: sanitizeCampaignUrl(buttonUrl),
        secondaryInfo,
      });
      setTestStatus({
        loading: false,
        success: res.success,
        message: res.message,
      });
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || "Failed to send test email.",
      });
    }
  }

  // Sleep utility for throttle delays
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Launch Campaign with Batching
  async function handleLaunchCampaign() {
    if (totalActiveRecipients === 0) {
      alert("No recipients selected! Please choose audience segments or add individual recipients.");
      return;
    }
    if (!subject.trim() || !heading.trim() || !body.trim()) {
      alert("Please fill in the Subject, Heading, and Body of the email.");
      return;
    }

    const confirmMsg =
      totalActiveRecipients === 1
        ? `Send this email to ${activeContacts[0].name ? `${activeContacts[0].name} (${activeContacts[0].email})` : activeContacts[0].email}?`
        : `Are you sure you want to broadcast this campaign to ${totalActiveRecipients} recipient(s)?\n\nEmails will be dispatched in batches of ${batchSize} with a ${delaySeconds}s delay to comply with Gmail SMTP limits.`;

    if (!window.confirm(confirmMsg)) return;

    abortDispatchRef.current = false;
    setIsDispatching(true);
    setIsPaused(false);
    setDispatchLogs([]);

    try {
      const contacts = activeContacts;
      const totalRecipients = contacts.length;
      const numBatches = Math.ceil(totalRecipients / batchSize);
      const safeButtonUrl = sanitizeCampaignUrl(buttonUrl);

      // Create database record
      let campaignId: string | null = null;
      try {
        const rec = await createCampaignRecord({
          subject,
          category,
          badge,
          heading,
          body,
          button_text: buttonText,
          button_url: safeButtonUrl || null,
          target_audiences: selectedAudiences,
          total_recipients: totalRecipients,
        });
        campaignId = rec.id;
      } catch (e: any) {
        console.error("Failed to create campaign log:", e);
      }

      setProgress({
        currentBatch: 0,
        totalBatches: numBatches,
        sentCount: 0,
        failedCount: 0,
        totalRecipients,
        isFinished: false,
      });

      let currentSent = 0;
      let currentFailed = 0;

      for (let i = 0; i < numBatches; i++) {
        if (abortDispatchRef.current) {
          setDispatchLogs((prev) => ["🛑 Dispatch aborted by administrator.", ...prev]);
          break;
        }

        const startIdx = i * batchSize;
        const endIdx = Math.min(startIdx + batchSize, totalRecipients);
        const batchSlice = contacts.slice(startIdx, endIdx);

        const batchSummary = `[Batch ${i + 1}/${numBatches}] Sending to ${batchSlice.length} recipient(s)...`;
        setDispatchLogs((prev) => [batchSummary, ...prev]);

        try {
          // Generous client timeout so large batches or dev compilation never abort prematurely
          const batchTimeoutMs = Math.max(90000, batchSlice.length * 10000);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Timeout: SMTP server took over ${Math.round(batchTimeoutMs / 1000)} seconds to respond.`)),
              batchTimeoutMs
            )
          );

          const batchRes = await Promise.race([
            dispatchCampaignBatch({
              campaignId,
              batch: batchSlice.map((c) => ({ email: c.email, name: c.name })),
              campaign: {
                subject,
                heading,
                body,
                badge,
                buttonText,
                buttonUrl: safeButtonUrl,
                secondaryInfo,
              },
            }),
            timeoutPromise,
          ]);

          currentSent += batchRes.successCount;
          currentFailed += batchRes.failedCount;

          const successLog = `✓ Batch ${i + 1} completed: ${batchRes.successCount} sent, ${batchRes.failedCount} failed`;
          setDispatchLogs((prev) => [successLog, ...prev]);

          if (batchRes.errors && batchRes.errors.length > 0) {
            batchRes.errors.forEach((err: { email: string; error: string }) => {
              setDispatchLogs((prev) => [`⚠ ${err.email}: ${err.error}`, ...prev]);
            });
          }

          setProgress({
            currentBatch: i + 1,
            totalBatches: numBatches,
            sentCount: currentSent,
            failedCount: currentFailed,
            totalRecipients,
            isFinished: i === numBatches - 1,
          });

          // Delay between batches if not the last batch and not aborted
          if (i < numBatches - 1 && !abortDispatchRef.current) {
            const waitMsg = `⏳ Pausing for ${delaySeconds}s (Gmail burst protection)...`;
            setDispatchLogs((prev) => [waitMsg, ...prev]);
            await sleep(delaySeconds * 1000);
          }
        } catch (batchErr: any) {
          currentFailed += batchSlice.length;
          const errLog = `✗ Batch ${i + 1} encountered error: ${batchErr.message || "Failed"}`;
          setDispatchLogs((prev) => [errLog, ...prev]);

          setProgress({
            currentBatch: i + 1,
            totalBatches: numBatches,
            sentCount: currentSent,
            failedCount: currentFailed,
            totalRecipients,
            isFinished: i === numBatches - 1,
          });
        }
      }
    } finally {
      setIsDispatching(false);
      if (onCampaignCreated) onCampaignCreated();
    }
  }

  // Filtered contacts for recipient modal (based on rawContacts)
  const filteredContacts = rawContacts.filter((c) => {
    const matchesSearch =
      recipientSearch.trim() === "" ||
      c.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(recipientSearch.toLowerCase())) ||
      c.type.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      (c.details && c.details.toLowerCase().includes(recipientSearch.toLowerCase()));

    if (!matchesSearch) return false;

    const isExcluded = excludedEmails.includes(c.email.toLowerCase());
    if (modalFilterTab === "selected") return !isExcluded;
    if (modalFilterTab === "excluded") return isExcluded;
    return true;
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* LEFT COLUMN: Controls & Composer Form */}
      <div className="space-y-6 lg:col-span-7">
        {/* 1. Category Preset Tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Layers className="h-4 w-4 text-crescent" />
            1. Campaign Category & Starter Template
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                    isSelected
                      ? "border-crescent bg-crescent/5 font-semibold text-crescent shadow-sm dark:bg-crescent/10"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSelected ? "text-crescent" : "text-slate-500 dark:text-slate-400")} />
                  <span className="text-xs leading-snug">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Importers from existing Notices / Events */}
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-white/5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Or pull from an existing Notice:
              </label>
              <select
                value={selectedNoticeId}
                onChange={(e) => handleNoticeSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-crescent focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">-- Choose Notice --</option>
                {resources.notices.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title.length > 40 ? `${n.title.slice(0, 40)}...` : n.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Or pull from an upcoming Event:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-crescent focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">-- Choose Event --</option>
                {resources.events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title.length > 40 ? `${ev.title.slice(0, 40)}...` : ev.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Target Audience & Recipients */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4 text-crescent" />
              2. Target Audience & Recipients
            </label>
            {totalRawRecipients > 0 && (
              <button
                type="button"
                onClick={() => setShowRecipientModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-crescent hover:border-crescent hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-slate-800"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Select / Deselect ({totalActiveRecipients}/{totalRawRecipients})</span>
              </button>
            )}
          </div>

          {/* Audience Mode Selector (Tabs) */}
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold dark:bg-white/5">
            <button
              type="button"
              onClick={() => setAudienceMode("segment")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 transition",
                audienceMode === "segment"
                  ? "bg-white text-crescent shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Group Segments</span>
            </button>
            <button
              type="button"
              onClick={() => setAudienceMode("individual")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 transition",
                audienceMode === "individual"
                  ? "bg-white text-crescent shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Specific Person(s)</span>
            </button>
            <button
              type="button"
              onClick={() => setAudienceMode("both")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 transition",
                audienceMode === "both"
                  ? "bg-white text-crescent shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Combined</span>
            </button>
          </div>

          {/* Group Segments Checkboxes (Modes: segment & both) */}
          {(audienceMode === "segment" || audienceMode === "both") && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {[
                  { id: "students" as CampaignAudience, label: "Registered Students", count: audienceData?.breakdown.students },
                  { id: "volunteers" as CampaignAudience, label: "Active Volunteers", count: audienceData?.breakdown.volunteers },
                  { id: "donors" as CampaignAudience, label: "Blood Donors", count: audienceData?.breakdown.donors },
                  { id: "blood_requesters" as CampaignAudience, label: "Blood Requesters", count: audienceData?.breakdown.blood_requesters },
                  { id: "event_registrants" as CampaignAudience, label: "Event Registrants", count: audienceData?.breakdown.event_registrants },
                ].map((aud) => {
                  const isChecked = selectedAudiences.includes(aud.id);
                  return (
                    <label
                      key={aud.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all",
                        isChecked
                          ? "border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/20"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 dark:border-white/10 dark:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAudience(aud.id)}
                          className="h-4 w-4 rounded border-slate-300 text-crescent focus:ring-crescent"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          {aud.label}
                        </span>
                      </div>
                      {aud.count !== undefined && (
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-white/15 dark:text-slate-200">
                          {aud.count}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Blood Group Sub-Filter when Donors are selected */}
              {selectedAudiences.includes("donors") && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50/60 p-3 text-xs dark:bg-rose-950/20">
                  <Droplet className="h-4 w-4 text-crescent" />
                  <span className="font-medium text-rose-900 dark:text-rose-200">Donor Blood Group Filter:</span>
                  <select
                    value={selectedBloodGroup}
                    onChange={(e) => setSelectedBloodGroup(e.target.value)}
                    className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-300"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg === "ALL" ? "All Blood Groups" : bg}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient Selection & Exclusion Control Panel */}
              {rawContacts.length > 0 && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          Individual Member Checklist ({totalActiveRecipients} of {totalRawRecipients} Selected)
                        </span>
                        {totalExcludedRecipients > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {totalExcludedRecipients} Deselected
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        Select or deselect members to choose who will receive this email.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={selectAllRecipients}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllRecipients}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        Deselect All
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRecipientModal(true)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-crescent hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-crescent"
                        title="Full Screen Recipient Manager"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMemberListExpanded(!isMemberListExpanded)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-300"
                        title={isMemberListExpanded ? "Collapse" : "Expand"}
                      >
                        {isMemberListExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search & Checklist Content */}
                  {isMemberListExpanded && (
                    <div className="mt-3 space-y-2.5">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={inlineMemberSearch}
                          onChange={(e) => setInlineMemberSearch(e.target.value)}
                          placeholder="Search members by name, roll, or email..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                        {inlineMemberSearch && (
                          <button
                            type="button"
                            onClick={() => setInlineMemberSearch("")}
                            className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Scrollable Members List */}
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                        {filteredInlineContacts.map((c) => {
                          const isSelected = !excludedEmails.includes(c.email.toLowerCase());
                          return (
                            <div
                              key={c.email}
                              onClick={() => toggleRecipientInclusion(c.email)}
                              className={cn(
                                "group flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition-all",
                                isSelected
                                  ? "border-slate-200 bg-white hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:border-white/10 dark:bg-slate-800/80"
                                  : "border-dashed border-slate-300 bg-slate-50/60 opacity-65 hover:opacity-90 dark:border-white/10 dark:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all",
                                    isSelected
                                      ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                                      : "border-slate-300 bg-white text-transparent dark:border-white/20 dark:bg-slate-800"
                                  )}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </div>
                                <div>
                                  <span
                                    className={cn(
                                      "font-semibold",
                                      isSelected
                                        ? "text-slate-900 dark:text-white"
                                        : "text-slate-500 line-through decoration-slate-400 dark:text-slate-400"
                                    )}
                                  >
                                    {c.name || "Member"}
                                  </span>
                                  <span className="ml-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    {c.email}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-right">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                    isSelected
                                      ? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  )}
                                >
                                  {isSelected ? c.type : "Deselected"}
                                </span>
                                {c.details && (
                                  <span className="hidden sm:inline text-[10px] text-slate-400">
                                    {c.details}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {filteredInlineContacts.length === 0 && (
                          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            No members found matching &quot;{inlineMemberSearch}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary Chips for Excluded Members */}
                  {totalExcludedRecipients > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] dark:border-white/5">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        Excluded from send:
                      </span>
                      {excludedContacts.slice(0, 8).map((c) => (
                        <span
                          key={c.email}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          <span>{c.name || c.email}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRecipientInclusion(c.email);
                            }}
                            className="rounded-full text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-200"
                            title="Re-include member"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {totalExcludedRecipients > 8 && (
                        <span className="text-[10px] text-slate-400">
                          +{totalExcludedRecipients - 8} more
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={selectAllRecipients}
                        className="ml-auto font-bold text-crescent hover:underline"
                      >
                        Re-include All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Specific Individuals Section (Modes: individual & both) */}
          {(audienceMode === "individual" || audienceMode === "both") && (
            <div className={cn("space-y-3", audienceMode === "both" && "mt-4 border-t border-slate-100 pt-4 dark:border-white/5")}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Search & Pick Registered Members or Add Custom Email:
                </span>
                {individualRecipients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIndividualRecipients([])}
                    className="text-[11px] text-slate-400 hover:text-red-500"
                  >
                    Clear all ({individualRecipients.length})
                  </button>
                )}
              </div>

              {/* Live Member Search Box */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Type name, roll number, or email to search registered students/volunteers..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  {isSearchingMembers && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-crescent" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {memberSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-slate-800">
                    {memberSearchResults.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addIndividualRecipient(m)}
                        className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {m.name || "Member"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.email}</div>
                        </div>
                        <div className="text-right">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                            {m.type}
                          </span>
                          {m.details && (
                            <div className="text-[10px] text-slate-400">{m.details}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Manual Email Input */}
              <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 dark:bg-white/5 sm:flex-row">
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Or enter custom email (e.g. principal@rgpi.edu.bd)..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddManualEmail();
                    }
                  }}
                />
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Name (Optional)"
                  className="w-full sm:w-36 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddManualEmail();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddManualEmail}
                  disabled={!manualEmail || !manualEmail.includes("@")}
                  className="flex shrink-0 items-center justify-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-white/20 dark:hover:bg-white/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {/* Selected Individual Badges / Chips */}
              {individualRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {individualRecipients.map((ind, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 py-1 pl-3 pr-2 text-xs font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                    >
                      <User className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{ind.name ? `${ind.name} (${ind.email})` : ind.email}</span>
                      <button
                        type="button"
                        onClick={() => removeIndividualRecipient(ind.email)}
                        className="rounded-full p-0.5 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary bar */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100/80 px-3.5 py-2.5 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              {isLoadingAudience ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-crescent" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
              Active Selected Recipients:
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {isLoadingAudience ? "Calculating..." : `${totalActiveRecipients} recipient${totalActiveRecipients === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {/* 3. Email Content Fields */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Mail className="h-4 w-4 text-crescent" />
            3. Compose Email Message
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Header Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Official Notice"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Email Subject Line <span className="text-crescent">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject of the email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Main Banner Heading <span className="text-crescent">*</span>
            </label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Headline displayed inside the email card"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Message Body (Paragraphs separated by blank lines) <span className="text-crescent">*</span>
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here. Separate paragraphs with an empty line..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Highlight Info Box (Optional: Venue, Schedule, or Emergency Details)
            </label>
            <input
              type="text"
              value={secondaryInfo}
              onChange={(e) => setSecondaryInfo(e.target.value)}
              placeholder="e.g. Date: 15 Oct • Venue: RGPI Auditorium • Time: 10 AM"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Button Text (Optional)
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="e.g. View Notice Online"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Button Link / URL
                </label>
                {buttonUrl && (
                  <a
                    href={sanitizeCampaignUrl(buttonUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-crescent hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Test Link
                  </a>
                )}
              </div>
              <input
                type="text"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                onBlur={() => setButtonUrl((prev) => sanitizeCampaignUrl(prev))}
                placeholder="e.g. https://rgpircy.vercel.app or /notices"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 4. Batch Throttling & Test Email Configuration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4 text-crescent" />
            4. Gmail SMTP Burst Protection Settings
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Batch Size (Emails per Chunk)
              </label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-crescent focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
              >
                <option value={5}>5 emails per batch (Ultra Safe)</option>
                <option value={10}>10 emails per batch (Recommended)</option>
                <option value={15}>15 emails per batch (Standard)</option>
                <option value={20}>20 emails per batch (Fast)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Throttle Delay Between Batches
              </label>
              <select
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-crescent focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
              >
                <option value={1.5}>1.5 seconds</option>
                <option value={2.5}>2.5 seconds (Recommended)</option>
                <option value={4}>4.0 seconds</option>
                <option value={5}>5.0 seconds (High burst safety)</option>
              </select>
            </div>
          </div>

          {/* Test Email Section */}
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/5">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Send a Real Test Preview Before Broadcasting:
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter your email to receive a test"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={testStatus.loading || !testEmail}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-crescent shadow-sm transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
              >
                {testStatus.loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-crescent" />
                ) : (
                  <Send className="h-3.5 w-3.5 text-crescent" />
                )}
                Send Test Email
              </button>
            </div>

            {testStatus.message && (
              <div
                className={cn(
                  "mt-2 flex items-center gap-2 rounded-lg p-2.5 text-xs",
                  testStatus.success
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                )}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Trigger Button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLaunchCampaign}
            disabled={isDispatching || totalActiveRecipients === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-crescent hover:bg-crescent-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDispatching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Dispatching Batches...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Launch Campaign ({totalActiveRecipients} Recipient{totalActiveRecipients === 1 ? "" : "s"})
              </>
            )}
          </button>

          {isDispatching && (
            <button
              type="button"
              onClick={handleCancelDispatch}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3.5 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
            >
              <X className="h-4 w-4" />
              Stop Dispatch
            </button>
          )}
        </div>

        {/* Live Batch Dispatch Console */}
        {isDispatching || progress.totalBatches > 0 ? (
          <div className="rounded-2xl border border-slate-300 bg-white p-5 text-black shadow-md dark:border-slate-300 dark:bg-white dark:text-black">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-700">
                {progress.isFinished ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                )}
                {progress.isFinished ? "Campaign Broadcast Completed" : "Batch Dispatch in Progress"}
              </span>
              <span className="text-xs font-black text-black dark:text-black">
                Batch {progress.currentBatch} of {progress.totalBatches}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{
                  width: `${
                    progress.totalBatches > 0
                      ? (progress.currentBatch / progress.totalBatches) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Stat Counters */}
            <div className="mb-4 grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="rounded-xl bg-slate-100 p-2.5 border border-slate-300 dark:bg-slate-100 dark:border-slate-300">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-black">Delivered</span>
                <span className="text-xl font-black text-black dark:text-black">{progress.sentCount}</span>
              </div>
              <div className="rounded-xl bg-slate-100 p-2.5 border border-slate-300 dark:bg-slate-100 dark:border-slate-300">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-black">Failed</span>
                <span className="text-xl font-black text-black dark:text-black">{progress.failedCount}</span>
              </div>
              <div className="rounded-xl bg-slate-100 p-2.5 border border-slate-300 dark:bg-slate-100 dark:border-slate-300">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-black">Total</span>
                <span className="text-xl font-black text-black dark:text-black">{progress.totalRecipients}</span>
              </div>
            </div>

            {/* Live Terminal Log */}
            <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-100 p-3.5 font-mono text-[12px] font-bold leading-relaxed text-black border border-slate-300 dark:bg-slate-100 dark:border-slate-300 dark:text-black">
              {dispatchLogs.map((log, index) => (
                <div key={index} className="py-0.5 text-black font-bold dark:text-black" style={{ color: "#000000" }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* RIGHT COLUMN: Live Interactive Email Preview */}
      <div className="space-y-4 lg:col-span-5">
        <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Eye className="h-4 w-4 text-crescent" />
              Live Inbox Preview
            </span>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "rounded-md p-1.5 text-xs transition",
                  previewDevice === "desktop"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                )}
                title="Desktop View"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={cn(
                  "rounded-md p-1.5 text-xs transition",
                  previewDevice === "mobile"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                )}
                title="Mobile View"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Email Subject line indicator */}
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-white/5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Subject: </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {subject || "(No subject provided yet)"}
            </span>
          </div>

          {/* Simulated Email Canvas */}
          <div className="flex justify-center overflow-x-auto rounded-xl bg-slate-100 p-3 dark:bg-slate-950/60">
            <div
              className={cn(
                "overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-200 dark:border dark:border-white/10 dark:bg-slate-900",
                previewDevice === "desktop" ? "w-full max-w-[500px]" : "w-[320px]"
              )}
            >
              {/* Header */}
              <div className="border-t-4 border-b border-slate-100 border-t-crescent bg-white p-6 text-left dark:border-b-white/5 dark:bg-slate-900">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-crescent">
                  {badge || "Official Circular"}
                </span>
                <h3 className="mt-1 text-base font-bold leading-snug text-slate-900 dark:text-white">
                  {heading || "Your Headline Here"}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Red Crescent Youth &bull; Rajshahi Govt. Polytechnic Institute
                </p>
              </div>

              {/* Content */}
              <div className="p-6 text-slate-800 dark:text-slate-200">
                <p className="mb-3 text-xs font-bold text-slate-900 dark:text-white">
                  Dear RCY Member,
                </p>

                <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {body
                    ? body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)
                    : <p className="italic text-slate-400">Your email body paragraphs will appear here...</p>}
                </div>

                {/* Secondary Info Box */}
                {secondaryInfo && (
                  <div className="my-4 rounded-lg border-l-4 border-crescent bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    {secondaryInfo}
                  </div>
                )}

                {/* CTA Button */}
                {buttonText && buttonUrl && (
                  <div className="my-6 text-center">
                    <a
                      href={sanitizeCampaignUrl(buttonUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-crescent px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/20 transition hover:brightness-110"
                    >
                      <span>{buttonText}</span>
                      <ExternalLink className="h-3 w-3 opacity-80" />
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 text-center text-[10px] leading-relaxed text-slate-400 dark:border-white/5 dark:bg-slate-950">
                {/* Social Links Placeholders */}
                <div className="mb-3 flex items-center justify-center gap-2">
                  <a
                    href="https://facebook.com/rcsrgpi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#1877f2]/10 px-3 py-1 text-[11px] font-semibold text-[#1877f2] transition hover:bg-[#1877f2] hover:text-white"
                  >
                    <FacebookIcon className="h-3.5 w-3.5" />
                    <span>Facebook</span>
                  </a>
                  <a
                    href="https://instagram.com/rcy_rgpi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-1 text-[11px] font-semibold text-pink-600 transition hover:bg-pink-600 hover:text-white dark:text-pink-400"
                  >
                    <InstagramIcon className="h-3.5 w-3.5" />
                    <span>Instagram</span>
                  </a>
                </div>

                &copy; {new Date().getFullYear()} Red Crescent Youth, RGPI.<br />
                Serving humanity with dignity and impartiality.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECIPIENTS SELECTION & MANAGEMENT MODAL */}
      {showRecipientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Select / Deselect Recipients
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {totalActiveRecipients} of {totalRawRecipients} Selected
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Uncheck any members whom you do not want to receive this email campaign.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecipientModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="border-b border-slate-100 p-4 space-y-3 dark:border-white/5">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setModalFilterTab("all")}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition",
                      modalFilterTab === "all"
                        ? "bg-white font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                  >
                    All ({totalRawRecipients})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalFilterTab("selected")}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition",
                      modalFilterTab === "selected"
                        ? "bg-white font-bold text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-400"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                  >
                    Selected ({totalActiveRecipients})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalFilterTab("excluded")}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition",
                      modalFilterTab === "excluded"
                        ? "bg-white font-bold text-amber-700 shadow-sm dark:bg-slate-800 dark:text-amber-400"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                  >
                    Deselected ({totalExcludedRecipients})
                  </button>
                </div>

                {/* Quick Bulk Selection */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => selectFilteredRecipients(filteredContacts)}
                    className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => deselectFilteredRecipients(filteredContacts)}
                    className="font-semibold text-amber-700 hover:underline dark:text-amber-400"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Search by name, email, roll, department, or role..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-crescent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                {recipientSearch && (
                  <button
                    type="button"
                    onClick={() => setRecipientSearch("")}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* List with Checkboxes */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1.5">
                {filteredContacts.map((c) => {
                  const isSelected = !excludedEmails.includes(c.email.toLowerCase());
                  return (
                    <div
                      key={c.email}
                      onClick={() => toggleRecipientInclusion(c.email)}
                      className={cn(
                        "group flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs transition-all",
                        isSelected
                          ? "border-slate-200 bg-white hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-emerald-500/40"
                          : "border-dashed border-slate-300 bg-slate-50/70 opacity-75 hover:opacity-100 dark:border-white/10 dark:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                            isSelected
                              ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                              : "border-slate-300 bg-white text-transparent dark:border-white/20 dark:bg-slate-800"
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div
                            className={cn(
                              "font-semibold",
                              isSelected
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-500 line-through decoration-slate-400 dark:text-slate-400"
                            )}
                          >
                            {c.name || "Anonymous Member"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {c.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                              isSelected
                                ? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            )}
                          >
                            {isSelected ? c.type : "Excluded"}
                          </span>
                          {c.details && (
                            <div className="mt-0.5 text-[10px] text-slate-400">{c.details}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredContacts.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-40 text-slate-400" />
                    No members matched your search criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-white/10">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Total <strong className="text-slate-900 dark:text-white">{totalActiveRecipients}</strong> of {totalRawRecipients} will receive this email.
              </div>
              <button
                type="button"
                onClick={() => setShowRecipientModal(false)}
                className="rounded-xl bg-crescent px-5 py-2 text-xs font-bold text-white shadow-md shadow-red-500/20 hover:brightness-110"
              >
                Done ({totalActiveRecipients} Selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
