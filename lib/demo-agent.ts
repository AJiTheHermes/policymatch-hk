import { matchSchemes } from "./tools";
import { agenticSearch } from "./agentic";
import { classify, REFUSAL } from "./guard";

/** Turn free text into the rule engine's argument shape. Kept next to the demo
 *  agent so both the demo answer and the browser-side tool call agree. */
export function deriveMatchArgs(q: string) {
  const age = AGE.find(([re]) => re.test(q))?.[1] ?? "70plus";
  return {
    age,
    household: /獨居|自己一個|single/i.test(q) ? "single" : "couple",
    income: /低收入|基層|冇錢|low income/i.test(q) ? "low" : "mid",
    housing: /公屋|public housing/i.test(q)
      ? "publicRent"
      : /居屋/.test(q)
        ? "subsidisedOwner"
        : /村屋/.test(q)
          ? "village"
          : "privateRent",
    carer: /照顧|中風|輪椅|care/i.test(q) ? "yes" : "no",
    district: /沙田|sha tin/i.test(q) ? "shaTin" : "kwunTong",
  } as const;
}

export interface DemoAnswer {
  reasoning: string;
  tool: { type: string; toolName: string; input: unknown; output: unknown; state: string };
  text: string;
}

const AGE: [RegExp, string][] = [
  [/[78]\d|七十|八十|7[02]/, "70plus"],
  [/6[5-9]|六十五|六十八/, "65to69"],
  [/5[5-9]|六十/, "55to64"],
  [/4\d|五十/, "40to54"],
  [/2[5-9]|3\d|三十/, "25to39"],
  [/1[89]|2[0-4]/, "18to24"],
  [/學生|兒童|小朋友|student|child/i, "under18"],
];

/** Deterministic fallback when no model key is configured. It calls the same
 *  tools the live agent calls, so the demo shows real rows and real page numbers. */
export function runDemoAgent(question: string, lang: "zhHant" | "zhHans" | "en" = "zhHant"): DemoAnswer {
  const q = question.trim();
  const verdict = classify(q);
  if (verdict !== "ok") {
    return {
      reasoning: "先檢查問題範圍：只處理政府支援計劃的查詢。",
      tool: { type: "tool-scope", toolName: "scope", input: { verdict }, output: [], state: "output-available" },
      text: REFUSAL[verdict][lang],
    };
  }
  const asksMatch = /(可以申請|合資格|有咩|有甚麼|邊啲|邊項|申請什麼|what can i|eligible|apply for)/i.test(q);

  if (asksMatch) {
    const age = AGE.find(([re]) => re.test(q))?.[1] ?? "70plus";
    const input = {
      age,
      household: /獨居|自己一個|single/i.test(q) ? "single" : "couple",
      income: /低收入|基層|冇錢|low income/i.test(q) ? "low" : "mid",
      housing: /公屋|public housing/i.test(q)
        ? "publicRent"
        : /居屋/.test(q)
          ? "subsidisedOwner"
          : /村屋/.test(q)
            ? "village"
            : "privateRent",
      carer: /照顧|中風|輪椅|care/i.test(q) ? "yes" : "no",
      district: /沙田|sha tin/i.test(q) ? "shaTin" : "kwunTong",
    } as const;

    const out = matchSchemes(input as never);
    const top = out.matched.slice(0, 3);
    const lines = top.map((r, i) => `${i + 1}. ${r.name}（${r.dept}）— ${r.benefit}　出處：${r.citation}`);

    return {
      reasoning:
        `先按規則核對：年齡 ${input.age}、住屋 ${input.housing}、收入 ${input.income}、照顧者 ${input.carer}。` +
        `這一步由程式完成，語言模型不參與判斷。`,
      tool: {
        type: "tool-matchSchemes",
        toolName: "matchSchemes",
        input,
        output: { matched: out.matched, excluded: out.excluded.slice(0, 2) },
        state: "output-available",
      },
      text:
        `共找到 ${out.matched.length} 項可能合資格的服務。\n\n${lines.join("\n")}\n\n` +
        `另有 ${out.excluded.length} 項未符合，每項均列明原因。申請前請查閱政策原文。`,
    };
  }

  const r = agenticSearch(q, 3);
  const hits = r.hits;
  if (hits.length === 0) {
    return {
      reasoning:
        `第 1 次檢索覆蓋率 ${Math.round(r.coverage * 100)}%，不足以作答；` +
        (r.rewrote ? `改寫查詢為「${r.finalQuery}」再檢索一次，仍然不足。` : "改寫後仍然不足。") +
        "找不到便不作答，建議致電 1823。",
      tool: {
        type: "tool-searchPolicy",
        toolName: "searchPolicy",
        input: { query: q },
        output: { attempts: r.attempts, coverage: r.coverage, hits: [] },
        state: "output-available",
      },
      text: "找不到相關資料。本工具只收錄已載入的政策內容，不會猜測。可改用政策名稱再問，或致電 1823 查詢。",
    };
  }

  return {
    reasoning:
      `檢索 ${r.attempts} 次，覆蓋率 ${Math.round(r.coverage * 100)}%，命中 ${hits.length} 段。` +
      (r.rewrote ? `第 2 次把口語改寫為「${r.finalQuery}」。` : "") +
      "全部附頁碼並可開啟政府原文該頁。",
    tool: {
      type: "tool-searchPolicy",
      toolName: "searchPolicy",
      input: { query: q },
      output: { attempts: r.attempts, coverage: r.coverage, hits },
      state: "output-available",
    },
    text: `${hits[0].text}\n\n出處：${hits[0].citation}。可按結果中的連結開啟原文該頁。`,
  };
}
