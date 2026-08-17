import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { LogoProvider } from "@/components/providers/logo-provider";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { getSettings } from "@/lib/queries";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [t, settings] = await Promise.all([getServerMessages(), getSettings()]);
  // The society name set in Admin → Settings is used as the site name, falling
  // back to the bundled translation when no custom name has been saved yet.
  const siteName =
    typeof settings.society?.name === "string" && settings.society.name.trim()
      ? settings.society.name.trim()
      : t.meta.siteName;
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    ),
    title: {
      default: `${siteName} | ${t.home.heroDefaultTitle}`,
      template: `%s | ${siteName}`,
    },
    description: t.meta.siteDescription,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName,
      title: siteName,
      description: t.meta.siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: t.meta.siteDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#006f45",
  width: "device-width",
  initialScale: 1,
};


export default async function PublicRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const t = await getServerMessages();
  const settings = await getSettings();
  const society = settings.society ?? {};
  const asString = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  // Server-provided logos: render the uploaded logos in the first paint so the
  // placeholder SVGs never flash before the custom ones load.
  const logos = settings.logos ?? {};
  // Origins the site talks to at runtime: Google Fonts (the card fonts loaded
  // on the member card pages) and Supabase storage (activity/album photos).
  const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https?:\/\//, "");

  return (
    <html
      lang={locale}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {supabaseHost && (
          <link rel="preconnect" href={`https://${supabaseHost}`} crossOrigin="anonymous" />
        )}
      </head>
      <body className="flex min-h-full flex-col">
        <TooltipProvider delayDuration={200}>
          <LocaleProvider locale={locale} t={t}>
            <LogoProvider
              initialLogos={{
                rpi: asString(logos.rpi) ?? null,
                rcs: asString(logos.rcs) ?? null,
              }}
            >
              <SiteHeader
                societyName={asString(society.shortName)}
                siteName={asString(society.name)}
                collegeName={asString(society.collegeName)}
                tagline={asString(society.tagline)}
              />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </LogoProvider>
          </LocaleProvider>
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
