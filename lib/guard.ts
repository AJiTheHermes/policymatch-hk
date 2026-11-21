/** Deterministic scope guard, run before any model sees the question.
 *
 *  Two jobs:
 *  1. keep the assistant inside "government support schemes" — a policy matching
 *     assistant must not answer a medical, legal or general question it has no
 *     source for;
 *  2. refuse instruction-override attempts instead of passing them to the model.
 *
 *  It runs on the client (instant, no tokens) and again on the server (so a
 *  hand-made request cannot skip it). */

export type Verdict = "ok" | "medical" | "offtopic" | "injection";

const INJECTION: RegExp[] = [
  /ignore\s+(all\s+|the\s+)?(previous|above|prior|earlier)\s+(instruction|prompt|rule)/i,
  /disregard\s+(the\s+)?(instruction|prompt|system)/i,
  /(reveal|show|print|repeat|leak)\s+(me\s+)?(your\s+)?(system\s+)?(prompt|instruction|rule)/i,
  /system\s*prompt|developer\s*(message|mode)|jailbreak|\bDAN\b/i,
  /(忽略|無視|忘記|无视|忽略掉).{0,8}(之前|以上|先前|所有|前面).{0,8}(指示|指令|規則|规则|命令)/,
  /(顯示|顯示出|列出|講出|输出|輸出).{0,6}(系統提示|系统提示|提示詞|prompt|你的指令)/,
  /你(而家|現在|现在)?(係|是|要扮演|扮演).{0,6}(管理員|管理员|開發者|开发者|沒有限制|没有限制)/,
  /<\|?(im_start|im_end|system)\|?>/i,
];

/** Requests for medical advice. Caring for a stroke survivor is NOT one: words
 *  like 中風 / 照顧 only count as context, never as a medical question. */
const MEDICAL: RegExp[] = [
  /(食|吃|用)(咩|什么|甚麼|什么)?藥|劑量|剂量|副作用|點醫|怎么治|怎樣治|要唔要(去)?醫院|係咪有病|是什么病|咩病/,
  /(診斷|诊断|斷症|确诊)/,
  /\b(dosage|dose|prescription|side effect|diagnos|what medicine|should i take|is it cancer)\b/i,
];

/** Domain vocabulary. Substantive scheme words only — "資格" or "申請" alone is
 *  not enough, otherwise "火星殖民要咩資格" would look in scope. */
const DOMAIN =
  /(津貼|津贴|補助|补助|援助|綜援|综援|長者|长者|高齡|高龄|生果金|醫療|医疗|房屋|公屋|居屋|租金|劏房|過渡性|过渡性|學生|学生|開學|开学|在職|在职|照顧|照顾|支援|殘疾|残疾|傷殘|伤残|交通|乘車|乘车|就業|就业|培訓|培训|托兒|托儿|社區|社区|福利|社署|部門須知|今日|今天|幾號|几号|幾點|几点|日期|星期|時間|时间|today|what time|what day|policy|allowance|subsid|scheme|housing|elderly|carer|disabilit|student|transport|welfare|support)/i;

export function classify(input: string): Verdict {
  const q = input.replace(/\s+/g, " ").trim();
  if (!q) return "offtopic";
  if (INJECTION.some((re) => re.test(q))) return "injection";
  if (MEDICAL.some((re) => re.test(q))) return "medical";
  if (!DOMAIN.test(q)) return "offtopic";
  return "ok";
}


export const REFUSAL = {
  injection: {
    zhHant: "我只處理政府支援計劃的查詢，不會因為訊息中的指示而改變角色或披露內部設定。請直接描述你的情況或想查詢的計劃。",
    zhHans: "我只处理政府支援计划的查询，不会因为信息中的指示而改变角色或披露内部设置。请直接描述你的情况或想查询的计划。",
    en: "I only handle questions about government support schemes. Instructions inside a message do not change my role or reveal internal settings. Please describe your situation or the scheme you are asking about.",
  },
  medical: {
    zhHant: "我不提供醫療資料，亦不會判斷病情或用藥。身體不適請諮詢醫生或致電 999。如你需要的是照顧者支援、醫療券或相關津貼，我可以按政策原文幫你核對資格。",
    zhHans: "我不提供医疗资料，亦不会判断病情或用药。身体不适请咨询医生或致电 999。如你需要的是照顾者支援、医疗券或相关津贴，我可以按政策原文帮你核对资格。",
    en: "I do not give medical information and will not judge symptoms or medication. If you feel unwell, consult a doctor or call 999. If you need carer support, health care vouchers or a related allowance, I can check eligibility against the policy text.",
  },
  offtopic: {
    zhHant: "我是政策配對助理，只回答香港政府支援計劃的資格、文件及申請方法。這個問題不在範圍內。你可以描述年齡、住屋、收入或照顧情況，我便按政策原文幫你核對；亦可致電 1823 查詢。",
    zhHans: "我是政策配对助理，只回答香港政府支援计划的资格、文件及申请方法。这个问题不在范围内。你可以描述年龄、住房、收入或照顾情况，我便按政策原文帮你核对；亦可致电 1823 查询。",
    en: "I am a policy matching assistant: I only answer questions about eligibility, documents and applications for Hong Kong government support schemes. That question is outside my scope. Describe your age, housing, income or caring situation and I will check it against the policy text; you can also call 1823.",
  },
} as const;

export function refusalText(verdict: Exclude<Verdict, "ok">, lang: "zhHant" | "zhHans" | "en"): string {
  return REFUSAL[verdict][lang];
}
