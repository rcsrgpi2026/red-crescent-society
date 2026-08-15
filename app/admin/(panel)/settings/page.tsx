import { Settings } from "lucide-react";
import { SettingsForm } from "@/components/admin/settings-form";
import { HeroImagesForm } from "@/components/admin/hero-images-form";
import { LogoManager } from "@/components/admin/logo-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/shared/reveal";
import { getSettings } from "@/lib/queries";
import { POINT_CATEGORIES } from "@/lib/constants";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  const society = settings.society ?? {};
  const contact = settings.contact ?? {};
  const social = settings.social ?? {};
  const emergency = settings.emergency ?? {};
  const homepage = settings.homepage ?? {};
  const points = settings.points ?? {};

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Settings}
        title="Website Settings"
        description="Content shown across the public website — contact details, social links, emergency info and homepage text. These fields are safe to display publicly."
        tone="bg-gradient-to-br from-slate-600 to-slate-800"
      />

      <Reveal>
        <SettingsForm
          title="Society information"
          description="Name and description used in the header, footer and metadata."
          group="society"
          fields={[
            { key: "name", label: "Society name" },
            { key: "shortName", label: "Short name" },
            { key: "collegeName", label: "College / institute name" },
            { key: "tagline", label: "Tagline" },
            { key: "description", label: "Short description", type: "textarea" },
          ]}
          values={society}
        />
      </Reveal>

      <Reveal delay={0.05}>
        <SettingsForm
          title="Contact information"
          description="Shown on the contact page and footer."
          group="contact"
          fields={[
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address", type: "textarea" },
            { key: "officeHours", label: "Office hours" },
          ]}
          values={contact}
        />
      </Reveal>

      <Reveal delay={0.1}>
        <SettingsForm
          title="Social links"
          description="Leave empty to hide a link. Only safe, official links should be added."
          group="social"
          fields={[
            { key: "facebook", label: "Facebook URL" },
            { key: "youtube", label: "YouTube URL" },
            { key: "instagram", label: "Instagram URL" },
            { key: "twitter", label: "X / Twitter URL" },
          ]}
          values={social}
        />
      </Reveal>

      <Reveal delay={0.15}>
        <SettingsForm
          title="Emergency contacts"
          description="Shown in the emergency section and footer. Only real, verified numbers."
          group="emergency"
          fields={[
            { key: "bloodHelpline", label: "Blood helpline number" },
            { key: "societyContact", label: "Society emergency contact" },
            { key: "message", label: "Emergency message", type: "textarea" },
          ]}
          values={emergency}
        />
      </Reveal>

      <Reveal delay={0.2}>
        <SettingsForm
          title="Homepage"
          description="Hero headline and subtitle on the homepage."
          group="homepage"
          fields={[
            { key: "heroTitle", label: "Hero title" },
            { key: "heroSubtitle", label: "Hero subtitle", type: "textarea" },
          ]}
          values={homepage}
        />
      </Reveal>

      <Reveal delay={0.25}>
        <HeroImagesForm defaultValue={String(homepage.heroImages ?? "")} />
      </Reveal>

      <Reveal delay={0.28}>
        <LogoManager
          defaultValue={{
            rpi: String(settings.logos?.rpi ?? ""),
            rcs: String(settings.logos?.rcs ?? ""),
          }}
        />
      </Reveal>

      <Reveal delay={0.3}>
        <SettingsForm
          title="Points system"
          description="Point values awarded for different contributions."
          group="points"
          fields={[
            { key: "eventParticipation", label: "Event participation", type: "number" },
            { key: "training", label: "Training completed", type: "number" },
            { key: "bloodDonation", label: "Blood donation", type: "number" },
            { key: "campaignParticipation", label: "Campaign participation", type: "number" },
            { key: "leadership", label: "Leadership", type: "number" },
          ]}
          values={{
            eventParticipation: points.eventParticipation ?? POINT_CATEGORIES.EVENT_PARTICIPATION,
            training: points.training ?? POINT_CATEGORIES.TRAINING,
            bloodDonation: points.bloodDonation ?? POINT_CATEGORIES.BLOOD_DONATION,
            campaignParticipation: points.campaignParticipation ?? POINT_CATEGORIES.CAMPAIGN_PARTICIPATION,
            leadership: points.leadership ?? POINT_CATEGORIES.LEADERSHIP,
          }}
        />
      </Reveal>
    </div>
  );
}
