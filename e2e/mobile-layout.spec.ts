/**
 * Falha o CI/local se o documento ficar mais largo que o viewport ao scrollar (causa típica de texto cortado no iPhone).
 * Corre antes do deploy: npm run qa:layout-mobile
 */
import { expect, test } from "@playwright/test";

const iphoneUa =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

test.describe("mobile horizontal bounds", () => {
  for (const width of [320, 360, 390, 414, 428]) {
    test(`scrollWidth ≤ innerWidth @ ${width}px (Safari UA)`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width, height: 900 },
        userAgent: iphoneUa,
      });
      const page = await ctx.newPage();
      await page.goto("/", { waitUntil: "networkidle", timeout: 120_000 });

      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const y = Math.floor((scrollHeight * i) / steps);
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(60);
        const dims = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
        }));
        expect(dims.sw, `document wider than viewport at scrollY=${y}`).toBeLessThanOrEqual(dims.iw + 1);
      }

      await page.goto("/#impacto", { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(400);

      const impactCheck = await page.evaluate(() => {
        const iw = window.innerWidth;
        const sw = document.documentElement.scrollWidth;
        const metrics = Array.from(document.querySelectorAll("#impacto .fu-impact-stat-value")).map((n) => {
          const r = n.getBoundingClientRect();
          return { text: (n.textContent ?? "").trim(), right: r.right, left: r.left };
        });
        return { iw, sw, metrics };
      });

      expect(impactCheck.sw).toBeLessThanOrEqual(impactCheck.iw + 1);
      for (const m of impactCheck.metrics) {
        expect(m.right, `metric “${m.text}” extends past viewport`).toBeLessThanOrEqual(impactCheck.iw + 2);
        expect(m.left).toBeGreaterThanOrEqual(-2);
      }

      await ctx.close();
    });
  }
});
