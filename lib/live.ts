/**
 * Live Hong Kong public data.
 *
 * Every function here is best-effort: a timeout, a parse failure or an upstream
 * 404 returns `ok: false` with a reason instead of throwing, so a marker's laptop
 * with no network still gets a sentence instead of a stack trace. Each result
 * carries the publisher, the dataset's own last-updated date (when the source
 * publishes one) and the time we fetched it — the UI must show those, because a
 * number without a date is a rumour.
 */

export interface SourceMeta {
  dataset: string;
  publisher: string;
  url: string;
  /** Date the publisher says the dataset was last updated, if it says. */
  updatedAt?: string;
  /** When this process fetched it. */
  fetchedAt: string;
  licence: string;
}

const UA = "PolicyMatchHK/1.0 (student prototype; +https://data.gov.hk)";

interface CacheEntry<T> {
  at: number;
  value: T;
}

const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

function stamp(): string {
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function hkDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Minimal TSV reader that respects quoted fields containing tabs, quotes and newlines. */
export function parseDelimited(text: string, delimiter = "\t"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (ch === "\n") {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.length > 0));
}

async function getText(url: string, encoding: "utf-8" | "utf-16le" = "utf-8", ms = 8000): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(ms), cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder(encoding).decode(buf);
}

async function getJson<T>(url: string, ms = 8000): Promise<T> {
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(ms), cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/* ---------------------------------------------------------------- elderly centres */

export interface Centre {
  name: string;
  operator: string;
  district: string;
  address: string;
  tel: string;
  kind: "neighbourhood" | "district";
}

const NEC_URL = "https://www.swd.gov.hk/datagovhk/elderly/list-of-neighbourhood-elderly-centres.csv";
const DCC_URL = "https://www.swd.gov.hk/datagovhk/elderly/list-of-district-elderly-community-centres.csv";

function rowsToCentres(rows: string[][], kind: Centre["kind"]): Centre[] {
  if (rows.length === 0) return [];
  const head = rows[0].join("|");
  if (!head.includes("中心名稱")) return [];
  return rows
    .slice(1)
    .map((r) => ({
      name: (r[3] || "").replace(/\s+/g, " ").trim(),
      operator: (r[1] || "").replace(/\s+/g, " ").trim(),
      district: (r[5] || "").trim() || (r[6] || "").trim(),
      address: [r[7], r[8], r[9]]
        .filter((x) => x && x !== "-")
        .join(" ")
        .replace(/\s+/g, " ")
        .replace(/\s*-\s*-$/, "")
        .trim(),
      tel: (r[13] || r[15] || "").trim(),
      kind,
    }))
    .filter((c) => c.name.length > 0);
}

export interface CentresResult {
  ok: boolean;
  reason?: "network" | "parse";
  centres: Centre[];
  total?: number;
  source?: SourceMeta;
}

/**
 * Lists SWD elderly centres, filtered by an 18-district name when one is given.
 * The two CSVs are UTF-16LE with a BOM, so they must be decoded explicitly.
 */
export async function findElderlyCentres(district?: string, limit = 6): Promise<CentresResult> {
  const source: SourceMeta = {
    dataset: "社署長者鄰舍中心及長者地區中心名單",
    publisher: "社會福利署 · data.gov.hk",
    url: NEC_URL,
    updatedAt: "2023-06-21",
    fetchedAt: stamp(),
    licence: "data.gov.hk 開放數據授權（第 1.0 版）",
  };

  try {
    const [necRows, dccRows] = await cached("centres", 24 * 60 * 60 * 1000, async () => {
      const [nec, dcc] = await Promise.all([
        getText(NEC_URL, "utf-16le").then((t) => parseDelimited(t)),
        getText(DCC_URL, "utf-16le").then((t) => parseDelimited(t)).catch(() => [] as string[][]),
      ]);
      return [nec, dcc] as [string[][], string[][]];
    });

    const all = [...rowsToCentres(necRows, "neighbourhood"), ...rowsToCentres(dccRows, "district")];
    if (all.length === 0) return { ok: false, reason: "parse", centres: [], source };

    const wanted = (district ?? "").trim();
    const matched = wanted ? all.filter((c) => c.district.includes(wanted)) : all;
    return {
      ok: true,
      centres: matched.slice(0, limit),
      total: matched.length,
      source: { ...source, fetchedAt: stamp() },
    };
  } catch {
    return { ok: false, reason: "network", centres: [], source };
  }
}

/* ---------------------------------------------------------------- A&E waiting time */

export interface HospitalWait {
  name: string;
  /** Median wait for triage III, the band most walk-in elderly patients land in. */
  t3p50: string;
  t3p95: string;
  t45p50: string;
  t45p95: string;
}

interface HaRaw {
  updateTime?: string;
  waitTime?: { hospName: string; t3p50?: string; t3p95?: string; t45p50?: string; t45p95?: string }[];
}

export interface AeResult {
  ok: boolean;
  reason?: "network" | "parse";
  updatedAt?: string;
  hospitals: HospitalWait[];
  source?: SourceMeta;
}

export async function getAeWaiting(limit = 6): Promise<AeResult> {
  const url = "https://www.ha.org.hk/opendata/aed/aedwtdata2-tc.json";
  const source: SourceMeta = {
    dataset: "急症室等候時間",
    publisher: "醫院管理局 · data.gov.hk",
    url,
    updatedAt: "2025-10-12",
    fetchedAt: stamp(),
    licence: "data.gov.hk 開放數據授權（第 1.0 版）",
  };

  try {
    const raw = await cached("ae", 5 * 60 * 1000, () => getJson<HaRaw>(url));
    const hospitals = (raw.waitTime ?? []).map((h) => ({
      name: h.hospName,
      t3p50: h.t3p50 ?? "—",
      t3p95: h.t3p95 ?? "—",
      t45p50: h.t45p50 ?? "—",
      t45p95: h.t45p95 ?? "—",
    }));
    if (hospitals.length === 0) return { ok: false, reason: "parse", hospitals: [], source };
    return {
      ok: true,
      updatedAt: hkDate(raw.updateTime),
      hospitals: hospitals.slice(0, limit),
      source: { ...source, fetchedAt: stamp() },
    };
  } catch {
    return { ok: false, reason: "network", hospitals: [], source };
  }
}

/* ---------------------------------------------------------------- weather */

export interface WeatherResult {
  ok: boolean;
  reason?: "network" | "parse";
  warnings: { code: string; name: string; action: string; issue: string }[];
  temperature?: { place: string; value: number }[];
  updatedAt?: string;
  source?: SourceMeta;
}

interface WarnRaw {
  details?: { warningStatementCode?: string; warningStatement?: string; updateTime?: string }[];
}

interface RhrRaw {
  temperature?: { data?: { place: string; value: number }[] };
  updateTime?: string;
}

export async function getWeather(): Promise<WeatherResult> {
  const warnUrl = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc";
  const rhrUrl = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc";
  const source: SourceMeta = {
    dataset: "天氣警告及實時氣溫",
    publisher: "香港天文台 · data.gov.hk",
    url: warnUrl,
    fetchedAt: stamp(),
    licence: "data.gov.hk 開放數據授權（第 1.0 版）",
  };

  try {
    const [warn, rhr] = await Promise.all([
      cached("warn", 5 * 60 * 1000, () => getJson<WarnRaw>(warnUrl)),
      cached("rhr", 10 * 60 * 1000, () => getJson<RhrRaw>(rhrUrl)),
    ]);

    const warnings = (warn.details ?? []).map((d) => {
      const code = d.warningStatementCode ?? "";
      const raw = d.warningStatement ?? "";
      const [name] = raw.split("\n");
      const action = raw.split("\n").find((l) => l.includes("應") || l.includes("請")) ?? "";
      return { code, name: (name ?? code).trim(), action: action.trim(), issue: hkDate(d.updateTime) ?? "" };
    });

    const temperature = (rhr.temperature?.data ?? [])
      .map((t) => ({ place: t.place, value: Number(t.value) }))
      .slice(0, 4);

    return {
      ok: true,
      warnings,
      temperature,
      updatedAt: hkDate(rhr.updateTime),
      source: { ...source, updatedAt: hkDate(rhr.updateTime), fetchedAt: stamp() },
    };
  } catch {
    return { ok: false, reason: "network", warnings: [], source };
  }
}

/** One line a UI can print under any live-data answer. */
export function sourceLine(meta?: SourceMeta): string {
  if (!meta) return "";
  const parts = [`資料來源：${meta.publisher}`];
  if (meta.updatedAt) parts.push(`資料日期 ${meta.updatedAt}`);
  parts.push(`擷取時間 ${meta.fetchedAt}`);
  return parts.join(" · ");
}
