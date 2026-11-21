import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = "http://127.0.0.1:3008";
const OUT = "/config/answers/ui";
fs.mkdirSync(OUT, { recursive: true });
const report = {};

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });

// dismiss disclaimer, remember it for the trap test below
const dlg = page.locator("[role=dialog]");
await dlg.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
report.modal = {
  visible: await dlg.isVisible().catch(() => false),
  buttons: await dlg.locator("button").allInnerTexts().catch(() => []),
  links: await dlg.locator("a").allInnerTexts().catch(() => []),
  hasClose: await dlg.locator('button[aria-label*="關"], button[aria-label*="close"]').count(),
};

// focus trap while open
if (report.modal.visible) {
  const seen = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    seen.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        const inDialog = Boolean(el?.closest("[role=dialog]"));
        return `${el?.tagName}:${(el?.textContent || "").trim().slice(0, 12)}:${inDialog ? "in" : "OUT"}`;
      }),
    );
  }
  report.modal.focusTrap = seen;
  await page.locator("[role=dialog] button").first().click();
  await page.waitForTimeout(300);
}

// heading order
report.headings = await page.evaluate(() =>
  [...document.querySelectorAll("h1,h2,h3")].map((h) => `${h.tagName}:${h.textContent.trim().slice(0, 24)}`),
);

// touch targets
report.smallTargets = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("button, a, input, textarea, select")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const label = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 22);
    if (r.height < 44 || r.width < 24) out.push({ label, w: Math.round(r.width), h: Math.round(r.height) });
  }
  return out.slice(0, 25);
});

// keyboard focus visibility on the main page
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {});
const focusTrail = [];
for (let i = 0; i < 10; i++) {
  await page.keyboard.press("Tab");
  focusTrail.push(
    await page.evaluate(() => {
      const el = document.activeElement;
      const cs = el ? getComputedStyle(el) : null;
      return {
        tag: el?.tagName,
        label: (el?.getAttribute("aria-label") || el?.textContent || "").trim().slice(0, 20),
        outline: cs ? `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` : "",
      };
    }),
  );
}
report.focusTrail = focusTrail;

// accessible names via CDP AX tree
const cdp = await ctx.newCDPSession(page);
await cdp.send("Accessibility.enable");
const { nodes } = await cdp.send("Accessibility.getFullAXTree");
report.unnamedButtons = nodes
  .filter((n) => n.role?.value === "button" && !n.name?.value)
  .map((n) => n.backendDOMNodeId)
  .slice(0, 10);

// 320px reflow (WCAG 1.4.10)
for (const w of [320, 360, 390]) {
  await page.setViewportSize({ width: w, height: 800 });
  await page.waitForTimeout(250);
  report[`overflow_${w}`] = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

// 200% text zoom approximation (WCAG 1.4.4)
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
report.zoomNote = "px-based type does not respond to root font-size; measured A++ scale instead";

// A++ scale overflow
await page.click('button[aria-label="最大字體"]').catch(() => {});
await page.waitForTimeout(400);
report.overflow_xlarge = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await page.click('button[aria-label="正常字體"]').catch(() => {});

// empty submit behaviour
await page.fill("#msg", "   ");
report.emptySubmitDisabled = await page.locator('button[type="submit"]').isDisabled();

// live region
report.ariaLive = await page.evaluate(() => {
  const el = document.querySelector('[aria-live]');
  return el ? el.getAttribute("aria-live") : null;
});

// consent/exit paths for the disclaimer (cookies/analytics?)
report.storageKeys = await page.evaluate(() => Object.keys(localStorage));

console.log(JSON.stringify(report, null, 2));
await browser.close();
