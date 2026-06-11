"use client";

import { useEffect, useRef } from "react";

interface ProtectedContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ProtectedContent({ children, className }: ProtectedContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const block = (e: Event) => e.preventDefault();

    const blockKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s" || e.key === "P" || e.key === "S")) {
        e.preventDefault();
      }
    };

    el.addEventListener("contextmenu", block);
    el.addEventListener("copy", block);
    el.addEventListener("keydown", blockKeys);

    return () => {
      el.removeEventListener("contextmenu", block);
      el.removeEventListener("copy", block);
      el.removeEventListener("keydown", blockKeys);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`select-none ${className ?? ""}`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {children}
    </div>
  );
}
