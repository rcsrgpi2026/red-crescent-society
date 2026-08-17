import type { Metadata } from "next";
import { PortalShell } from "@/components/auth/portal-shell";
import { PortalAuth } from "@/components/auth/portal-auth";

export const metadata: Metadata = {
  title: "RCY Member Login",
  robots: { index: false, follow: false },
};

export default function VolunteerLoginPage() {
  return (
    <PortalShell kind="volunteer">
      <PortalAuth kind="volunteer" />
    </PortalShell>
  );
}
