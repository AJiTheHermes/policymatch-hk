"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reads an answer out loud with the browser's own speech engine.
 *
 * Elderly users often need to hear an answer rather than read it, and this adds
 * no dependency, no audio upload and no key. When the engine is missing the
 * control is not rendered at all, so nothing looks broken.
 */
export function SpeakButton({ text, lang }: { text: string; lang: string }) {
  const [state, setState] = useState<"idle" | "speaking">("idle");
  const [supported, setSupported] = useState(false);
  const utter = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  const bcp = lang === "en" ? "en-HK" : lang === "zhHans" ? "zh-CN" : "zh-HK";

  const speak = () => {
    if (state === "speaking") {
      window.speechSynthesis.cancel();
      setState("idle");
      return;
    }
    const clean = text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[│|]/g, "，")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return;

    const u = new SpeechSynthesisUtterance(clean);
    u.lang = bcp;
    u.rate = 0.92;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang === bcp) ??
      voices.find((v) => v.lang.startsWith(bcp.slice(0, 2))) ??
      voices.find((v) => /zh|Chinese/i.test(v.name));
    if (match) u.voice = match;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    utter.current = u;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setState("speaking");
  };

  const label = lang === "en" ? (state === "speaking" ? "Stop reading" : "Read this answer aloud") : state === "speaking" ? "停止朗讀" : "讀出這段答案";

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={label}
      title={label}
      className="mt-2 inline-flex min-h-[40px] items-center gap-2 border border-line bg-paper px-3 py-2 text-[14px] font-bold text-ink hover:bg-mist"
    >
      <span aria-hidden>{state === "speaking" ? "■" : "▶"}</span>
      {state === "speaking" ? (lang === "en" ? "Stop" : "停止") : lang === "en" ? "Read aloud" : "讀出"}
    </button>
  );
}
