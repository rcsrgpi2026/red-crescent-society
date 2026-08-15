"use client";

import { useEffect, useState } from "react";
import { getUnreadMessageCount } from "@/lib/admin-actions";

/**
 * Red-dot unread indicator for the Messages nav item. Renders a small red
 * badge with the number of unread (status = NEW) contact messages, and keeps
 * itself fresh by re-querying the server every few seconds — so a new message
 * shows up and reading messages makes the dot disappear without a manual
 * refresh.
 */
export function UnreadDot({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const n = await getUnreadMessageCount();
        if (!cancelled) setCount(n);
      } catch {
        // Transient network/refresh errors: keep the last known value.
      }
    }
    refresh();
    const id = setInterval(refresh, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span
      className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm"
      title={`${count} unread message${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
