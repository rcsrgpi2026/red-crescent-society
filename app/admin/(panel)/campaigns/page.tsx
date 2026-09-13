import { Mail, History, Send, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/shared/reveal";
import { getCampaignResources, getPastCampaigns } from "@/lib/campaign-actions";
import { CampaignComposer } from "@/components/admin/campaigns/campaign-composer";
import { CampaignHistory } from "@/components/admin/campaigns/campaign-history";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Email Campaigns | Admin Dashboard",
  description: "Compose, preview, and broadcast branded email campaigns to registered students, volunteers, donors, and blood requesters using Gmail-safe burst batching.",
};

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "history" ? "history" : "compose";

  const [resources, pastCampaigns] = await Promise.all([
    getCampaignResources(),
    getPastCampaigns(),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Mail}
        title="Email Campaigns & Broadcasts"
        description="Broadcast official circulars, training invitations, event announcements, and emergency blood appeals with Gmail-safe burst throttling."
        tone="bg-gradient-to-br from-red-600 via-rose-700 to-slate-900"
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10">
        <a
          href="/admin/campaigns?tab=compose"
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "compose"
              ? "border-crescent text-crescent font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          Compose & Broadcast
        </a>

        <a
          href="/admin/campaigns?tab=history"
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "history"
              ? "border-crescent text-crescent font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Past Campaigns ({pastCampaigns.length})
        </a>
      </div>

      {/* Tab Content */}
      <Reveal>
        {activeTab === "compose" ? (
          <CampaignComposer
            resources={resources}
            currentUserEmail={user?.email || "redcrescentyouthrgpi@gmail.com"}
          />
        ) : (
          <CampaignHistory campaigns={pastCampaigns} />
        )}
      </Reveal>
    </div>
  );
}
