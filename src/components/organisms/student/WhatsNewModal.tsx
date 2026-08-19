"use client";

import { useEffect, useState } from "react";
import {
  WHATS_NEW_INTRO,
  WHATS_NEW_ITEMS,
  WHATS_NEW_TITLE,
} from "@/lib/whats-new";

/**
 * Marks this browser session as having already displayed the announcement. The
 * dashboard layout is a server component that re-runs on every navigation, so
 * without this the modal would reappear on each page change and spend the whole
 * multi-login budget in a single sitting.
 */
const SESSION_KEY = "objectif4c2:whats-new-shown";

/**
 * One-time-per-session announcement of recently shipped features. Rendered only
 * when the server has determined this student still has views remaining
 * (see shouldShowWhatsNew); this component decides whether *this particular
 * session* has already used one.
 */
export function WhatsNewModal() {
  // Starts closed so nothing flashes before the session check below runs.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) !== null;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private browsing / storage disabled: fall through and show it. Worst
      // case the student sees it on a navigation, which beats never seeing it.
    }
    if (alreadyShown) return;

    setOpen(true);
    // Spend one view now, on display, rather than on dismissal — see the API route.
    void fetch("/api/student/whats-new", { method: "POST" }).catch(() => {
      // Non-blocking: a failed count just means they may see it once more.
    });
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl border-2 border-[var(--slate-700)] bg-[var(--slate-900)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--slate-800)] px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-blue-text)]">
            Nouveautés
          </p>
          <h2
            id="whats-new-title"
            className="mt-1 text-lg font-extrabold text-[var(--brand-white)]"
          >
            {WHATS_NEW_TITLE}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--slate-400)]">
            {WHATS_NEW_INTRO}
          </p>
        </div>

        <ul className="max-h-[55vh] space-y-4 overflow-y-auto px-6 py-5">
          {WHATS_NEW_ITEMS.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="mt-0.5 text-xl leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--slate-200)]">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--slate-400)]">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-[var(--slate-800)] px-6 py-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            J&apos;ai compris, commencer
          </button>
        </div>
      </div>
    </div>
  );
}
