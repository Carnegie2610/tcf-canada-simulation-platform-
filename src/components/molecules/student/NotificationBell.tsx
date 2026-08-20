"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudentNotification } from "@/lib/student/notifications";

interface NotificationBellProps {
  initialItems: StudentNotification[];
  initialUnread: number;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function NotificationBell({ initialItems, initialUnread }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function markRead(toMark: StudentNotification[]) {
    if (toMark.length === 0) return;
    const ids = new Set(toMark.map((i) => `${i.source}:${i.id}`));
    // Optimistic: the badge should clear the moment it's clicked, not after a
    // round-trip. A failed call just means it reappears on the next page load.
    setItems((prev) =>
      prev.map((i) => (ids.has(`${i.source}:${i.id}`) ? { ...i, read: true } : i))
    );
    setUnread((prev) => Math.max(0, prev - toMark.length));

    try {
      await fetch("/api/student/notifications/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: toMark.map((i) => ({ source: i.source, id: i.id })),
        }),
      });
    } catch {
      // Non-blocking by design (see above).
    }
  }

  function handleItemClick(item: StudentNotification) {
    if (!item.read) void markRead([item]);
    setOpen(false);
    if (item.href) router.push(item.href);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `${unread} notification(s) non lue(s)` : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[var(--slate-700)] text-[var(--slate-300)] transition-colors hover:bg-[var(--slate-800)]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-[var(--slate-800)] px-4 py-3">
            <p className="text-sm font-bold text-[var(--brand-white)]">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => void markRead(items.filter((i) => !i.read))}
                className="text-xs text-[var(--accent-blue-text)] hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--slate-500)]">
                Aucune notification pour le moment.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={`${item.source}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full gap-3 border-b border-[var(--slate-800)]/60 px-4 py-3 text-left transition-colors hover:bg-[var(--slate-800)]/60 ${
                    item.read ? "" : "bg-blue-950/20"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-base" aria-hidden="true">
                    {item.source === "announcement" ? "📢" : "💬"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={`text-xs ${item.read ? "font-medium text-[var(--slate-300)]" : "font-bold text-[var(--brand-white)]"}`}>
                        {item.title}
                      </span>
                      {!item.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
                      )}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] leading-relaxed text-[var(--slate-400)]">
                      {item.body}
                    </span>
                    <span className="mt-1 block text-[10px] text-[var(--slate-500)]">
                      {timeAgo(item.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
