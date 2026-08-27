import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type StaticConfig = {
  globalHeaders: Record<string, string>;
  routes: Array<{ route: string; headers: Record<string, string> }>;
  mimeTypes: Record<string, string>;
};

const config = JSON.parse(readFileSync(fileURLToPath(new URL("../public/staticwebapp.config.json", import.meta.url)), "utf8")) as StaticConfig;
const route = (path: string) => config.routes.find(item => item.route === path)?.headers;

describe("static release response policy", () => {
  it("gives fingerprinted assets an immutable browser cache lifetime", () => {
    expect(route("/assets/*")?.["Cache-Control"]).toBe("public, max-age=31536000, immutable");
  });

  it("keeps the service worker and manifest revalidatable and types the manifest", () => {
    expect(route("/sw.js")?.["Cache-Control"]).toBe("no-cache");
    expect(route("/manifest.webmanifest")?.["Cache-Control"]).toBe("no-cache");
    expect(config.mimeTypes[".webmanifest"]).toBe("application/manifest+json");
  });

  it("ships a restrictive policy while permitting the local audio and licensing flows", () => {
    const csp = config.globalHeaders["Content-Security-Policy"];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("media-src 'self' blob:");
    expect(csp).toContain("connect-src 'self' https://api.sociobot.in https://pilot-api.sociobot.in");
    expect(csp).toContain("object-src 'none'");
    expect(config.globalHeaders["Permissions-Policy"]).toContain("microphone=(self)");
  });
});
