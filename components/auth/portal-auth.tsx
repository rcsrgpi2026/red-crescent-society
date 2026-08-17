"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PortalLoginForm } from "@/components/auth/portal-login-form";
import { StudentRegisterForm } from "@/components/auth/student-register-form";
import { VolunteerRegisterForm } from "@/components/auth/volunteer-register-form";

type Mode = "login" | "register";

/**
 * Tabbed login / signup card for a portal. `kind` picks which register form
 * renders; the login form is shared by both portals (redirect is role-based).
 */
export function PortalAuth({ kind }: { kind: "student" | "volunteer" }) {
  const [mode, setMode] = useState<Mode>("login");
  const isStudent = kind === "student";

  return (
    <>
      <h2 className="text-xl font-bold text-foreground sm:text-2xl">
        {isStudent ? "Student sign in" : "RCY Member Login"}
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
        {isStudent
          ? "Access your student profile. Admins can sign in here too."
          : "Sign in to track your application and membership."}
      </p>

      <div
        className="mt-3.5 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1 sm:mt-6"
        role="tablist"
        aria-label={isStudent ? "Student account" : "Volunteer account"}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => setMode("login")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:py-2 sm:text-sm",
            mode === "login"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          onClick={() => setMode("register")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:py-2 sm:text-sm",
            mode === "register"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Create account
        </button>
      </div>

      <div className="mt-3.5 sm:mt-6">
        {mode === "login" ? (
          <PortalLoginForm />
        ) : isStudent ? (
          <StudentRegisterForm />
        ) : (
          <VolunteerRegisterForm />
        )}
      </div>

      <p className="mt-3.5 text-[11px] leading-snug text-muted-foreground sm:mt-6 sm:text-xs sm:leading-relaxed">
        {isStudent
          ? "Student accounts are activated immediately — no approval needed. Society leadership signs in here too."
          : "Volunteer applications are reviewed by the society leadership. You can sign in anytime to check your approval status."}
      </p>
    </>
  );
}
