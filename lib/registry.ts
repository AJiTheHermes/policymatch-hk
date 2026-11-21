import type { Lang } from "./i18n";

/** One flat table. Adding a tool means adding a row here plus an executor on the
 *  server — no plugin system, no discovery, no manifest. */
export type ToolId =
  | "matchSchemes"
  | "searchPolicy"
  | "getCurrentTime"
  | "webSearch"
  | "findElderlyCentres"
  | "getAeWaiting"
  | "getWeatherStatus";

export interface ToolMeta {
  id: ToolId;
  /** Short label shown in the transcript. */
  label: Record<Lang, string>;
  /** What the tool reads, in the user's language, for the settings page. */
  note: Record<Lang, string>;
  network: boolean;
}

export const TOOLS: Record<ToolId, ToolMeta> = {
  matchSchemes: {
    id: "matchSchemes",
    label: { zhHant: "核對資格規則", zhHans: "核对资格规则", en: "Check eligibility rules" },
    note: {
      zhHant: "按 11 項服務的規則核對年齡、住屋、收入、照顧者。",
      zhHans: "按 11 项服务的规则核对年龄、住房、收入、照顾者。",
      en: "Checks age, housing, income and caring status against the 11 scheme rules.",
    },
    network: false,
  },
  searchPolicy: {
    id: "searchPolicy",
    label: { zhHant: "搜尋政策原文", zhHans: "搜索政策原文", en: "Search policy text" },
    note: {
      zhHant: "在政策資料庫檢索，回傳段落、頁碼及原文頁連結。",
      zhHans: "在政策数据库检索，返回段落、页码及原文页链接。",
      en: "Searches the policy corpus and returns passages with page links.",
    },
    network: false,
  },
  getCurrentTime: {
    id: "getCurrentTime",
    label: { zhHant: "查詢目前時間", zhHans: "查询当前时间", en: "Check the current time" },
    note: {
      zhHant: "回傳香港時區的日期與時間，用於回答「今日幾號」之類。",
      zhHans: "返回香港时区的日期与时间，用于回答「今天几号」之类。",
      en: "Returns the date and time in Hong Kong, for questions like “what is today”.",
    },
    network: false,
  },
  webSearch: {
    id: "webSearch",
    label: { zhHant: "網頁搜尋", zhHans: "网页搜索", en: "Web search" },
    note: {
      zhHant: "使用你提供的搜尋 API 金鑰查詢網頁；未啟用時不會發出任何外部請求。",
      zhHans: "使用你提供的搜索 API 密钥查询网页；未启用时不会发出任何外部请求。",
      en: "Uses the search API key you provide. When disabled, no external request is made.",
    },
    network: true,
  },
  findElderlyCentres: {
    id: "findElderlyCentres",
    label: { zhHant: "查長者中心", zhHans: "查长者中心", en: "Find elderly centres" },
    note: {
      zhHant: "向社署 data.gov.hk 名單查詢指定地區的長者鄰舍中心及長者地區中心，附電話與地址。",
      zhHans: "向社署 data.gov.hk 名单查询指定地区的长者邻舍中心及长者地区中心，附电话与地址。",
      en: "Queries the SWD open-data list for elderly centres in a district, with phone and address.",
    },
    network: true,
  },
  getAeWaiting: {
    id: "getAeWaiting",
    label: { zhHant: "查急症室等候", zhHans: "查急症室等候", en: "A&E waiting time" },
    note: {
      zhHant: "讀取醫院管理局公開的急症室等候時間，附醫管局更新時間。",
      zhHans: "读取医院管理局公开的急症室等候时间，附医管局更新时间。",
      en: "Reads the Hospital Authority's published A&E waiting times, with its own update time.",
    },
    network: true,
  },
  getWeatherStatus: {
    id: "getWeatherStatus",
    label: { zhHant: "查天氣警告", zhHans: "查天气警告", en: "Weather warnings" },
    note: {
      zhHant: "讀取香港天文台的生效警告及實時氣溫，用於提醒長者是否適宜外出。",
      zhHans: "读取香港天文台的生效警告及实时气温，用于提醒长者是否适宜外出。",
      en: "Reads active HKO warnings and live temperatures, to advise whether it is safe to go out.",
    },
    network: true,
  },
};

export function toolLabel(id: string, lang: Lang): string {
  return TOOLS[id as ToolId]?.label[lang] ?? id;
}

/** Retrieval knobs exposed in settings. Defaults match the tuned values. */
export interface RagConfig {
  topK: number;
  minAnchors: number;
  maxAttempts: number;
}

export const RAG_DEFAULT: RagConfig = { topK: 3, minAnchors: 1, maxAttempts: 2 };

export interface ToolConfig {
  webSearch: { enabled: boolean; key: string };
  rag: RagConfig;
}
