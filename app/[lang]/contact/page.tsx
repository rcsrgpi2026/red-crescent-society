import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { ContactForm } from "@/components/forms/contact-form";
import { getSettings } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.contact.title,
    description: t.meta.contact.description,
  };
}

export default async function ContactPage() {
  const [t, settings] = await Promise.all([getServerMessages(), getSettings()]);
  const contact = settings.contact ?? {};

  const items = [
    {
      icon: MapPin,
      title: t.contact.address,
      lines: [
        typeof contact.address === "string" && contact.address
          ? contact.address
          : t.contact.addressFallback,
      ],
    },
    {
      icon: Mail,
      title: t.contact.email,
      lines: [
        typeof contact.email === "string" && contact.email ? contact.email : t.contact.fromAdminPanel,
      ],
      href: typeof contact.email === "string" && contact.email ? `mailto:${contact.email}` : undefined,
    },
    {
      icon: Phone,
      title: t.contact.phone,
      lines: [
        typeof contact.phone === "string" && contact.phone
          ? contact.phone
          : t.contact.fromAdminPanel,
      ],
      href: typeof contact.phone === "string" && contact.phone ? `tel:${contact.phone}` : undefined,
    },
    {
      icon: Clock,
      title: t.contact.officeHours,
      lines: [
        typeof contact.officeHours === "string" && contact.officeHours
          ? contact.officeHours
          : t.contact.officeHoursFallback,
      ],
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={t.contact.heroEyebrow}
        title={t.contact.heroTitle}
        description={t.contact.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_1.2fr] lg:py-20">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item.title} className="rounded-2xl border border-line bg-mist/50 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                  {item.lines.map((line, i) =>
                    item.href ? (
                      <a
                        key={i}
                        href={item.href}
                        className="mt-1 block text-sm text-brand-dark hover:underline"
                      >
                        {line}
                      </a>
                    ) : (
                      <p key={i} className="mt-1 text-sm text-muted-foreground">
                        {line}
                      </p>
                    )
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-line bg-mist/50 p-5">
              <h3 className="text-sm font-semibold text-foreground">{t.contact.dropByTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.contact.dropByText}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-foreground">{t.contact.sendUsMessage}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.contact.sendUsMessageText}</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
