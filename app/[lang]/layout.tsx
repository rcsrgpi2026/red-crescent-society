import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { LogoProvider } from "@/components/providers/logo-provider";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    ),
    title: {
      default: `${t.meta.siteName} | ${t.home.heroDefaultTitle}`,
      template: `%s | ${t.meta.siteName}`,
    },
    description: t.meta.siteDescription,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: t.meta.siteName,
      title: t.meta.siteName,
      description: t.meta.siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.siteName,
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

  return (
    <html
      lang={locale}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider delayDuration={200}>
          <LocaleProvider locale={locale} t={t}>
            <LogoProvider>
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </LogoProvider>
          </LocaleProvider>
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
