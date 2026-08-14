import type { Metadata } from "next";
import { PortalShell } from "@/components/auth/portal-shell";
import { PortalAuth } from "@/components/auth/portal-auth";

export const metadata: Metadata = {
  title: "Student Login",
  robots: { index: false, follow: false },
};

export default function StudentLoginPage() {
  return (
    <PortalShell kind="student">
      <PortalAuth kind="student" />
    </PortalShell>
  );
}
