import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "無障礙聲明 — PolicyMatch HK（示範）",
  description: "本示範的無障礙目標、已實作功能、量測結果與已知限制。",
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-8 border-b border-line pb-2 text-[20px] font-bold">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[16px] leading-[1.9]">{children}</p>;
const LI = ({ children }: { children: React.ReactNode }) => (
  <li className="mt-1.5 text-[16px] leading-[1.9]">{children}</li>
);

export default function AccessibilityPage() {
  return (
    <div className="wrap-narrow py-10">
      <p className="text-[13px] tracking-[0.12em] text-slate">PolicyMatch HK · 示範版本</p>
      <h1 className="mt-1 text-[30px] leading-tight">無障礙聲明</h1>
      <p className="mt-2 text-[14px] text-slate">最後更新：2026 年 11 月 18 日</p>

      <p className="mt-5 border-l-4 border-line bg-mist px-4 py-3 text-[15px] leading-relaxed text-slate">
        English summary: we aim at WCAG 2.1 level AA and at the Hong Kong government&apos;s accessibility baseline. Text
        scaling, keyboard focus, language tagging and a print-friendly case sheet are implemented; speech output and a
        formal audit are not. Known gaps are listed below rather than hidden.
      </p>

      <H>一、目標標準</H>
      <P>
        本示範以 <strong>WCAG 2.1 AA</strong> 為目標，並參考香港政府《網站及流動應用程式無障礙指引》的基本要求（可感知、可操作、可理解、穩健）。現階段是自行檢查的結果，未經第三方審核。
      </P>

      <H>二、已實作並量測過的功能</H>
      <ul className="mt-2 list-disc pl-6">
        <LI>
          <strong>文字大小三級</strong>：頁首 A／A+／A++ 即時放大全站（1.0／1.12／1.25 倍），設定存於你的瀏覽器，列印時自動還原。
        </LI>
        <LI>
          <strong>鍵盤可達</strong>：所有按鈕、連結、輸入框可用 Tab 到達，並有統一 3px 金色焦點框；頁首第一個元素是「跳至主要內容」。
        </LI>
        <LI>
          <strong>語言標示</strong>：頁面 <code>lang</code> 隨語言切換（zh-Hant-HK／zh-Hans／en），讀屏軟件可正確發音。
        </LI>
        <LI>
          <strong>動態內容朗讀</strong>：對話區設 <code>aria-live=&quot;polite&quot;</code>，新答案會由讀屏軟件讀出；工具執行狀態有獨立標示。
        </LI>
        <LI>
          <strong>顏色對比</strong>：實測十組主要前景／背景組合，全部達到 AA（4.5:1）以上。正文 17.85:1、次要文字 8.88:1、連結 6.57:1、深色模式正文 15.04:1。
        </LI>
        <LI>
          <strong>不只靠顏色</strong>：工具成功／失敗同時用文字（「完成」「失敗」）表示，不以紅綠燈顏色作唯一訊息。
        </LI>
        <LI>
          <strong>減少動態</strong>：系統設定 <code>prefers-reduced-motion</code> 時，動畫與平滑捲動自動關閉。
        </LI>
        <LI>
          <strong>可列印</strong>：個案摘要頁以 A4 排版、16px 以上正文、黑白列印仍清晰，方便長者帶去見社工。
        </LI>
        <LI>
          <strong>可聽</strong>：每個答案下方有「讀出」按鈕，以系統語音朗讀廣東話；再按一次即停止。不錄音、不上傳。
        </LI>
      </ul>

      <H>三、輸入方式</H>
      <P>
        除打字外，可用語音輸入（廣東話），答案亦可用系統語音讀出。語音輸入透過瀏覽器內建 Web Speech API，音訊由瀏覽器供應商處理；本示範不錄音、不儲存。若你的瀏覽器不支援，按鈕會停用並顯示原因，不會靜靜失效。
      </P>

      <H>四、已知限制</H>
      <P>以下問題我們知道但未解決，寫出來比隱藏好：</P>
      <ul className="mt-2 list-disc pl-6">
        <LI>
          <strong>未經真人測試</strong>：沒有邀請視障、聽障、認知障礙或行動不便用家試用，也沒有第三方無障礙審核報告。
        </LI>
        <LI>
          <strong>語音輸出未逐機測試</strong>：每個答案下方有「讀出」按鈕，用系統語音朗讀；實際聲音取決於裝置有無廣東話語音，我們只在桌面 Chromium 測試過按鈕與狀態切換，未在長者實際手機上試聽。
        </LI>
        <LI>
          <strong>語音輸入有瀏覽器限制</strong>：Chrome、Edge、Safari 支援；Firefox 預設不支援，只能打字。
        </LI>
        <LI>
          <strong>放大後的版面</strong>：A++ 放大時，部分固定寬度元素可能出現水平滾動；我們只在 390px 寬度量測過一次，未逐頁複測。
        </LI>
        <LI>
          <strong>圖示說明</strong>：介面圖示多數以文字標籤輔助，但少數裝飾性符號（如 ▸ ▾）未逐一加 <code>aria-hidden</code>。
        </LI>
        <LI>
          <strong>表格與複雜圖表</strong>：目前沒有資料表格；日後若加，需補表格標題與關聯標示。
        </LI>
      </ul>

      <H>五、遇到障礙怎麼辦</H>
      <P>
        如你遇到無法操作的地方，請記錄：頁面名稱、你做過什麼、用哪個瀏覽器與輔助工具、發生什麼。把紀錄交回項目渠道，會優先處理。若涉及真實的服務歧視問題，可向平等機會委員會查詢。
      </P>

      <p className="mt-8 border-t border-line pt-4 text-[13px] leading-relaxed text-slate">
        本頁描述的是示範版本的實際狀態，不是承諾。正式推出前應完成：無障礙審核（WCAG 2.1 AA 全項目）、真人測試，以及無障礙改善時間表。
      </p>
    </div>
  );
}
