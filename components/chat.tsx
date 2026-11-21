"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MicButton } from "./mic-button";
import { SpeakButton } from "./speak-button";
import { matchSchemes } from "@/lib/tools";
import { deriveMatchArgs } from "@/lib/demo-agent";
import { t } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { classify, refusalText } from "@/lib/guard";
import { toolLabel, type ToolId } from "@/lib/registry";

type AnyPart = { type: string; [k: string]: any };

/** Assemble one tool part the transcript can render, whichever path produced it. */
function toolPart(name: ToolId, input: unknown, output: unknown, ms: number, state: "done" | "failed" = "done"): AnyPart {
  return {
    type: `tool-${name}`,
    toolName: name,
    state: state === "done" ? "output-available" : "output-error",
    input,
    output,
    ms,
  };
}

const TIME_Q = /(今日|今天|幾號|几号|幾點|几点|時間|时间|星期|日期|today|what day|what time|current time)/i;
const WEB_Q = /(最新|新聞|新闻|網上|网上|搜尋|搜索|search|news|online)/i;
const WX_Q = /(天氣|天气|風球|风球|暴雨|黑雨|紅雨|酷熱|酷热|寒冷|颱風|台风|季候風|weather|typhoon|signal)/i;
const AE_Q = /(急症室|急症|醫院|医院|輪候|轮候|等候時間|emergency|hospital|a&e)/i;
const CENTRE_Q = /(長者中心|长者中心|鄰舍中心|地区中心|地區中心|社工|中心喺邊|邊間中心|附近.*中心|elderly centre|community centre)/i;

/** 18 districts, so a district name in the question becomes the filter argument. */
const DISTRICTS = [
  "中西區", "灣仔", "東區", "南區",
  "油尖旺", "深水埗", "九龍城", "黃大仙", "觀塘",
  "葵青", "荃灣", "屯門", "元朗", "北區", "大埔", "沙田", "西貢", "離島",
];

function districtIn(text: string): string | undefined {
  return DISTRICTS.find((d) => text.includes(d));
}

/** Printed under any live-data answer: who published it, when, and when we fetched. */
function srcLine(out: any): string {
  const m = out?.source;
  if (!m) return "";
  const bits = [`資料來源：${m.publisher}`];
  if (m.updatedAt) bits.push(`資料日期 ${m.updatedAt}`);
  if (m.fetchedAt) bits.push(`擷取時間 ${m.fetchedAt}`);
  return bits.join(" · ");
}

