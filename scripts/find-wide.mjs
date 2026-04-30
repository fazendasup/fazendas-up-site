import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle", timeout: 120_000 });
const data = await page.evaluate(() => {
  const iw = window.innerWidth;
  const offenders = [];
  for (const el of document.body.querySelectorAll("*")) {
    const sw = el.scrollWidth;
    const cw = el.clientWidth;
    if (sw > iw + 1 && cw > 0) {
      offenders.push({
        tag: el.tagName,
        id: el.id,
        cls: String(el.className ?? "").slice(0, 180),
        sw,
        cw,
        delta: sw - cw,
      });
    }
  }
  offenders.sort((a, b) => b.delta - a.delta);
  return {
    docSW: document.documentElement.scrollWidth,
    iw,
    offenders: offenders.slice(0, 20),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
