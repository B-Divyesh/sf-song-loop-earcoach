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
  const activeA11y = await new AxeBuilder({ page }).analyze();
  expect(activeA11y.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  await page.locator("#range-b").fill("2.5");
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.getByText("two-note-hook", { exact: true })).toBeVisible();
  await page.getByText("two-note-hook", { exact: true }).last().click();
  await expect(page.getByRole("heading", { name: "Hook it back" })).toBeVisible();
});

test("completes a MIDI answer and shows actionable comparison", async ({ page }) => {
  await page.addInitScript(() => {
    const input = { onmidimessage: null as null | ((event: { data: Uint8Array }) => void) };
    Object.defineProperty(navigator, "requestMIDIAccess", { value: async () => ({ inputs: new Map([["test", input]]) }) });
    (window as typeof window & { sendTestNote?: (note: number) => void }).sendTestNote = note => input.onmidimessage?.({ data: new Uint8Array([0x90, note, 100]) });
  });
  await page.goto("/");
  await page.locator("#clip-file").setInputFiles({ name: "midi-hook.wav", mimeType: "audio/wav", buffer: wavFixture() });
  await page.getByRole("button", { name: "MIDI", exact: true }).click();
  await page.getByRole("button", { name: "Start MIDI answer" }).click();
  for (const note of [69, 69, 69, 69, 71, 71, 71, 71]) await page.evaluate(n => (window as typeof window & { sendTestNote: (value: number) => void }).sendTestNote(n), note);
  await page.getByRole("button", { name: "Finish answer" }).click();
  await expect(page.getByText(/Hook held|Shape emerging|One turn at a time/)).toBeVisible();
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
  await expect(page.getByRole("button", { name: /Add a song clip/ })).toBeFocused();
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
