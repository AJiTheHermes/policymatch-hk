import type { Metadata } from "next";
import "./globals.css";
import { PrefsProvider } from "@/lib/prefs";
import { SiteFooter, SiteHeader } from "@/components/site-frame";
import { DisclaimerModal } from "@/components/disclaimer-modal";

export const metadata: Metadata = {
  title: "PolicyMatch HK — 政策配對助手（示範）",
  description:
    "以語音或文字提問，找出可能合資格申請的香港政府支援服務，並附政策頁碼與原文頁面連結。示範版本，非政府官方網站。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-HK" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <PrefsProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
            跳至主要內容
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <DisclaimerModal />
        </PrefsProvider>
      </body>
    </html>
  );
}