export function Chat() {
  const { prefs, ready } = usePrefs();
  const s = (k: string) => t(prefs.lang, k);

  const [apiMode, setApiMode] = useState<"unknown" | "live" | "demo">("unknown");
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<UIMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const live = prefs.llm.key.length > 0 || apiMode === "live";

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: {
        ...(prefs.llm.key ? { "x-llm-base": prefs.llm.base, "x-llm-key": prefs.llm.key, "x-llm-model": prefs.llm.model } : {}),
        "x-rag-topk": String(prefs.rag.topK),
        ...(prefs.web.enabled && prefs.web.key ? { "x-web-key": prefs.web.key } : {}),
      },
    }),
  });

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((j) => setApiMode(j.mode === "live" ? "live" : "demo"))
      .catch(() => setApiMode("demo"));
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, chat.messages, chat.status]);

  const callTool = useCallback(
    async (name: ToolId, toolInput: unknown) => {
      const started = performance.now();
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, input: toolInput, rag: prefs.rag, webKey: prefs.web.key }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      return { ok: Boolean(j.ok), output: j.output, ms: Math.round(performance.now() - started), reason: j.reason };
    },
    [prefs.rag, prefs.web.key],
  );

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setInput("");
      const userId = `u-${Date.now()}`;
      const user = { id: userId, role: "user", parts: [{ type: "text", text }] } as UIMessage;

      const verdict = classify(text);
      if (verdict !== "ok") {
        setTurns((t0) => [
          ...t0,
          user,
          { id: `g-${Date.now()}`, role: "assistant", parts: [{ type: "text", text: refusalText(verdict, prefs.lang) }] } as unknown as UIMessage,
        ]);
        return;
      }

      if (live) {
        setTurns((t0) => [...t0, user]);
        await chat.sendMessage({ text });
        return;
      }

      // Demo mode: a real tool sequence, executed server-side, with real timing.
      const runId = `a-${Date.now()}`;
      setTurns((t0) => [
        ...t0,
        user,
        { id: runId, role: "assistant", parts: [{ type: "tool-queued", toolName: "queued", state: "running" }] as any[] } as unknown as UIMessage,
      ]);
      setBusy(true);

      const parts: AnyPart[] = [];
      try {
        const asksTime = TIME_Q.test(text);
        const asksMatch = /(可以申請|合資格|有咩|有甚麼|邊啲|邊項|申請什麼|what can i|eligible|apply for|津貼|支援)/i.test(text);

        if (asksTime && !asksMatch) {
          const r = await callTool("getCurrentTime", {});
          const out: any = r.output;
          parts.push(toolPart("getCurrentTime", {}, out, r.ms, r.ok ? "done" : "failed"));
          parts.push({ type: "reasoning", text: "時間由工具回傳，不靠記憶。" });
          parts.push({
            type: "text",
            text: out
              ? `今天是${out.date}，現在時間${out.time}（${out.timezone}，UTC${out.offset}）。`
              : "未能取得目前時間。",
          });
        } else if (WX_Q.test(text)) {
          const r = await callTool("getWeatherStatus", {});
          const out: any = r.output;
          const warn: any[] = out?.warnings ?? [];
          const temps: any[] = out?.temperature ?? [];
          parts.push(toolPart("getWeatherStatus", {}, out, r.ms, r.ok && out?.ok ? "done" : "failed"));
          parts.push({
            type: "reasoning",
            text: "天氣警告與氣溫由天文台即時回傳，唔靠記憶；有警告先講警告，冇就講冇。",
          });
          parts.push({
            type: "text",
            text: out?.ok
              ? `${warn.length ? `現時生效：${warn.map((w) => w.name).join("、")}。` : "現時沒有生效天氣警告。"}${
                  temps.length ? `\n實時氣溫：${temps.map((t) => `${t.place} ${t.value}°C`).join("、")}。` : ""
                }\n\n${warn.length ? "如屬惡劣天氣，非緊急服務或活動可能暫停，出門前請致電服務單位確認。" : "如需外出，請按天氣情況穿著合適衣物。"}\n\n${srcLine(out)}`
              : "未能取得天文台資料，請直接查看 https://www.hko.gov.hk 。",
          });
        } else if (AE_Q.test(text)) {
          const r = await callTool("getAeWaiting", {});
          const out: any = r.output;
          const rows: any[] = (out?.hospitals ?? []).slice(0, 5);
          parts.push(toolPart("getAeWaiting", {}, out, r.ms, r.ok && out?.ok ? "done" : "failed"));
          parts.push({
            type: "reasoning",
            text: "等候時間由醫管局公布，數字隨時變，所以一定要連更新時間一齊講。",
          });
          parts.push({
            type: "text",
            text: out?.ok
              ? `醫管局公布嘅急症室等候時間（更新：${out.updatedAt ?? "未提供"}）：\n\n${rows
                  .map((h) => `${h.name}｜分流三類中位數 ${h.t3p50}｜四五類中位數 ${h.t45p50}（95 百分位 ${h.t45p95}）`)
                  .join("\n")}\n\n若情況危急，請立即致電 999，不要因為等候時間而延誤求助。\n\n${srcLine(out)}`
              : "未能取得醫管局等候時間資料，請直接查看醫院管理局網站。",
          });
        } else if (CENTRE_Q.test(text)) {
          const district = districtIn(text);
          const r = await callTool("findElderlyCentres", district ? { district } : {});
          const out: any = r.output;
          const rows: any[] = (out?.centres ?? []).slice(0, 5);
          parts.push(toolPart("findElderlyCentres", district ? { district } : {}, out, r.ms, r.ok && out?.ok ? "done" : "failed"));
          parts.push({
            type: "reasoning",
            text: `名單直接讀社署名單，唔經模型改寫；${district ? `已按「${district}」篩選。` : "未講地區，所以列出首批。"}`,
          });
          parts.push({
            type: "text",
            text: out?.ok
              ? `${district ? `${district}共 ${out.total} 間長者中心，先列 ${rows.length} 間：` : `名單共 ${out.total} 間，先列 ${rows.length} 間：`}\n\n${rows
                  .map((c) => `${c.name}（${c.operator}）\n${c.address}${c.tel ? `\n電話 ${c.tel}` : ""}`)
                  .join("\n\n")}\n\n名單只供參考，開放時間及服務內容請先致電確認。\n\n${srcLine(out)}`
              : "未能讀取社署名單，請致電 2343 2255 或瀏覽社署網站查詢長者中心。",
          });
        } else if (prefs.web.enabled && WEB_Q.test(text)) {
          const r = await callTool("webSearch", { query: text });
          const out: any = r.output;
          const rows: any[] = out?.results ?? [];
          parts.push(toolPart("webSearch", { query: text }, out, r.ms, r.ok ? "done" : "failed"));
          parts.push({ type: "reasoning", text: "政策資料庫未必有即時資訊，因此改用網頁搜尋，並要求附上來源網址。" });
          parts.push({
            type: "text",
            text: rows.length
              ? `網上找到 ${rows.length} 項結果：\n\n${rows
                  .map((x, i) => `${i + 1}. ${x.title}\n${x.snippet}\n${x.url}`)
                  .join("\n\n")}\n\n以上為未經核實的網頁內容，非政策原文。`
              : "網頁搜尋未回傳結果。",
          });
        } else if (asksMatch) {
          const started = performance.now();
          const out = matchSchemes(deriveMatchArgs(text) as never);
          const ms = Math.round(performance.now() - started);
          const top = out.matched.slice(0, 3);
          parts.push(toolPart("matchSchemes", { question: text }, out, ms));
          parts.push({
            type: "reasoning",
            text: "先按規則核對資格，規則由程式執行，語言模型不參與判斷。",
          });
          if (top.length) {
            // Keep the case locally so /summary can print it. Never sent to a server.
            try {
              localStorage.setItem(
                "policymatch.case",
                JSON.stringify({
                  createdAt: new Date().toISOString(),
                  lang: prefs.lang,
                  question: text,
                  schemes: top,
                  excluded: out.excluded.length,
                  note: "資格由規則程式核對，非政府決定。",
                }),
              );
            } catch {
              /* storage full or blocked: the answer still shows */
            }
          }
          parts.push({
            type: "text",
            text: top.length
              ? `共找到 ${out.matched.length} 項可能合資格的服務。\n\n${top
                  .map((r, i) => `${i + 1}. ${r.name}（${r.dept}）— ${r.benefit}　出處：${r.citation}`)
                  .join("\n")}\n\n另有 ${out.excluded.length} 項未符合，每項均列明原因。申請前請查閱政策原文。`
              : "按你提供的情況，目前未找到合資格的服務。",
          });
          if (top.length) parts.push({ type: "case-link" });
        } else {
          const r = await callTool("searchPolicy", { query: text });
          const out: any = r.output;
          const hits: any[] = out?.hits ?? [];
          parts.push(toolPart("searchPolicy", { query: text }, out, r.ms, r.ok ? "done" : "failed"));
          parts.push({
            type: "reasoning",
            text: `檢索 ${out?.attempts ?? 0} 次，命中 ${hits.length} 段；每段都附頁碼。`,
          });
          parts.push({
            type: "text",
            text: hits.length
              ? `${hits[0].text}\n\n出處：${hits[0].citation}。可按上方結果開啟政府原文該頁。`
              : "找不到相關資料。本工具只收錄已載入的政策內容，不會猜測。可改用政策名稱再問，或致電 1823 查詢。",
          });
        }
      } catch {
        parts.push({ type: "text", text: "工具執行時出錯，未能完成這次查詢。" });
      }

      setTurns((t0) => t0.map((m) => (m.id === runId ? ({ ...m, parts } as unknown as UIMessage) : m)));
      setBusy(false);
    },
    [live, chat, prefs.lang, prefs.web.enabled, prefs.web.key, callTool],
  );

  const messages: { role: string; parts: AnyPart[] }[] = live
    ? (chat.messages as any[]).map((m) => ({ role: m.role, parts: m.parts }))
    : turns.map((m) => ({ role: m.role, parts: (m as any).parts }));

  const thinking = busy || (live && (chat.status === "streaming" || chat.status === "submitted"));
  const showDemoNote = ready && !live && apiMode === "demo";

  const samples = [s("s1"), s("s2"), s("s3"), s("s4")];

  return (
    <div className="wrap-narrow py-8">
      <h1 className="text-[30px] leading-tight sm:text-[36px]">{s("heroTitle")}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-slate">{s("heroLead")}</p>

      {showDemoNote ? (
        <p className="mt-5 border-t border-line pt-3 text-[13px] leading-relaxed text-slate">{s("demoBanner")}</p>
      ) : null}

      <div className="mt-6 space-y-6" aria-live="polite">
        {messages.length === 0 ? (
          <div className="border border-line p-5">
            <p className="text-[15px] font-bold">{s("tryAsking")}</p>
            <ul className="mt-3 space-y-2">
              {samples.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => void submit(q)}
                    className="text-left text-[16px] text-[#0b5fa5] underline decoration-[#0b5fa5]/30 underline-offset-2 hover:decoration-[#0b5fa5] dark:text-link"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] border-l-2 border-ink/60 bg-mist px-4 py-2.5">
              <p className="whitespace-pre-wrap text-[17px] leading-relaxed">{m.parts.map((p) => p.text).join("")}</p>
            </div>
          ) : (
            <div key={i} className="border-l-2 border-line pl-4">
              <Parts parts={m.parts} s={s} lang={prefs.lang} live={thinking && i === messages.length - 1} />
            </div>
          ),
        )}

        {thinking ? (
          <p className="font-mono text-[12.5px] text-slate">
            <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#b07d10] align-middle" />
            {s("thinking")}
          </p>
        ) : null}
        <div ref={bottom} />
      </div>

      <form
        className="mt-8 border border-line bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
      >
        <label htmlFor="msg" className="block text-[14px] font-bold">
          {s("inputLabel")}
        </label>
        <textarea
          id="msg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit(input);
            }
          }}
          rows={2}
          placeholder={s("placeholder")}
          className="mt-2 w-full resize-none border border-line bg-paper px-3 py-2.5 text-[17px] leading-relaxed placeholder:text-[#4a5865] focus:border-accent focus:outline-none focus:ring-4 focus:ring-[#ffc72c]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MicButton onText={(txt) => setInput((v) => (v ? v + " " + txt : txt))} disabled={thinking} />
          <p className="hidden text-[13px] text-slate sm:block">{s("enterHint")}</p>
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="ml-auto min-h-[48px] bg-ink px-8 py-3 text-[16px] font-bold text-white hover:bg-brand-dark disabled:bg-[#c8d2db] disabled:text-[#3f4b56] dark:disabled:bg-line dark:disabled:text-slate"
          >
            {s("send")}
          </button>
        </div>
        <p className="mt-2 text-[13px] text-slate sm:hidden">{s("enterHint")}</p>
      </form>

      <p className="mt-6 text-[14px] text-slate">{s("footnote")}</p>
    </div>
  );
}

