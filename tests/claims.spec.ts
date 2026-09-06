import { expect, test } from "@playwright/test";
import { installMidiInput, wavFixture } from "./fixtures";

const DEMO_LABEL = "Demo — sample data, nothing is saved";

test("@claim:demo-isolation keeps sample changes away from real practice", async ({ page }) => {
  await page.goto("/");
  await page.locator("#clip-file").setInputFiles({ name: "my-real-phrase.wav", mimeType: "audio/wav", buffer: wavFixture() });
  await expect(page.getByText("my-real-phrase", { exact: true }).first()).toBeVisible();

  await page.goto("/demo");
  await expect(page.getByText(DEMO_LABEL)).toBeVisible();
  await expect(page.getByText("Four-note guitar phrase", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Sample result")).toContainText("match");
  await page.locator("#queue-file").setInputFiles({ name: "demo-change.wav", mimeType: "audio/wav", buffer: wavFixture() });
  await expect(page.getByText("demo-change", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByText("Demo reset to the original sample.")).toBeVisible();
  await expect(page.getByText("demo-change", { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Start for real" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("my-real-phrase", { exact: true })).toBeVisible();
  await expect(page.getByText("Four-note guitar phrase", { exact: true })).toHaveCount(0);
});

test("@claim:offline-reload reloads the sample after the first visit", async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto("/demo");
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText(DEMO_LABEL)).toBeVisible();
    await expect(page.getByLabel("Sample result")).toContainText("match");
  } finally {
    await context.close();
  }
});

test("@claim:no-account opens working practice without sign-in", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "Four-note guitar phrase" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play loop" })).toBeEnabled();
  await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0);
  expect(await page.context().cookies()).toEqual([]);
});

test("@claim:local-audio sends no clip or answer request", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  const encodedAnswer = wavFixture(1).toString("base64");
  await page.addInitScript(encoded => {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => undefined }] }) }
    });
    class FakeMediaRecorder {
      mimeType = "audio/wav";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(_stream: unknown) {}
      start() {}
      stop() {
        this.ondataavailable?.({ data: new Blob([bytes], { type: "audio/wav" }) });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", { value: FakeMediaRecorder });
  }, encodedAnswer);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Play loop" }).click();
  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: "Record answer" }).click();
  await page.getByRole("button", { name: "Finish answer" }).click();
  await expect(page.getByText("Answer compared and saved.")).toBeVisible();
  const storedFields = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("hookback-demo");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const records = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
      const request = database.transaction("clips").objectStore("clips").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return Object.keys(records[0]).sort();
  });
  expect(storedFields).not.toContain("recording");
  expect(storedFields).not.toContain("answerAudio");
  const remote = requests.filter(url => new URL(url).origin !== "http://127.0.0.1:4173");
  expect(remote).toEqual([]);
});

test("@claim:no-tracking loads no analytics, pixels, or remote scripts", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/demo");
  await page.getByRole("button", { name: "Reset demo" }).click();
  const resourceUrls = await page.evaluate(() => performance.getEntriesByType("resource").map(entry => entry.name));
  expect([...requests, ...resourceUrls].every(url => new URL(url).origin === "http://127.0.0.1:4173")).toBe(true);
});

test("@claim:clip-duration accepts 5 seconds and rejects outside 5–12 seconds", async ({ page }) => {
  await page.goto("/demo");
  const input = page.locator("#queue-file");
  await input.setInputFiles({ name: "short.wav", mimeType: "audio/wav", buffer: wavFixture(0.8) });
  await expect(page.locator("#live-status")).toContainText("Choose a 5–12 second practice phrase");
  await input.setInputFiles({ name: "long.wav", mimeType: "audio/wav", buffer: wavFixture(12.5) });
  await expect(page.locator("#live-status")).toContainText("Choose a 5–12 second practice phrase");
  await input.setInputFiles({ name: "five-seconds.wav", mimeType: "audio/wav", buffer: wavFixture(5) });
  await expect(page.getByRole("heading", { name: "five-seconds" })).toBeVisible();
  await expect(page.getByText("Ready. A 0:05.0 loop is selected.")).toBeVisible();
});

