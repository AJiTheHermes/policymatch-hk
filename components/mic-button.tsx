"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

/** Browser speech-to-text. Chrome and Edge ship it; Safari supports it behind
 *  webkitSpeechRecognition; Firefox does not. When it is missing the button is
 *  not rendered and the page explains the fallback, rather than failing silently. */
export function MicButton({ onText, disabled }: { onText: (text: string) => void; disabled?: boolean }) {
  const { prefs } = usePrefs();
  const s = (k: string) => t(prefs.lang, k);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recog = useRef<SR | null>(null);

  useEffect(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const r: SR = new Ctor();
    r.lang = "zh-HK";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e: any) => {
      let text = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final += res[0].transcript;
        else text += res[0].transcript;
      }
      setInterim(text);
      if (final.trim()) {
        onText(final.trim());
        setInterim("");
      }
    };
    r.onerror = () => {
      setListening(false);
      setInterim("");
    };
    r.onend = () => setListening(false);
    recog.current = r;
  }, [onText]);

  if (!supported) {
    return (
      <p className="text-[13px] text-slate">{s("micUnsupported")}</p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        aria-pressed={listening}
        aria-label={listening ? s("micStop") : s("mic")}
        onClick={() => {
          if (listening) {
            recog.current?.stop();
            setListening(false);
          } else {
            try {
              recog.current?.start();
              setListening(true);
            } catch {
              setListening(false);
            }
          }
        }}
        className={`flex h-11 items-center gap-2 border px-4 text-[15px] font-medium ${
          listening ? "border-[#a4262c] bg-[#fdeaea] text-[#a4262c]" : "border-line bg-white text-ink hover:bg-mist"
        } disabled:opacity-50`}
      >
        <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${listening ? "animate-pulse bg-[#a4262c]" : "bg-[#2e6b3f]"}`} />
        {listening ? s("micStop") : s("mic")}
      </button>
      {interim ? <span className="text-[14px] text-slate">{interim}</span> : null}
    </div>
  );
}
