import { SlidersHorizontal } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FormEditorClient } from "@/components/admin/form-editor/form-editor-client";
import { getFormConfigs } from "@/lib/queries";

export const metadata = {
  title: "Form Editor | Admin Panel",
  robots: { index: false, follow: false },
};

export default async function AdminFormEditorPage() {
  const configs = await getFormConfigs();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={SlidersHorizontal}
        title="Form Editor (কাস্টম ফর্ম এডিটর)"
        description="ওয়েবসাইটের বিভিন্ন পাবলিক ফর্মের ফিল্ডগুলো অ্যাডমিনের প্রয়োজন অনুযায়ী চালু/বন্ধ করুন, বাধ্যতামূলক বা ঐচ্ছিক নির্ধারণ করুন, অথবা নতুন ফিল্ড যোগ করুন।"
        tone="bg-gradient-to-br from-poly via-brand to-brand-dark"
      />

      <FormEditorClient initialConfigs={configs} />
    </div>
  );
}
