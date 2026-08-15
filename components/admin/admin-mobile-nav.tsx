"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { MobileAdminNav } from "@/components/admin/admin-sidebar";

export function AdminMobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the drawer is open so the page behind never
  // scrolls and no horizontal overflow appears.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close on Escape, like a proper dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line bg-white p-2 text-muted-foreground lg:hidden"
        aria-label="Open admin menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <MobileAdminNav onClose={() => setOpen(false)} unreadMessages={unreadMessages} />
      )}
    </>
  );
}
