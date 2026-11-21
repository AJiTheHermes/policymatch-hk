import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "使用條款 — PolicyMatch HK（示範）",
  description: "示範網站的使用條件、責任界線及資料授權。",
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-8 border-b border-line pb-2 text-[20px] font-bold">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[16px] leading-[1.9]">{children}</p>;
const LI = ({ children }: { children: React.ReactNode }) => (
  <li className="mt-1.5 text-[16px] leading-[1.9]">{children}</li>
);

export default function TermsPage() {
  return (
    <div className="wrap-narrow py-10">
      <p className="text-[13px] tracking-[0.12em] text-slate">PolicyMatch HK · 示範版本</p>
      <h1 className="mt-1 text-[30px] leading-tight">使用條款</h1>
      <p className="mt-2 text-[14px] text-slate">最後更新：2026 年 11 月 18 日</p>

      <p className="mt-5 border-l-4 border-line bg-mist px-4 py-3 text-[15px] leading-relaxed text-slate">
        English summary: this is a student project, not an official government service and not professional advice. Use
        it to prepare questions, not to make a final decision. We give no warranty of accuracy, and the department&apos;s
        decision always prevails.
      </p>

      <H>一、這是什麼</H>
      <P>
        PolicyMatch HK 是一個課堂示範項目，用來說明「以程式核對資格、以語言模型解釋結果」的分工。它<strong>不是</strong>政府網站，與任何政府部門、醫院管理局或社會福利署沒有隸屬、授權或合作關係。
      </P>

      <H>二、不是專業意見</H>
      <P>
        本網站不提供醫療、法律、財務或社工專業意見。任何涉及症狀、藥物、情緒危機或法律責任的問題，我們會拒絕作答並建議你找合適的專業人員或致電相關熱線。
      </P>

      <H>三、準確性與責任界線</H>
      <P>
        資格判斷由預先設定的規則程式執行，規則按公開政策文件簡化而成；語言模型只負責檢索與書寫，不參與判斷。儘管如此：
      </P>
      <ul className="mt-2 list-disc pl-6">
        <LI>政策會改，示範資料可能滯後，畫面上會標示資料日期與擷取時間。</LI>
        <LI>每項結果都附出處；如與政府原文有出入，以政府原文及部門決定為準。</LI>
        <LI>本示範按「現狀」提供，不保證正確、完整或適合任何特定用途，亦不承擔因使用而引致的損失。</LI>
        <LI>即時資料（急症室等候時間、天氣警告、長者中心名單）由第三方發布，我們只轉載，不作核實。</LI>
      </ul>

      <H>四、你可不可以這樣用</H>
      <P>你可以：閱讀、示範、在課堂或簡報中引用，並註明出處。</P>
      <P>你不可以：</P>
      <ul className="mt-2 list-disc pl-6">
        <LI>把它包裝成政府官方服務，或移除畫面上的「示範」「非政府官方網站」標示。</LI>
        <LI>用自動化方式大量查詢，令公開資料端點或本示範的伺服器負荷過重。</LI>
        <LI>輸入他人的個人資料，或嘗試以此系統作出對他人有法律後果的決定。</LI>
        <LI>嘗試繞過拒答機制，要求系統提供醫療診斷、法律意見或改變其角色。</LI>
      </ul>

      <H>五、知識產權與資料授權</H>
      <P>
        政策文本及開放數據的版權屬原有發布者。本示範使用的政府資料依 data.gov.hk 開放數據授權條款使用，並在畫面標明來源；長者中心名單來自社會福利署，急症室等候時間來自醫院管理局，天氣資料來自香港天文台。
      </P>
      <P>
        本項目的程式碼與介面設計由開發者持有；引述時請保留項目名稱及示範性質的說明。
      </P>

      <H>六、第三者服務</H>
      <P>
        若你在設定頁填入語言模型或搜尋服務的 API 金鑰，你與該服務商之間的關係受其自身條款約束。金鑰產生的費用、資料處理方式及可用性，均由該服務商決定，與本示範無關。
      </P>

      <H>七、條款變更</H>
      <P>示範期間條款可能隨時修改，修改後會更新本頁日期，不另作通知。</P>

      <p className="mt-8 border-t border-line pt-4 text-[13px] leading-relaxed text-slate">
        本頁是示範文件，並非法律意見。正式推出前，應由律師覆核，並按實際營運模式（是否收費、是否處理個人資料、是否向政府提供服務）調整。
      </p>
    </div>
  );
}
