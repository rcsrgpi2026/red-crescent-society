import { Suspense } from "react";
import type { Metadata } from "next";
import { PortalShell } from "@/components/auth/portal-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Forgot Password | Red Crescent Youth",
  description: "Reset your Red Crescent Youth portal account password.",
  robots: { index: false, follow: false },
};

function ForgotPasswordFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-crescent" />
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <PortalShell kind="recovery">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          Forgot your password?
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Enter your email address to receive a 6-digit verification code to reset your password.
        </p>
      </div>

      <Suspense fallback={<ForgotPasswordFallback />}>
        <ForgotPasswordForm />
      </Suspense>
    </PortalShell>
  );
}
