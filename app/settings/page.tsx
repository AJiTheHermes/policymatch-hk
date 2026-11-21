"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { usePrefs, type Theme } from "@/lib/prefs";
import { RAG_DEFAULT } from "@/lib/registry";

export default function SettingsPage() {
  const { prefs, ready, setLang, setTheme, setLlm, setRag, setWeb } = usePrefs();
  const s = (k: string) => t(prefs.lang, k);

  const [base, setBase] = useState(prefs.llm.base);
  const [key, setKey] = useState(prefs.llm.key);
  const [model, setModel] = useState(prefs.llm.model);
  const [topK, setTopK] = useState(String(prefs.rag.topK));
  const [maxAttempts, setMaxAttempts] = useState(String(prefs.rag.maxAttempts));
  const [webEnabled, setWebEnabled] = useState(prefs.web.enabled);
  const [webKey, setWebKey] = useState(prefs.web.key);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!ready) return;
    setBase(prefs.llm.base);
    setKey(prefs.llm.key);
    setModel(prefs.llm.model);
  }, [ready, prefs.llm]);

  const field = "mt-2 w-full border border-line bg-paper px-3 py-2.5 text-[16px] focus:border-accent focus:outline-none focus:ring-4 focus:ring-[#ffc72c]";

  return (
    <div className="wrap-narrow py-10">
      <nav aria-label="breadcrumb" className="text-[14px] text-slate">
        <Link href="/">{s("backHome")}</Link>
        <span className="mx-2">›</span>
        <span>{s("settings")}</span>
      </nav>

      <h1 className="mt-6 text-[30px] leading-tight">{s("settingsTitle")}</h1>
      <p className="mt-3 text-[16px] text-slate">{s("settingsLead")}</p>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[18px] font-bold">{s("langLabel")}</h2>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={s("langLabel")}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLang(l.id as Lang)}
              aria-pressed={prefs.lang === l.id}
              className={`border px-4 py-2 text-[15px] ${prefs.lang === l.id ? "border-ink bg-ink font-bold text-white" : "border-line bg-paper hover:bg-mist"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[18px] font-bold">{s("themeLabel")}</h2>
        <div className="mt-3 flex gap-2" role="group" aria-label={s("themeLabel")}>
          {(["light", "dark"] as Theme[]).map((th) => (
            <button
              key={th}
              type="button"
              onClick={() => setTheme(th)}
              aria-pressed={prefs.theme === th}
              className={`border px-4 py-2 text-[15px] ${prefs.theme === th ? "border-ink bg-ink font-bold text-white" : "border-line bg-paper hover:bg-mist"}`}
            >
              {th === "light" ? s("themeLight") : s("themeDark")}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[18px] font-bold">{s("ragTitle")}</h2>
        <p className="mt-2 text-[14px] text-slate">{s("ragNote")}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="topk" className="block text-[14px] font-bold">
              {s("ragTopK")}
            </label>
            <input
              id="topk"
              type="number"
              min={1}
              max={8}
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="attempts" className="block text-[14px] font-bold">
              {s("ragAttempts")}
            </label>
            <input
              id="attempts"
              type="number"
              min={1}
              max={3}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              className={field}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = {
                topK: Math.min(8, Math.max(1, Number(topK) || 3)),
                maxAttempts: Math.min(3, Math.max(1, Number(maxAttempts) || 2)),
                minAnchors: prefs.rag.minAnchors ?? RAG_DEFAULT.minAnchors,
              };
              setTopK(String(next.topK));
              setMaxAttempts(String(next.maxAttempts));
              setRag(next);
              setMsg(s("llmSaved"));
            }}
            className="bg-ink px-5 py-2.5 text-[15px] font-bold text-white hover:bg-brand-dark"
          >
            {s("llmSave")}
          </button>
        </div>
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[18px] font-bold">{s("webTitle")}</h2>
        <p className="mt-2 border-l-4 border-line bg-mist px-4 py-3 text-[14px] text-slate">{s("webNote")}</p>
        <label className="mt-4 flex items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={webEnabled}
            onChange={(e) => {
              setWebEnabled(e.target.checked);
              setWeb({ enabled: e.target.checked, key: webKey });
            }}
            className="h-5 w-5"
          />
          {s("webEnable")}
        </label>
        <label htmlFor="webkey" className="mt-4 block text-[14px] font-bold">
          {s("webKey")}
        </label>
        <input
          id="webkey"
          type="password"
          value={webKey}
          onChange={(e) => setWebKey(e.target.value)}
          onBlur={() => setWeb({ enabled: webEnabled, key: webKey })}
          className={field}
          autoComplete="off"
        />
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-[18px] font-bold">{s("llmTitle")}</h2>
        <p className="mt-2 border-l-4 border-line bg-mist px-4 py-3 text-[14px] text-slate">{s("llmNote")}</p>

        <label htmlFor="base" className="mt-4 block text-[14px] font-bold">
          {s("llmBase")}
        </label>
        <input id="base" value={base} onChange={(e) => setBase(e.target.value)} className={field} placeholder="https://api.openai.com/v1" />

        <label htmlFor="key" className="mt-4 block text-[14px] font-bold">
          {s("llmKey")}
        </label>
        <input id="key" type="password" value={key} onChange={(e) => setKey(e.target.value)} className={field} autoComplete="off" />

        <label htmlFor="model" className="mt-4 block text-[14px] font-bold">
          {s("llmModel")}
        </label>
        <input id="model" value={model} onChange={(e) => setModel(e.target.value)} className={field} placeholder="deepseek-chat" />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setLlm({ base, key, model });
              setMsg(s("llmSaved"));
            }}
            className="bg-ink px-5 py-2.5 text-[15px] font-bold text-white hover:bg-brand-dark"
          >
            {s("llmSave")}
          </button>
          <button
            type="button"
            onClick={async () => {
              setMsg("…");
              try {
                const r = await fetch("/api/llm-check", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ base, key, model }),
                });
                setMsg(r.ok ? s("llmOk") : s("llmFail"));
              } catch {
                setMsg(s("llmFail"));
              }
            }}
            className="border border-line px-5 py-2.5 text-[15px] hover:bg-mist"
          >
            {s("llmTest")}
          </button>
          <button
            type="button"
            onClick={() => {
              setKey("");
              setLlm({ base, key: "", model });
              setMsg(s("llmSaved"));
            }}
            className="text-[14px] text-slate underline"
          >
            {s("llmClear")}
          </button>
        </div>
        {msg ? <p className="mt-3 text-[14px] text-slate" aria-live="polite">{msg}</p> : null}
      </section>
    </div>
  );
}
