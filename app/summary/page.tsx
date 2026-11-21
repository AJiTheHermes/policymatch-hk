"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface CaseScheme {
  id: string;
  name: string;
  dept: string;
  benefit: string;
  citation: string;
  href: string;
  reasons?: string[];
}

interface CaseFile {
  createdAt: string;
  lang: string;
  question: string;
  schemes: CaseScheme[];
  excluded: number;
  note: string;
}

const KEY = "policymatch.case";

function hkDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default function SummaryPage() {
  const [data, setData] = useState<CaseFile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(JSON.parse(raw) as CaseFile);
    } catch {
      /* corrupt or blocked storage: show the empty state */
    }
    setReady(true);
  }, []);

  const clear = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setData(null);
  };

  if (!ready) return <div className="wrap-narrow py-10 text-[16px] text-slate">載入中…</div>;

  if (!data) {
    return (
      <div className="wrap-narrow py-10">
        <h1 className="text-[28px] leading-tight">個案摘要</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-slate">
          目前沒有可列印的紀錄。請先回到問答頁描述你的情況，系統找到服務後會在這裡生成一份可列印的摘要。
        </p>
        <Link
          href="/"
          className="mt-6 inline-block border border-ink px-5 py-3 text-[16px] font-bold text-ink no-underline hover:bg-mist"
        >
          返回問答
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap-narrow py-8">
      <div className="no-print flex flex-wrap items-center gap-3 border border-line bg-mist p-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-ink px-6 py-3 text-[16px] font-bold text-white hover:bg-brand-dark"
        >
          列印／儲存為 PDF
        </button>
        <button type="button" onClick={clear} className="border border-line bg-paper px-4 py-3 text-[15px] text-ink hover:bg-paper">
          清除這份紀錄
        </button>
        <Link href="/" className="text-[15px] underline">
          返回問答
        </Link>
        <p className="w-full text-[13px] leading-relaxed text-slate">
          在列印對話框選擇「另存為 PDF」即可存檔。紀錄只存在你這部裝置的瀏覽器，本網站伺服器沒有保存。
        </p>
      </div>

      <article className="sheet mt-6">
        <header className="border-b-2 border-ink pb-3">
          <p className="text-[13px] tracking-[0.12em] text-slate">Policymatch HK · 個案摘要（非政府文件）</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight">個案摘要</h1>
          <p className="mt-1 text-[14px] text-slate">生成時間：{hkDateTime(data.createdAt)}</p>
        </header>

        <section className="mt-5">
          <h2 className="text-[17px] font-bold">一、你描述的情況</h2>
          <p className="mt-2 text-[16px] leading-[1.9]">{data.question}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-[17px] font-bold">二、可能合資格的服務（{data.schemes.length} 項）</h2>
          <ol className="mt-2 space-y-3">
            {data.schemes.map((s, i) => (
              <li key={s.id} className="border-l-4 border-ink pl-3">
                <p className="text-[16px] font-bold leading-snug">
                  {i + 1}. {s.name}
                </p>
                <p className="text-[15px] leading-[1.8]">
                  部門：{s.dept}
                  <br />
                  內容：{s.benefit}
                </p>
                {s.reasons?.length ? <p className="text-[14px] leading-[1.8] text-slate">符合原因：{s.reasons.join("；")}</p> : null}
                <p className="text-[13px] text-slate">出處：{s.citation}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[14px] leading-[1.8] text-slate">
            另有 {data.excluded} 項服務經核對後未符合，未列於本摘要。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-[17px] font-bold">三、帶著這張紙去問社工</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.8]">
            <li>請對方核對以上各項的申請資格，並指出哪一項最值得先申請。</li>
            <li>問清楚每項需要帶什麼文件、去哪裡交表、大概等多久。</li>
            <li>如果同時合資格多項，問可否一併申請，或要先後次序。</li>
            <li>如果認為資料有誤，請要求更正，並記錄對方姓名與日期。</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-[17px] font-bold">四、查詢電話</h2>
          <p className="mt-2 text-[15px] leading-[1.9]">
            政府熱線 1823 · 社會福利署 2343 2255 · 緊急情況 999
          </p>
        </section>

        <section className="mt-6 border-t border-line pt-3">
          <h2 className="text-[15px] font-bold">聲明</h2>
          <p className="mt-1 text-[13px] leading-[1.8] text-slate">
            本摘要由示範系統按預先設定的資格規則自動生成，{data.note}
            結果不是政府決定，也不能代替官方申請須知。政策內容以政府原文為準；如與部門說法不同，以部門為準。
            本網站非政府官方網站，與任何政府部門沒有隸屬關係。
          </p>
          <p className="mt-2 text-[12px] text-slate">
            資料來源：政府新聞處《行政長官2026年施政報告》及附篇（示範簡化版）；長者中心名單來自社會福利署 data.gov.hk 開放數據。
            個人資料：本頁內容只存放於你的瀏覽器，沒有上傳。
          </p>
        </section>
      </article>
    </div>
  );
}
