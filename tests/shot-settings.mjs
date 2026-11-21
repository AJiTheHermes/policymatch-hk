import { chromium } from "playwright-core";
const OUT = "/config/answers/ui";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3008/", { waitUntil: "networkidle" });
const dlg = page.locator("[role=dialog]");
if (await dlg.isVisible().catch(() => false)) {
  await page.locator("[role=dialog] button").first().click();
  await page.waitForTimeout(300);
}
await page.goto("http://127.0.0.1:3008/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const box = page.locator("input[type=password], input[placeholder*='sk']").first();
if (await box.count()) {
  const el = await box.elementHandle();
  await page.evaluate((e) => e.scrollIntoView({ block: "center" }), el);
  await page.waitForTimeout(400);
}
await page.screenshot({ path: `${OUT}/13-settings-llm.png` });
await browser.close();
console.log("ok");
