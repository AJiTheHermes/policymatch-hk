import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "私隱政策 — PolicyMatch HK（示範）",
  description: "本示範網站如何處理（以及如何避免處理）個人資料。",
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-8 border-b border-line pb-2 text-[20px] font-bold">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[16px] leading-[1.9]">{children}</p>;
const LI = ({ children }: { children: React.ReactNode }) => (
  <li className="mt-1.5 text-[16px] leading-[1.9]">{children}</li>
);

export default function PrivacyPage() {
  return (
    <div className="wrap-narrow py-10">
      <p className="text-[13px] tracking-[0.12em] text-slate">PolicyMatch HK · 示範版本</p>
      <h1 className="mt-1 text-[30px] leading-tight">私隱政策</h1>
      <p className="mt-2 text-[14px] text-slate">最後更新：2026 年 11 月 18 日</p>

      <p className="mt-5 border-l-4 border-line bg-mist px-4 py-3 text-[15px] leading-relaxed text-slate">
        English summary: this is a student demonstration, not a government service. We do not create accounts, do not
        store your conversation on our server, and do not build a profile. Two things can leave your browser: the
        question you type, sent to the AI provider whose key <em>you</em> entered, and requests to the Hong Kong public
        data endpoints named below.
      </p>

      <H>一、我們收集什麼</H>
      <P>
        本網站不設帳戶、不設會員制度，也不需要你提供姓名、身份證號碼或聯絡方法。你輸入的問題只在你按下傳送之後，才會送到處理該次查詢的伺服器，用完即棄，不會寫入資料庫。
      </P>
      <ul className="mt-2 list-disc pl-6">
        <LI>對話內容：只保存在你瀏覽器的記憶體中，關閉或重新載入頁面即消失。</LI>
        <LI>設定：語言、深淺色、字體大小、你自行填寫的 API 金鑰，存放在瀏覽器 localStorage。</LI>
        <LI>個案摘要：只在你按「生成個案摘要」後寫入 localStorage，你可隨時在該頁清除。</LI>
        <LI>伺服器日誌：與一般網站一樣，主機可能記錄請求時間、IP 位址及錯誤，用於保安及除錯。</LI>
      </ul>

      <H>二、資料會去哪裡</H>
      <P>以下情況會令資料離開你的瀏覽器，每次都有明確標示：</P>
      <ul className="mt-2 list-disc pl-6">
        <LI>
          <strong>語言模型</strong>：示範模式不呼叫任何模型。只有在你自己於設定頁填入 API 金鑰時，才由你的瀏覽器直接送往該服務商（預設 DeepSeek）。金鑰只存於你的瀏覽器，本網站不轉存、不記錄。
        </LI>
        <LI>
          <strong>香港公開資料</strong>：查詢長者中心、急症室等候時間、天氣警告時，會向 data.gov.hk、社會福利署、醫院管理局及香港天文台的公開端點發出請求。這些請求只包含地區名稱等查詢條件，不包含你的對話內容。
        </LI>
        <LI>
          <strong>網頁搜尋</strong>：只有你在設定頁啟用並提供金鑰後才會發生，否則該工具回報停用。
        </LI>
      </ul>

      <H>三、與《個人資料（私隱）條例》的關係</H>
      <P>
        本示範原則上不收集可識別身分的個人資料。若日後擴展為正式服務而需要收集，會按條例六項保障資料原則處理：收集目的及方式、準確性、保留期限、保安、公開政策，以及查閱與更正權利。現階段：
      </P>
      <ul className="mt-2 list-disc pl-6">
        <LI>收集目的：只用於回答你當次查詢，不作其他用途。</LI>
        <LI>保留：對話不落庫；瀏覽器內的設定與摘要由你自行清除。</LI>
        <LI>保安：全站以 HTTPS 提供；API 金鑰不上送伺服器儲存。</LI>
        <LI>查閱及更正：由於我們不持有你的個人資料，沒有紀錄可供查閱；如你認為有誤，可直接清除瀏覽器資料。</LI>
      </ul>
      <P>
        你輸入的內容若包含他人（例如家人）的個人資料，請先取得對方同意。請勿輸入身份證號碼、病歷、銀行資料或任何你不想外傳的內容。
      </P>

      <H>四、兒童及長者</H>
      <P>
        本示範適合一般公眾使用，並非針對兒童設計。長者使用時，建議由家人或照顧者陪同核對結果，尤其是申請資格與文件要求。
      </P>

      <H>五、你的選擇</H>
      <P>
        你可以不清除瀏覽器資料就離開，網站不會阻止你；你也可以在瀏覽器設定中封鎖 localStorage，功能會退化但不影響閱讀政策內容。
      </P>

      <H>六、聯絡</H>
      <P>
        本示範沒有正式的資料保障主任。如你發現私隱相關問題，請在課堂或項目渠道向開發者提出，並記錄日期。若涉及真實的個人資料外洩疑慮，應直接向個人資料私隱專員公署查詢。
      </P>

      <p className="mt-8 border-t border-line pt-4 text-[13px] leading-relaxed text-slate">
        本頁是示範文件，並非法律意見。正式推出前，應由熟悉香港《個人資料（私隱）條例》的律師及私隱顧問覆核，並完成私隱影響評估。
      </p>
    </div>
  );
}
