import type { Metadata } from "next";
import { DonorDirectory } from "@/components/blood/donor-directory";
import { BloodMenuButtons } from "@/components/blood/blood-menu-buttons";
import { getDonors, getPublicBloodRequests, getDonorGroupCounts } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.blood.title,
    description: t.meta.blood.description,
  };
}

export default async function BloodSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ bloodGroup?: string; area?: string }>;
}) {
  const [t, params] = await Promise.all([
    getServerMessages(),
    searchParams,
  ]);
  const [allDonors, allRequests, groupCounts] = await Promise.all([
    getDonors(),
    getPublicBloodRequests(),
    getDonorGroupCounts(),
  ]);

  const activeRequests = allRequests.filter(
    (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
  );

  return (
    <div className="bg-slate-50/60 min-h-screen py-5 sm:py-8 lg:py-10">
      <div className="container-site space-y-4 sm:space-y-6">
        {/* Clean, minimal header without extra text */}
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-crescent" />
            Blood Support
          </h1>
          {activeRequests.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-crescent/20 px-3 py-1 text-xs font-bold text-crescent">
              <span className="h-1.5 w-1.5 rounded-full bg-crescent animate-ping" />
              {activeRequests.length} Emergency Requests
            </span>
          )}
        </div>

        {/* 1. Square Type Menu Action Buttons */}
        <BloodMenuButtons
          activeRequests={activeRequests}
          strings={{ contactRequest: t.contactRequest }}
        />

        {/* 2. Donor List with Square Blood Group Filter Buttons */}
        <DonorDirectory
          allDonors={allDonors}
          initialBloodGroup={params.bloodGroup}
          initialArea={params.area}
          counts={groupCounts}
        />
      </div>
    </div>
  );
}
