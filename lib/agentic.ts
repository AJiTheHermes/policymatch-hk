import { gradedSearch, searchAllRaw, type PolicyHit } from "./policy";

/**
 * Bounded agentic retrieval, following the retrieve → grade → rewrite loop in the
 * LangGraph agentic-RAG guide: the agent decides whether the first result set is
 * good enough, and re-queries once when it is not. Capped at two attempts so a
 * question can never spin, and it refuses rather than answering from a weak hit.
 */
const MAX_ATTEMPTS = 2;

/** Everyday wording → the words the policy document itself uses. */
const SYNONYMS: [RegExp, string][] = [
  [/生果金|高龄津贴|高齡津貼/, "高齡津貼"],
  [/兩蚊|两蚊|二元|\$2|2元/, "二元優惠 公共交通費用補貼計劃"],
  [/醫療券|医疗券/, "長者醫療券"],
  [/綜援|综援/, "綜合社會保障援助"],
  [/劏房|㓥房|分間/, "過渡性房屋 租金"],
  [/中風|中风|輪椅|轮椅/, "照顧者支援"],
  [/學生資助|学生资助|開學|开学/, "學生資助 開學津貼"],
  [/搭車|乘车|坐車/, "公共交通費用補貼"],
];

export interface AgenticResult {
  hits: PolicyHit[];
  attempts: number;
  coverage: number;
  matched: number;
  firstQuery: string;
  finalQuery: string;
  rewrote: boolean;
}

function rewrite(question: string): string {
  let out = question;
  for (const [re, term] of SYNONYMS) if (re.test(question)) out += ` ${term}`;
  return out;
}

export function agenticSearch(question: string, limit = 3): AgenticResult {
  const first = gradedSearch(question, limit);
  if (first.hits.length > 0) {
    return {
      hits: first.hits,
      attempts: 1,
      coverage: first.coverage,
      matched: first.matched,
      firstQuery: question,
      finalQuery: question,
      rewrote: false,
    };
  }

  // Attempt 2: expand everyday wording, and use the ungated rows only to see
  // whether the corpus has anything at all on this subject.
  const rewritten = rewrite(question);
  const second = gradedSearch(rewritten, limit);
  if (second.hits.length > 0) {
    return {
      hits: second.hits,
      attempts: 2,
      coverage: second.coverage,
      matched: second.matched,
      firstQuery: question,
      finalQuery: rewritten,
      rewrote: rewritten !== question,
    };
  }

  return {
    hits: [],
    attempts: MAX_ATTEMPTS,
    coverage: Math.max(first.coverage, second.coverage),
    matched: Math.max(first.matched, second.matched),
    firstQuery: question,
    finalQuery: rewritten,
    rewrote: rewritten !== question,
  };
}

export { searchAllRaw };
