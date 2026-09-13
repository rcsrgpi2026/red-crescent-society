import { Sparkles, Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/shared/reveal";
import { getCustomPopupConfig } from "@/lib/queries";
import { CustomPopupForm } from "@/components/admin/custom-popup-form";

export const metadata = {
  title: "Custom Popup & Banner | Admin Dashboard",
  description: "Configure promotional poster popups, alerts, and announcement modals with custom action buttons and scheduling.",
};

export default async function AdminCustomPopupPage() {
  const popupConfig = await getCustomPopupConfig();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Sparkles}
        title="Custom Popup & Notice"
        description="Display a featured announcement poster, emergency alert, or event flyer on the website with custom button links and automatic scheduling."
        tone="bg-gradient-to-br from-emerald-600 to-teal-800"
      />

      <Reveal>
        <CustomPopupForm initialConfig={popupConfig} />
      </Reveal>
    </div>
  );
}
