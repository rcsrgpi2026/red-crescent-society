import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { messages as enMessages } from "@/lib/i18n/messages";
import { fontVariables } from "@/lib/fonts";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
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
      <body className="flex min-h-full flex-col">
        <TooltipProvider delayDuration={200}>
          <LocaleProvider locale="en" t={enMessages}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </LocaleProvider>
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
