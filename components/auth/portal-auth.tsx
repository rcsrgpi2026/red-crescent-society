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
      <h2 className="mt-4 text-2xl font-bold text-foreground">
        {isStudent ? "Student sign in" : "Volunteer sign in"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isStudent
          ? "Access your student profile. Admins can sign in here too."
          : "Sign in to track your application and membership."}
      </p>

      <div
        className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1"
        role="tablist"
        aria-label={isStudent ? "Student account" : "Volunteer account"}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => setMode("login")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
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
            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            mode === "register"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Create account
        </button>
      </div>

      <div className="mt-6">
        {mode === "login" ? (
          <PortalLoginForm />
        ) : isStudent ? (
          <StudentRegisterForm />
        ) : (
          <VolunteerRegisterForm />
        )}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        {isStudent
          ? "Student accounts are activated immediately — no approval needed. Society leadership signs in here too."
          : "Volunteer applications are reviewed by the society leadership. You can sign in anytime to check your approval status."}
      </p>
    </>
  );
}
