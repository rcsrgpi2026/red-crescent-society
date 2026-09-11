import type { Metadata } from "next";
import { PortalShell } from "@/components/auth/portal-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set New Password | Red Crescent Youth",
  description: "Set a new secure password for your Red Crescent Youth portal account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <PortalShell kind="recovery">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          Set new password
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Please enter and confirm your new account password below.
        </p>
      </div>

      <ResetPasswordForm />
    </PortalShell>
  );
}