function Parts({ parts, s, lang, live }: { parts: AnyPart[]; s: (k: string) => string; lang: any; live?: boolean }) {
  const spoken = parts.filter((p) => p.type === "text" && p.text).map((p) => p.text).join(" ");
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === "text" && p.text)
          return (
            <p key={i} className="mt-2 whitespace-pre-wrap text-[17px] leading-relaxed first:mt-0">
              {p.text}
            </p>
          );
        if (p.type === "reasoning" && p.text) return <ReasonLine key={i} text={p.text} s={s} live={live} />;
        if (p.type === "case-link")
          return (
            <p key={i} className="mt-3">
              <Link
                href="/summary"
                className="inline-block border border-ink px-4 py-2 text-[15px] font-bold text-ink no-underline hover:bg-mist"
              >
                {s("openSummary")}
              </Link>
            </p>
          );
        if (p.type.startsWith("tool-")) return <ToolLine key={i} name={p.toolName ?? p.type.slice(5)} part={p} s={s} lang={lang} />;
        return null;
      })}
      {spoken ? <SpeakButton text={spoken} lang={lang} /> : null}
    </>
  );
}

/** Codex-style trace line: status dot, mono label, elapsed time — collapsed until
 *  someone asks for the payload. */
function ToolLine({ name, part, s, lang }: { name: string; part: AnyPart; s: (k: string) => string; lang: any }) {
  const [open, setOpen] = useState(false);
  const running = part.state === "running" || part.state === "input-streaming";
  const failed = part.state === "output-error";
  const input = part.input;
  const output: any = part.output;
  const ms: number | undefined = part.ms;

  const rows: { title: string; meta: string; href?: string }[] = (() => {
    if (name === "matchSchemes" && output?.matched)
      return output.matched.map((r: any) => ({ title: r.name, meta: `${r.dept} · ${r.citation}`, href: r.href }));
    if (name === "searchPolicy") {
      const hits: any[] = Array.isArray(output) ? output : (output?.hits ?? []);
      return hits.map((h: any) => ({ title: h.text, meta: `${h.kind} · ${h.citation}`, href: h.href }));
    }
    if (name === "webSearch") {
      const hits: any[] = output?.results ?? [];
      return hits.map((h: any) => ({ title: h.title, meta: h.snippet, href: h.url }));
    }
    if (name === "findElderlyCentres") {
      const centres: any[] = output?.centres ?? [];
      return centres.map((c: any) => ({ title: c.name, meta: `${c.district} · ${c.address}${c.tel ? ` · ${c.tel}` : ""}` }));
    }
    if (name === "getAeWaiting") {
      const hs: any[] = output?.hospitals ?? [];
      return hs.map((h: any) => ({ title: h.name, meta: `三類 ${h.t3p50} · 四五類 ${h.t45p50}（95% ${h.t45p95}）` }));
    }
    if (name === "getWeatherStatus") {
      const ws: any[] = output?.warnings ?? [];
      if (ws.length) return ws.map((w: any) => ({ title: w.name, meta: w.action || w.code }));
      const ts: any[] = output?.temperature ?? [];
      return ts.map((t: any) => ({ title: `${t.place} ${t.value}°C`, meta: "天文台實時氣溫" }));
    }
    return [];
  })();

  const detail =
    name === "getCurrentTime" && output
      ? `${output.date} · ${output.time} · ${output.timezone}`
      : `${rows.length} ${s("resultCount")}`;

  return (
    <div className="mt-2 font-mono text-[12.5px] leading-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-baseline gap-2 text-left text-slate hover:text-ink"
      >
        <span
          aria-hidden
          className={`mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
            running ? "animate-pulse bg-[#b07d10]" : failed ? "bg-accent" : "bg-[#1d7a4d]"
          }`}
        />
        <span className="font-semibold text-ink">{toolLabel(name, lang)}</span>
        <span className="text-slate">· {running ? s("running") : failed ? s("failed") : detail}</span>
        {ms !== undefined ? <span className="text-slate/70">· {ms}ms</span> : null}
        <span className="ml-auto text-slate/60">{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <div className="mt-1 ml-3.5 border-l border-line pl-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate/70">input</p>
          <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words text-[12px] text-slate">{JSON.stringify(input, null, 1)}</pre>
          <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-slate/70">output</p>
          {rows.length > 0 ? (
            <ul className="mt-0.5 space-y-1.5">
              {rows.slice(0, 3).map((r, i) => (
                <li key={i}>
                  {r.href ? (
                    <Link
                      href={r.href}
                      target={/^https?:/.test(r.href) ? "_blank" : undefined}
                      className="text-[13px] font-sans hover:underline"
                    >
                      {r.title.length > 96 ? r.title.slice(0, 96) + "…" : r.title}
                    </Link>
                  ) : (
                    <span className="text-[13px] font-sans">{r.title}</span>
                  )}
                  <p className="font-sans text-[12px] text-slate">{r.meta}</p>
                </li>
              ))}
              {rows.length > 3 ? (
                <li className="font-sans text-[12px] text-slate">…＋{rows.length - 3}（完整結果見下方回答）</li>
              ) : null}
            </ul>
          ) : (
            <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words text-[12px] text-slate">
              {output ? JSON.stringify(output, null, 1).slice(0, 1200) : s("noResults")}
            </pre>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ReasonLine({ text, s, live }: { text: string; s: (k: string) => string; live?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 font-mono text-[12.5px] leading-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-baseline gap-2 text-left text-slate hover:text-ink"
      >
        <span aria-hidden className="mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-slate" />
        <span>{live ? s("streamingReasoning") : s("reasoning")}</span>
        <span className="ml-auto text-slate/60">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <p className="mt-1 ml-3.5 whitespace-pre-wrap border-l border-line pl-3 font-sans text-[14px] leading-relaxed text-slate">{text}</p> : null}
    </div>
  );
}
