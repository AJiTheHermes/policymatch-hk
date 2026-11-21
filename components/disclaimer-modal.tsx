"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

const KEY = "policymatch.disclaimer.v1";

/** First visit only. The text is a plain statement of scope, not a legal notice,
 *  and it is stored so it never blocks someone mid-question later.
 *
 *  Audit fix: focus used to escape this dialog on Tab, and the only way out was
 *  the single button. It now traps focus, closes on Escape or a click outside,
 *  and offers the two documents the notice refers to. */
export function DisclaimerModal() {
  const { prefs, ready } = usePrefs();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const s = (k: string) => t(prefs.lang, k);

  useEffect(() => {
    if (!ready) return;
    try {
      if (localStorage.getItem(KEY) !== "accepted") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [ready]);

  const close = () => {
    try {
      localStorage.setItem(KEY, "accepted");
    } catch {
      /* storage blocked: the notice shows again next visit */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const root = panel.current;
      if (!root) return;
      const list = Array.from(
        root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1620]/55 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-title"
        aria-describedby="dm-body"
        className="w-full max-w-[560px] border border-line bg-paper p-6 shadow-none"
      >
        <h2 id="dm-title" className="text-[22px] font-bold">
          {s("medicalTitle")}
        </h2>
        <p id="dm-body" className="mt-3 text-[16px] leading-relaxed text-slate">
          {s("medicalBody")}
        </p>
        <p className="mt-3 border-l-2 border-line pl-3 text-[14px] text-slate">{s("medicalPrivacy")}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            autoFocus
            onClick={close}
            className="min-h-[48px] bg-ink px-6 py-3 text-[16px] font-bold text-white hover:bg-brand-dark"
          >
            {s("medicalAccept")}
          </button>
          <Link href="/privacy" onClick={close} className="text-[14px] underline">
            {s("privacy")}
          </Link>
          <Link href="/terms" onClick={close} className="text-[14px] underline">
            {s("terms")}
          </Link>
        </div>
      </div>
    </div>
  );
}
