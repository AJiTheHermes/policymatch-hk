import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:3008/", { waitUntil: "networkidle" });
const dlg = p.locator("[role=dialog]");
await dlg.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
if (await dlg.isVisible().catch(() => false)) await p.locator("[role=dialog] button").click();
await p.fill("#msg", "我七十二歲，與中風的丈夫同住觀塘公屋，可以申請什麼？");
await p.click('button[type="submit"]');
await p.waitForTimeout(2500);
const speak = p.locator('button[aria-label*="讀出"], button[aria-label*="Read"]');
console.log("speak buttons:", await speak.count());
if (await speak.count()) {
  console.log("label before:", await speak.first().getAttribute("aria-label"));
  await speak.first().click();
  await p.waitForTimeout(400);
  console.log("label after click:", await speak.first().getAttribute("aria-label"));
  console.log("innerText after:", (await speak.first().innerText()).trim());
}
await p.screenshot({ path: "/config/answers/ui/11-tts-answer.png" });
await b.close();
