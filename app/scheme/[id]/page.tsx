"use client";

import { use } from "react";
import Link from "next/link";
import { getScheme } from "@/lib/schemes";
import { t } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { pdfPageUrl } from "@/lib/sources";

export default function SchemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { prefs } = usePrefs();
  const s = (k: string) => t(prefs.lang, k);
  const scheme = getScheme(id);

  if (!scheme) {
    return (
      <div className="wrap-narrow py-10">
        <p className="text-[17px]">{s("medicalTitle")}</p>
        <p className="mt-3">
          <Link href="/">{s("backHome")}</Link>
        </p>
      </div>
    );
  }

  const printed = Number(scheme.citation.ref.replace("p.", ""));
  const pdfHref = Number.isFinite(printed) ? pdfPageUrl(printed) : null;

  return (
    <article className="wrap-narrow py-10">
      <nav aria-label="breadcrumb" className="text-[14px] text-slate">
        <Link href="/">{s("backHome")}</Link>
        <span className="mx-2">›</span>
        <span>{scheme.zh}</span>
      </nav>

      <h1 className="mt-6 text-[30px] leading-tight">{scheme.zh}</h1>
      <p className="mt-1 text-[16px] text-slate">
        {scheme.en} · {scheme.dept}
      </p>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[18px] font-bold">{s("contents")}</h2>
        <p className="mt-3 text-[17px] leading-relaxed">{scheme.summary}</p>
        <p className="mt-3 text-[17px] leading-relaxed">{scheme.benefit}</p>
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[18px] font-bold">{s("documents")}</h2>
        <ul className="mt-3 list-disc pl-6 text-[17px] leading-relaxed">
          {scheme.documents.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[18px] font-bold">{s("apply")}</h2>
        <p className="mt-3 text-[17px] leading-relaxed">{scheme.apply}</p>
      </section>

      <div className="mt-8 border-l-4 border-line bg-mist px-4 py-3 text-[15px]">
        <p>
          {s("citation")}：{scheme.citation.label}
        </p>
        {pdfHref ? (
          <a href={pdfHref} target="_blank" rel="noreferrer" className="mt-2 inline-block font-medium underline">
            {s("openSource")}
          </a>
        ) : null}
      </div>
    </article>
  );
}
