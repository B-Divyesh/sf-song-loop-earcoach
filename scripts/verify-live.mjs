import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const origin = (process.argv[2] || "https://song-loop-earcoach.sociobot.in").replace(/\/$/, "");
const output = process.argv[3] || "/work/.evidence/repair-4-live";
const browser = await chromium.launch();
const summary = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "phone", width: 390, height: 844 }]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => requests.push(request.url()));

  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  assert(await page.title() === "Hookback — learn short song phrases by ear", `${viewport.name}: home title`);
  assert((await page.locator("h1").textContent())?.trim() === "Learn short song phrases by ear", `${viewport.name}: home h1`);
  assert(await page.getByText(/For self-taught instrumentalists/).isVisible(), `${viewport.name}: audience`);
  assert(await page.getByRole("link", { name: "Try it with sample data" }).isVisible(), `${viewport.name}: first action`);
  await page.screenshot({ path: `${output}/home-${viewport.name}.png`, fullPage: true });

  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await page.waitForSelector(".demo-result");
  assert(new URL(page.url()).pathname === "/demo", `${viewport.name}: demo URL`);
  assert(await page.getByText("Demo — sample data, nothing is saved").isVisible(), `${viewport.name}: demo label`);
  assert(await page.getByText("Four-note guitar phrase", { exact: true }).first().isVisible(), `${viewport.name}: sample clip`);
  assert((await page.getByLabel("Sample result").textContent())?.includes("match"), `${viewport.name}: populated result`);
  await page.locator("#range-b").fill("6.5");
  await page.waitForTimeout(450);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByText("Demo reset to the original sample.").waitFor();
  assert(await page.locator("#range-b").inputValue() === "8", `${viewport.name}: demo reset`);
  const axe = await new AxeBuilder({ page }).analyze();
  const severe = axe.violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
  assert(severe.length === 0, `${viewport.name}: axe violations ${severe.map(item => item.id).join(",")}`);
  await page.screenshot({ path: `${output}/demo-${viewport.name}.png`, fullPage: true });

  await page.getByRole("link", { name: "Start for real" }).click();
  await page.waitForURL(`${origin}/`);
  assert(await page.getByText("No saved clips yet.").isVisible(), `${viewport.name}: real queue unchanged`);
  assert(await page.getByText("Four-note guitar phrase", { exact: true }).count() === 0, `${viewport.name}: sample absent from real data`);
  assert(errors.length === 0, `${viewport.name}: browser errors ${errors.join(" | ")}`);
  assert(requests.every(url => new URL(url).origin === origin), `${viewport.name}: unexpected request origin`);
  summary.push({ viewport: viewport.name, demo: "pass", reset: "pass", realDataUnchanged: "pass", errors: 0, seriousAxe: 0 });
  await context.close();
}

const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const offlinePage = await offlineContext.newPage();
await offlinePage.goto(`${origin}/demo`);
await offlinePage.evaluate(async () => { await navigator.serviceWorker.ready; });
await offlinePage.reload();
await offlinePage.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
await offlineContext.setOffline(true);
await offlinePage.reload();
assert(await offlinePage.getByText("Demo — sample data, nothing is saved").isVisible(), "phone: offline demo reload");
await offlineContext.setOffline(false);
summary.push({ viewport: "phone", offlineReload: "pass" });
await offlineContext.close();

const routeContext = await browser.newContext();
const routePage = await routeContext.newPage();
const notFound = await routePage.goto(`${origin}/not-a-real-route-repair-4`);
assert(notFound?.status() === 404, "unknown route status");
assert(await routePage.getByRole("heading", { name: "This page does not exist" }).isVisible(), "unknown route design");
summary.push({ unknownRoute: 404, notFoundDesign: "pass" });
await routeContext.close();

await browser.close();
console.log(JSON.stringify({ origin, summary }, null, 2));
