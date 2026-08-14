"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileAdminNav } from "@/components/admin/admin-sidebar";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line bg-white p-2 text-muted-foreground lg:hidden"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      {open && <MobileAdminNav onClose={() => setOpen(false)} />}
    </>
  );
}
