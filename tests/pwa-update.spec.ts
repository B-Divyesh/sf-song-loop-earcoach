import { expect, test } from "@playwright/test";

test("offers a waiting service-worker update and activates it only after Update", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js?test-update=1", { scope: "/" });
  });

  await expect(page.locator("#update-toast")).toBeVisible();
  await expect(page.getByRole("button", { name: "Update", exact: true })).toBeEnabled();

  const reloaded = page.waitForEvent("framenavigated", frame => frame === page.mainFrame());
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await reloaded;
  await page.waitForLoadState("domcontentloaded");
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistration().then(registration => !registration?.waiting))).toBe(true);
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL.includes("test-update=1"))).toBe(true);
});
