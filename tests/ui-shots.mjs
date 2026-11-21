import { chromium } from "playwright-core";
import fs from "node:fs";

const OUT = "/config/answers/ui";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://127.0.0.1:3008";

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log("shot", name);
}

// 1. desktop home, light
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
// accept the first-visit disclaimer so the page is clickable
const dlg = page.locator("[role=dialog]");
await dlg.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
if (await dlg.isVisible().catch(() => false)) {
  await page.screenshot({ path: `${OUT}/00-disclaimer.png` });
  await page.locator("[role=dialog] button").click();
  await page.waitForTimeout(300);
}
await shot(page, "01-home-light");

// 2. ask a matching question
await page.fill("#msg", "我七十二歲，與中風的丈夫同住觀塘公屋，可以申請什麼？");
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);
await shot(page, "02-answer-match");

// expand the tool trace
const toolBtn = page.locator("button[aria-expanded]").first();
if (await toolBtn.count()) {
  await toolBtn.click();
  await page.waitForTimeout(400);
}
await page.waitForTimeout(300);
await shot(page, "03-tool-expanded");

// 3. live data question
await page.fill("#msg", "觀塘有邊間長者中心？");
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
await shot(page, "04-centres-answer");

// 4. summary page
await page.goto(`${BASE}/summary`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await shot(page, "05-summary");

// print preview (A4)
await page.emulateMedia({ media: "print" });
await page.pdf({ path: `${OUT}/06-summary-print.pdf`, format: "A4", printBackground: true });
await page.emulateMedia({ media: "screen" });
console.log("pdf 06-summary-print.pdf");

// 5. accessibility page + A++ scale
await page.goto(`${BASE}/accessibility`, { waitUntil: "networkidle" });
await shot(page, "07-accessibility");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.click('button[aria-label="最大字體"]').catch(() => {});
await page.waitForTimeout(500);
await shot(page, "08-home-xlarge");

// 6. mobile 390
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const mp = await mctx.newPage();
await mp.goto(BASE, { waitUntil: "networkidle" });
await shot(mp, "09-mobile-home");
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log("mobile overflow px:", overflow);

// 7. dark theme
const dctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const dp = await dctx.newPage();
await dp.goto(BASE, { waitUntil: "networkidle" });
await dp.evaluate(() => {
  const raw = localStorage.getItem("policymatch.prefs");
  const p = raw ? JSON.parse(raw) : {};
  localStorage.setItem("policymatch.prefs", JSON.stringify({ ...p, theme: "dark" }));
});
await dp.reload({ waitUntil: "networkidle" });
await shot(dp, "10-home-dark");

await browser.close();
console.log("done");
