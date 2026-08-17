import "../globals.css";

import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { LogoProvider } from "@/components/providers/logo-provider";
import { messages as enMessages } from "@/lib/i18n/messages";
import { getSettings } from "@/lib/queries";
import { fontVariables } from "@/lib/fonts";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const logos = settings.logos ?? {};
  const asString = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  return (
    <html
      lang="en"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-mist text-foreground antialiased">
        <TooltipProvider delayDuration={200}>
          <LocaleProvider locale="en" t={enMessages}>
            <LogoProvider
              initialLogos={{
                rpi: asString(logos.rpi) ?? null,
                rcs: asString(logos.rcs) ?? null,
              }}
            >
              {children}
            </LogoProvider>
          </LocaleProvider>
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
