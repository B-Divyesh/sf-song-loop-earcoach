const SLUG = "song-loop-earcoach";
const BASE = import.meta.env.VITE_BILLING_BASE || "https://pilot-api.sociobot.in/api/v1";
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;
const DAY = 86_400_000;

type CachedVerdict = { valid: boolean; checkedAt: number; reason?: string };

export function checkoutUrl(): string {
  return `${BASE}/products/${SLUG}/checkout`;
}

export function readLicense(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function removeLicense(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

function cachedVerdict(): CachedVerdict | null {
  try {
    return JSON.parse(localStorage.getItem(VERDICT_KEY) || "null") as CachedVerdict | null;
  } catch {
    return null;
  }
}

export function optimisticallyUnlocked(): boolean {
  return Boolean(readLicense() && cachedVerdict()?.valid);
}

export async function captureAndVerifyLicense(force = false): Promise<{ valid: boolean; reason?: string; offline?: boolean }> {
  const query = new URLSearchParams(location.search);
  const returned = query.get("license");
  if (returned) {
    saveLicense(returned);
    query.delete("license");
    const next = `${location.pathname}${query.size ? `?${query}` : ""}${location.hash}`;
    history.replaceState(null, "", next);
    force = true;
  }
  const token = readLicense();
  if (!token) return { valid: false, reason: "missing" };
  const cached = cachedVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached;
  try {
    const response = await fetch(`${BASE}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error(`Verification returned ${response.status}`);
    const result = (await response.json()) as { valid: boolean; reason?: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, reason: result.reason, checkedAt: Date.now() }));
    return result;
  } catch {
    return { valid: Boolean(cached?.valid), reason: cached?.reason, offline: true };
  }
}