test("@claim:recording-state shows when the microphone is recording locally", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => undefined }] }) }
    });
    class FakeMediaRecorder {
      mimeType = "audio/wav";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(_stream: unknown) {}
      start() {}
      stop() { this.onstop?.(); }
    }
    Object.defineProperty(window, "MediaRecorder", { value: FakeMediaRecorder });
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Microphone", exact: true }).click();
  await page.getByRole("button", { name: "Record answer" }).click();
  await expect(page.getByText("Listening…")).toBeVisible();
  await expect(page.getByText("Recording is on. Your audio stays in this browser.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish answer" })).toBeVisible();
});

test("@claim:midi-read-only reads input notes without sending output", async ({ page }) => {
  await installMidiInput(page);
  await page.goto("/demo");
  await page.getByRole("button", { name: "MIDI", exact: true }).click();
  await page.getByRole("button", { name: "Start MIDI answer" }).click();
  await page.evaluate(() => (window as typeof window & { sendTestNote: (note: number) => void }).sendTestNote(57));
  await expect(page.getByText(/latest A3/)).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { midiOptions: unknown }).midiOptions)).toEqual({ sysex: false, software: false });
  expect(await page.evaluate(() => (window as typeof window & { midiOutputUsed: boolean }).midiOutputUsed)).toBe(false);
  await expect(page.getByText("Read-only note input")).toBeVisible();
});

test("@claim:pitch-feedback matches known A4 and B4 audio to the same MIDI notes", async ({ page }) => {
  await installMidiInput(page);
  await page.goto("/demo");
  await page.locator("#queue-file").setInputFiles({ name: "known-a4-b4.wav", mimeType: "audio/wav", buffer: wavFixture(5) });
  await page.getByRole("button", { name: "MIDI", exact: true }).click();
  await page.getByRole("button", { name: "Start MIDI answer" }).click();
  for (const note of [69, 69, 69, 71, 71, 71, 71, 71, 71, 71]) {
    await page.evaluate(value => (window as typeof window & { sendTestNote: (note: number) => void }).sendTestNote(value), note);
  }
  await page.getByRole("button", { name: "Finish answer" }).click();
  const score = Number(await page.locator(".score-ring strong").textContent());
  expect(score).toBeGreaterThanOrEqual(90);
  const comparisonText = await page.locator(".score-block").innerText();
  const cents = Number(comparisonText.match(/(\d+)¢ from center/)?.[1]);
  expect(cents).toBeLessThanOrEqual(5);
  await expect(page.getByText("Try this next")).toBeVisible();
});

test("@claim:practice-persists keeps the demo queue and loop after reload", async ({ page }) => {
  await page.goto("/demo");
  await page.locator("#range-b").fill("6.5");
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.getByText(DEMO_LABEL)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Four-note guitar phrase" })).toBeVisible();
  await expect(page.locator("#range-b")).toHaveValue("6.5");
  await expect(page.getByLabel("Sample result")).toContainText("match");
});

test("@claim:backup-audio exports sample audio and restores it", async ({ page }) => {
  await page.goto("/demo");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export my data" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const backup = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(backup.format).toBe("hookback-backup");
  expect(backup.clips).toHaveLength(1);
  expect(backup.clips[0].blob.type).toBe("audio/wav");
  expect(backup.clips[0].blob.data.length).toBeGreaterThan(1000);

  await page.getByRole("button", { name: "Reset demo" }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.locator("#import-data").setInputFiles({
    name: "hookback-backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup))
  });
  await expect(page.getByText("Imported 1 clip.")).toBeVisible();
  await expect(page.getByText("Four-note guitar phrase", { exact: true })).toBeVisible();
});

test("@claim:free-studio-split keeps core practice free and lists the paid offer", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: "Play loop" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Export my data" })).toBeEnabled();
  await expect(page.getByText("Hookback Studio · $19 one-time purchase")).toBeVisible();
  await expect(page.getByText(/Studio adds named practice packs and an all-time progress review/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Buy Studio" })).toHaveAttribute("href", "https://api.sociobot.in/api/v1/products/song-loop-earcoach/checkout");
});
