import { agenticSearch } from "./agentic";
import type { RagConfig } from "./registry";

const TZ = "Asia/Hong_Kong";

export function getCurrentTime() {
  const now = new Date();
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("zh-HK", { timeZone: TZ, ...opts }).format(now);
  return {
    iso: now.toISOString(),
    date: fmt({ year: "numeric", month: "long", day: "numeric", weekday: "long" }),
    time: fmt({ hour: "2-digit", minute: "2-digit", hour12: false }),
    timezone: TZ,
    offset: "+08:00",
  };
}

export interface WebResult { title: string; url: string; snippet: string }

/** DeepSeek's own search API (api.deepseek.com/v1/tools/search). The key comes
 *  from the settings page or, failing that, the server environment; without one
 *  the tool reports disabled and no request leaves the machine. */
export async function webSearch(
  query: string,
  apiKey?: string,
  limit = 4,
): Promise<{ enabled: boolean; results: WebResult[]; provider: string }> {
  const key = apiKey || process.env.DEEPSEEK_API_KEY;
  if (!key) return { enabled: false, results: [], provider: "deepseek" };

  const r = await fetch("https://api.deepseek.com/v1/tools/search", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, count: limit, need_content: false }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) return { enabled: true, results: [], provider: "deepseek" };

  const j: any = await r.json().catch(() => ({}));
  const results: WebResult[] = (j.results ?? []).slice(0, limit).map((x: any) => ({
    title: String(x.title ?? ""),
    url: String(x.url ?? ""),
    snippet: String(x.summary ?? x.snippet ?? "").slice(0, 320),
  }));
  return { enabled: true, results, provider: "deepseek" };
}

export function policySearch(query: string, rag: RagConfig) {
  return agenticSearch(query, rag.topK);
}

export { findElderlyCentres, getAeWaiting, getWeather } from "./live";
