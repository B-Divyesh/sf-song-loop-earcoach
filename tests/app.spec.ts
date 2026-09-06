import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installMidiInput, wavFixture } from "./fixtures";

test("imports a private clip, saves the loop, and survives refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Learn short song phrases by ear" })).toBeVisible();
  await page.locator("#clip-file").setInputFiles({ name: "two-note-hook.wav", mimeType: "audio/wav", buffer: wavFixture() });
  await expect(page.getByRole("heading", { name: "Choose the loop" })).toBeVisible();
  await expect(page.getByText("two-note-hook", { exact: true }).first()).toBeVisible();
  const activeA11y = await new AxeBuilder({ page }).analyze();
  expect(activeA11y.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  await page.locator("#range-b").fill("2.5");
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.getByText("two-note-hook", { exact: true })).toBeVisible();
  await page.getByText("two-note-hook", { exact: true }).last().click();
  await expect(page.getByRole("heading", { name: "Play it from memory" })).toBeVisible();
});

test("completes a MIDI answer and shows actionable comparison", async ({ page }) => {
  await installMidiInput(page);
  await page.goto("/");
  await page.locator("#clip-file").setInputFiles({ name: "midi-hook.wav", mimeType: "audio/wav", buffer: wavFixture() });
  await page.getByRole("button", { name: "MIDI", exact: true }).click();
  await page.getByRole("button", { name: "Start MIDI answer" }).click();
  for (const note of [69, 69, 69, 69, 71, 71, 71, 71]) await page.evaluate(n => (window as typeof window & { sendTestNote: (value: number) => void }).sendTestNote(n), note);
  await page.getByRole("button", { name: "Finish answer" }).click();
  await expect(page.getByText(/Close match|Partial match|Try another answer/)).toBeVisible();
  await expect(page.getByText("Try this next")).toBeVisible();
});

test("empty screen has no serious accessibility violations", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  expect(errors).toEqual([]);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to practice" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Hookback home" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator('.site-nav a[href="/demo"]')).toBeFocused();
});

test("keeps every sequential keyboard stop visible and routes file choice through visible controls", async ({ page }) => {
  await page.goto("/");
  const keyboardStops = [".skip-link", ".wordmark", ".site-nav a:nth-child(1)", ".site-nav a:nth-child(2)",
    ".site-nav a:nth-child(3)", ".first-actions a", "#clip-trigger", "#queue-trigger", ".upgrade-actions a",
    "#restore-license", "footer nav a:nth-child(1)", "footer nav a:nth-child(2)", "#export-data", "#import-trigger"]
    .map(selector => page.locator(selector));

  for (const stop of keyboardStops) {
    await page.keyboard.press("Tab");
    await expect(stop).toBeFocused();
    await expect(stop).toBeVisible();
    expect(await stop.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 1 && rect.height > 1 && style.visibility !== "hidden" && style.display !== "none";
    })).toBe(true);
  }

  for (const input of ["#clip-file", "#queue-file", "#import-data"]) {
    await expect(page.locator(input)).toHaveAttribute("tabindex", "-1");
  }
});

test("keeps global and footer touch targets at least 44px in each dimension", async ({ page }) => {
  await page.goto("/");
  const touchTargets = [
    page.getByRole("link", { name: "Skip to practice" }),
    page.getByRole("link", { name: "Hookback home" }),
    page.locator("footer nav a").nth(0),
    page.locator("footer nav a").nth(1),
    page.getByRole("button", { name: "Export my data" }),
    page.getByRole("button", { name: "Import backup" })
  ];

  for (const target of touchTargets) {
    await expect(target).toBeVisible();
    expect(await target.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    })).toBe(true);
  }
});

test("uses the live billing endpoint and enforces the 5–12 second phrase policy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Buy Studio" })).toHaveAttribute(
    "href", "https://api.sociobot.in/api/v1/products/song-loop-earcoach/checkout"
  );

  await page.locator("#clip-file").setInputFiles({ name: "too-short.wav", mimeType: "audio/wav", buffer: wavFixture(0.8) });
  await expect(page.getByRole("status")).toContainText("Choose a 5–12 second practice phrase");
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();

  await page.locator("#clip-file").setInputFiles({ name: "too-long.wav", mimeType: "audio/wav", buffer: wavFixture(12.5) });
  await expect(page.getByRole("status")).toContainText("Choose a 5–12 second practice phrase");
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
});

test("app shell and saved route work offline", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.getByText("On-device mode")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Learn short song phrases by ear" })).toBeVisible();
});

test("legal pages are direct, semantic routes", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.locator("main h1")).toHaveCount(1);
  await page.goto("/terms/");
  await expect(page).toHaveTitle(/Terms/);
  await expect(page.locator("main h1")).toHaveCount(1);
});

test("metadata and the designed not-found page identify their routes", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveTitle("Demo — Hookback");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://song-loop-earcoach.sociobot.in/demo");
  const response = await page.goto("/not-a-real-hookback-route");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found — Hookback");
  await expect(page.getByRole("heading", { name: "This page does not exist" })).toBeVisible();
});

test("demo, legal, and not-found routes have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/demo", "/privacy/", "/terms/", "/not-a-real-hookback-route"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || "")), route).toEqual([]);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
  }
});

test("reduced motion and 200 percent text keep the demo usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo");
  const duration = await page.getByRole("button", { name: "Play loop" }).evaluate(element => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Play loop" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record answer" })).toBeVisible();
});
