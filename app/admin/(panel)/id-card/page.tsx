import { CreditCard } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { IdCardDesignEditor } from "@/components/admin/id-card-editor";
import { getSettings, adminGetTeamMembers } from "@/lib/queries";
import { designFromSettings, memberFromTeamMember } from "@/lib/id-card/config";
import { DEFAULT_MEMBER_DATA } from "@/lib/id-card/constants";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminIdCardPage() {
  const [settings, members] = await Promise.all([
    getSettings(),
    adminGetTeamMembers({ status: "APPROVED", limit: 1 }),
  ]);
  const design = designFromSettings(settings);
  // Preview the design with a real approved member when one exists.
  let previewMember = members[0]
    ? memberFromTeamMember(members[0])
    : DEFAULT_MEMBER_DATA;
  // Always show a sample RCY Dept. row in the designer preview so admins can
  // see how it renders and how the Fields & Labels toggle affects it, even
  // when the preview member has no RCY department assigned yet.
  if (!previewMember.customFields?.some((cf) => cf.id === "rcy-dept")) {
    previewMember = {
      ...previewMember,
      customFields: [
        ...(previewMember.customFields ?? []),
        {
          id: "rcy-dept",
          label: "RCY Dept.",
          value: "Disaster & Humanitarian Response",
          visible: true,
          order: 0,
        },
      ],
    };
  }
  const previewPhoto = members[0]?.photo_url ?? null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={CreditCard}
        title="ID Card Designer"
        description="Design the official membership card — logos, watermark, colors, typography, footer and back side. Changes apply instantly to every team member's card in their profile."
        tone="bg-gradient-to-br from-brand to-brand-dark"
      />
      <IdCardDesignEditor initialDesign={design} previewMember={previewMember} previewPhoto={previewPhoto} />
    </div>
  );
}
