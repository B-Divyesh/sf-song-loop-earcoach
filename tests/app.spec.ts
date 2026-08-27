import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function wavFixture(): Buffer {
  const sampleRate = 44_100;
  const seconds = 3;
  const count = sampleRate * seconds;
  const buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + count * 2, 4); buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36);
  buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i += 1) {
    const hz = i < sampleRate * 1.5 ? 440 : 493.88;
    buffer.writeInt16LE(Math.round(Math.sin(2 * Math.PI * hz * i / sampleRate) * 18_000), 44 + i * 2);
  }
  return buffer;
}

test("imports a private clip, saves the loop, and survives refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: /catch the hook/i })).toBeVisible();
  await page.locator("#clip-file").setInputFiles({ name: "two-note-hook.wav", mimeType: "audio/wav", buffer: wavFixture() });
  await expect(page.getByRole("heading", { name: "Cut the phrase" })).toBeVisible();
  await expect(page.getByText("two-note-hook", { exact: true }).first()).toBeVisible();
  await page.locator("#range-b").fill("2.5");
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.getByText("two-note-hook", { exact: true })).toBeVisible();
  await page.getByText("two-note-hook", { exact: true }).last().click();
  await expect(page.getByRole("heading", { name: "Hook it back" })).toBeVisible();
});

test("empty screen has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});

test("app shell and saved route work offline", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.getByText("Local mode")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /catch the hook/i })).toBeVisible();
});

test("legal pages are direct, semantic routes", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.locator("main h1")).toHaveCount(1);
  await page.goto("/terms/");
  await expect(page).toHaveTitle(/Terms/);
  await expect(page.locator("main h1")).toHaveCount(1);
});
