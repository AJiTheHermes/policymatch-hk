"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Lang } from "./i18n";
import { RAG_DEFAULT, type RagConfig } from "./registry";

export type Theme = "light" | "dark";
export type Scale = "normal" | "large" | "xlarge";
export interface Llm { base: string; key: string; model: string }
export interface WebCfg { enabled: boolean; key: string }
interface Prefs { lang: Lang; theme: Theme; scale: Scale; llm: Llm; rag: RagConfig; web: WebCfg }

const KEY = "policymatch.prefs";
const DEFAULT: Prefs = {
  lang: "zhHant",
  theme: "light",
  scale: "normal",
  llm: { base: "https://api.deepseek.com/v1", key: "", model: "deepseek-chat" },
  rag: RAG_DEFAULT,
  web: { enabled: false, key: "" },
};

const Ctx = createContext<{
  prefs: Prefs;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  setScale: (s: Scale) => void;
  setLlm: (l: Llm) => void;
  setRag: (r: RagConfig) => void;
  setWeb: (w: WebCfg) => void;
  ready: boolean;
}>({
  prefs: DEFAULT,
  setLang: () => {},
  setTheme: () => {},
  setScale: () => {},
  setLlm: () => {},
  setRag: () => {},
  setWeb: () => {},
  ready: false,
});

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        setPrefs({
          ...DEFAULT,
          ...parsed,
          llm: { ...DEFAULT.llm, ...(parsed.llm ?? {}) },
          rag: { ...DEFAULT.rag, ...(parsed.rag ?? {}) },
          web: { ...DEFAULT.web, ...(parsed.web ?? {}) },
        });
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setPrefs({ ...DEFAULT, theme: "dark" });
      }
    } catch {
      /* corrupt storage: fall back to defaults */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(prefs));
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.lang = prefs.lang === "en" ? "en" : prefs.lang === "zhHans" ? "zh-Hans" : "zh-Hant-HK";
    document.documentElement.dataset.scale = prefs.scale;
  }, [prefs, ready]);

  const value = useMemo(
    () => ({
      prefs,
      ready,
      setLang: (lang: Lang) => setPrefs((p) => ({ ...p, lang })),
      setTheme: (theme: Theme) => setPrefs((p) => ({ ...p, theme })),
      setScale: (scale: Scale) => setPrefs((p) => ({ ...p, scale })),
      setLlm: (llm: Llm) => setPrefs((p) => ({ ...p, llm })),
      setRag: (rag: RagConfig) => setPrefs((p) => ({ ...p, rag })),
      setWeb: (web: WebCfg) => setPrefs((p) => ({ ...p, web })),
    }),
    [prefs, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePrefs = () => useContext(Ctx);
