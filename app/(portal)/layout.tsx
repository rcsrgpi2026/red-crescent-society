import "../globals.css";
import "./print.css";

import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { LogoProvider } from "@/components/providers/logo-provider";
import { messages as enMessages } from "@/lib/i18n/messages";
import { fontVariables } from "@/lib/fonts";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function PortalRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-white text-foreground antialiased">
        <TooltipProvider delayDuration={200}>
          <LocaleProvider locale="en" t={enMessages}>
            <LogoProvider>{children}</LogoProvider>
          </LocaleProvider>
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
