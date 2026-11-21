"use client";

import Link from "next/link";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { usePrefs, type Theme } from "@/lib/prefs";
import { POLICY_PDF_URL } from "@/lib/sources";

export function SiteHeader() {
  const { prefs, setLang, setTheme, setScale } = usePrefs();
  const s = (k: string) => t(prefs.lang, k);

  const SCALES: { id: "normal" | "large" | "xlarge"; label: string; title: string }[] = [
    { id: "normal", label: "A", title: s("scaleNormal") },
    { id: "large", label: "A+", title: s("scaleLarge") },
    { id: "xlarge", label: "A++", title: s("scaleXLarge") },
  ];

  return (
    <>
      <div className="border-b border-line bg-[#f2f4f6] text-[13px] text-slate dark:bg-mist">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-1.5">
          <span>
            {s("proto")} · {s("protoNote")}
          </span>
          <span className="hidden sm:inline">{s("version")}</span>
        </div>
      </div>

      <header className="bg-brand text-paper">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
          <Link href="/" className="flex items-baseline gap-3 no-underline">
            <span className="text-[24px] font-bold tracking-tight text-paper">
              PolicyMatch <span className="text-[#9fc3e0]">HK</span>
            </span>
            <span className="hidden text-[15px] text-[#c8d8e6] sm:inline">{s("brand")}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <div className="flex items-stretch border border-[#3d6488]" role="group" aria-label={s("langLabel")}>
              {LANGS.map((l, i) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id as Lang)}
                  aria-pressed={prefs.lang === l.id}
                  className={`min-h-[40px] px-2.5 ${i > 0 ? "border-l border-[#3d6488]" : ""} ${
                    prefs.lang === l.id ? "bg-paper font-bold text-brand" : "text-[#dce7f1] hover:bg-[#1b4a72]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex items-stretch border border-[#3d6488]" role="group" aria-label={s("themeLabel")}>
              {(["light", "dark"] as Theme[]).map((th, i) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => setTheme(th)}
                  aria-pressed={prefs.theme === th}
                  className={`min-h-[40px] px-2.5 ${i > 0 ? "border-l border-[#3d6488]" : ""} ${
                    prefs.theme === th ? "bg-paper font-bold text-brand" : "text-[#dce7f1] hover:bg-[#1b4a72]"
                  }`}
                >
                  {th === "light" ? s("themeLight") : s("themeDark")}
                </button>
              ))}
            </div>

            <div className="flex items-stretch border border-[#3d6488]" role="group" aria-label={s("scaleLabel")}>
              {SCALES.map((sc, i) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setScale(sc.id)}
                  aria-pressed={prefs.scale === sc.id}
                  title={sc.title}
                  aria-label={sc.title}
                  className={`min-h-[40px] min-w-[40px] px-2 ${i > 0 ? "border-l border-[#3d6488]" : ""} ${
                    prefs.scale === sc.id ? "bg-paper font-bold text-brand" : "text-[#dce7f1] hover:bg-[#1b4a72]"
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            <Link
              href="/settings"
              className="inline-flex min-h-[40px] items-center border-b border-[#9fc3e0] px-1 text-paper no-underline hover:border-paper"
            >
              {s("settings")}
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-paper">
        <div className="wrap flex flex-wrap items-center gap-3 py-2.5 text-[13px] text-slate">
          <span className="border border-slate px-1.5 py-[1px] text-[11px] font-bold tracking-[0.1em]">{s("proto")}</span>
          <span>{s("blockNotice")}</span>
        </div>
      </div>
    </>
  );
}

export function SiteFooter() {
  const { prefs } = usePrefs();
  const s = (k: string) => t(prefs.lang, k);
  return (
    <footer className="mt-16 border-t border-line bg-mist">
      <nav aria-label={s("legalNav")} className="border-b border-line">
        <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-[14px]">
          <Link className="underline" href="/summary">
            {s("summary")}
          </Link>
          <Link className="underline" href="/privacy">
            {s("privacy")}
          </Link>
          <Link className="underline" href="/terms">
            {s("terms")}
          </Link>
          <Link className="underline" href="/accessibility">
            {s("accessibility")}
          </Link>
          <Link className="underline" href="/settings">
            {s("settings")}
          </Link>
        </div>
      </nav>
      <div className="wrap grid gap-8 py-10 text-[14px] text-slate sm:grid-cols-3">
        <div>
          <p className="font-bold text-ink">PolicyMatch HK</p>
          <p className="mt-2">{s("aboutBody")}</p>
        </div>
        <div>
          <p className="font-bold text-ink">{s("sources")}</p>
          <p className="mt-2">{s("sourcesBody")}</p>
          <a className="mt-2 inline-block underline" href={POLICY_PDF_URL} target="_blank" rel="noreferrer">
            {s("openSource")}
          </a>
        </div>
        <div>
          <p className="font-bold text-ink">{s("important")}</p>
          <p className="mt-2">{s("importantBody")}</p>
        </div>
      </div>
    </footer>
  );
}
