import pages from "../data/policy-pages.json";
import { buildPassages, createIndex, tokenize, type Hit } from "./rag-core";
import { schemes } from "./schemes";
import { pdfPageUrl } from "./sources";

export interface PolicyHit {
  text: string;
  kind: string;
  citation: string;
  ref: string;
  href: string;
}

export interface Grade {
  hits: PolicyHit[];
  /** Share of the question's rare terms that the best passage actually contains. */
  coverage: number;
  matched: number;
}

const pageRows = pages as { printed: number; text: string }[];

/** Scheme passages keep the per-scheme structure; the supplement pages add the
 *  wider corpus, so a question about a chapter we never modelled still lands on
 *  the real page. Every hit opens the government PDF at that page. */
const schemePassages = buildPassages(schemes).map((p) => ({ ...p, id: `s-${p.id}` }));

const pagePassages = pageRows.map((r, i) => ({
  id: `pdf-${i}`,
  schemeId: "",
  kind: "政策原文" as const,
  text: r.text,
  ref: `p.${r.printed}`,
  source: `施政報告2026 附篇，p.${r.printed}`,
}));

const index = createIndex([...schemePassages, ...pagePassages] as never);

function toHits(hits: Hit[]): PolicyHit[] {
  return hits.map((h) => {
    const printed = Number(h.ref.replace("p.", ""));
    const isPage = h.id.startsWith("pdf-");
    return {
      text: h.text.length > 260 ? h.text.slice(0, 260) + "…" : h.text,
      kind: h.kind,
      citation: isPage ? `施政報告2026 附篇，${h.ref}` : h.source,
      ref: h.ref,
      href: isPage ? pdfPageUrl(printed) : `/scheme/${h.schemeId}`,
    };
  });
}

/** Grade the raw hits. Coverage counts a term only if it appears in the best
 *  passage's full text (not the truncated preview), and the denominator is the
 *  set of question terms that appear anywhere in the returned rows — otherwise
 *  filler words like「可以」would dilute every score. A two-term question such as
 *  「公屋」needs one real match; longer questions need two.
 *
 *  Short questions stay permissive on purpose: 醫療券 is two terms and must work. */
export function gradedSearch(query: string, limit = 4): Grade {
  const raw = index(query, 8, 0) as Hit[];
  if (raw.length === 0) return { hits: [], coverage: 0, matched: 0 };

  const stats = index as unknown as { df: (t: string) => number };
  const qTerms = [...new Set(tokenize(query))];
  const isRare = (term: string) => {
    const df = stats.df(term);
    return df >= 1 && df <= 8;
  };

  // Keep only rows that contain a rare question term. Every page says 津貼;
  // only some say 傷殘. Without a rare anchor the row is a generic guess.
  const kept = raw.filter((h) => {
    const terms = new Set(tokenize(`${h.kind} ${h.text}`));
    const rare = qTerms.filter(isRare);
    return rare.length === 0 ? true : rare.some((term) => terms.has(term));
  });

  const best = kept[0];
  if (!best) return { hits: [], coverage: 0, matched: 0 };

  const bestTerms = new Set(tokenize(`${best.kind} ${best.text}`));
  const matched = qTerms.filter((term) => bestTerms.has(term)).length;
  const plausible = new Set<string>();
  for (const h of raw) for (const term of tokenize(`${h.kind} ${h.text}`)) plausible.add(term);
  const coverage = matched / Math.max(1, qTerms.filter((term) => plausible.has(term)).length);

  const anchors = qTerms.filter((term) => isRare(term) && bestTerms.has(term)).length;
  const enough = qTerms.length <= 2 ? matched >= 1 : matched >= 2 && anchors >= 1;
  if (!enough) return { hits: [], coverage, matched };

  return { hits: toHits(kept.slice(0, limit)), coverage, matched };
}

/** Public lookup used by demo mode; keeps the gate so a weak match reads as
 *  "not found" rather than a near miss. */
export function searchAll(query: string, limit = 4): PolicyHit[] {
  return gradedSearch(query, limit).hits;
}

/** Ungated rows for the retry loop: a partial hit still hints at the right chapter. */
export function searchAllRaw(query: string, limit = 4): PolicyHit[] {
  return toHits(index(query, limit, 0) as Hit[]);
}
