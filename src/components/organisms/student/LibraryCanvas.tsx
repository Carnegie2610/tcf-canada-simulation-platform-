"use client";

import { useEffect } from "react";

interface LibraryCanvasProps {
  children: React.ReactNode;
}

export function LibraryCanvas({ children }: LibraryCanvasProps) {
  useEffect(() => {
    function blockShortcut(e: KeyboardEvent) {
      const isModifier = e.ctrlKey || e.metaKey;
      if (!isModifier) return;
      const blocked = ["p", "s", "c", "a", "u"];
      if (blocked.includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function blockContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    document.addEventListener("keydown", blockShortcut, true);
    document.addEventListener("contextmenu", blockContextMenu, true);
    return () => {
      document.removeEventListener("keydown", blockShortcut, true);
      document.removeEventListener("contextmenu", blockContextMenu, true);
    };
  }, []);

  // Outer div handles scrolling; inner div applies the CSS shield
  return (
    <div>
      <div className="secure-canvas-wrapper">{children}</div>
    </div>
  );
}
