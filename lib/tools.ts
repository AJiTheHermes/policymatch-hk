import { schemes } from "./schemes";
import { matchAll, parseProfile } from "./rules";
import { buildPassages, createIndex } from "./rag-core";
import type { AgeBand, Carer, District, Household, Housing, Income, Profile } from "./types";

const index = createIndex(buildPassages(schemes));

export interface SchemeHit {
  id: string;
  name: string;
  dept: string;
  benefit: string;
  citation: string;
  href: string;
  reasons: string[];
}

export interface MatchArgs {
  age?: string;
  household?: string;
  income?: string;
  housing?: string;
  carer?: string;
  district?: string;
}

/** Same rule engine as the form, so the chat can never disagree with the page. */
export function matchSchemes(args: MatchArgs): { matched: SchemeHit[]; excluded: SchemeHit[] } {
  const { profile } = parseProfile({
    age: args.age,
    household: args.household,
    income: args.income,
    housing: args.housing,
    carer: args.carer,
    district: args.district,
  });

  const results = matchAll(profile, schemes);
  const toHit = (r: (typeof results)[number]): SchemeHit => ({
    id: r.scheme.id,
    name: r.scheme.zh,
    dept: r.scheme.dept,
    benefit: r.scheme.benefit,
    citation: `${r.scheme.citation.label}`,
    href: `/scheme/${r.scheme.id}`,
    reasons: r.matched ? r.reasons : r.failures,
  });

  return {
    matched: results.filter((r) => r.matched).map(toHit),
    excluded: results.filter((r) => !r.matched).map(toHit),
  };
}

export function searchPolicy(query: string, limit = 3) {
  return index(query, limit).map((h) => ({
    text: h.text,
    kind: h.kind,
    citation: h.source,
    ref: h.ref,
    href: `/scheme/${h.schemeId}`,
  }));
}

export const PROFILE_KEYS = ["age", "household", "income", "housing", "carer", "district"] as const;
export type { Profile, AgeBand, Carer, District, Household, Housing, Income };
