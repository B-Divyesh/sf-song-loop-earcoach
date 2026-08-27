# Verification 3 — FAIL

**Date:** 2026-08-27  
**Candidate:** `b0f03a4fb41d5681ab8a0ba3e7d45c267e90963e`  
**Live URL:** <https://song-loop-earcoach.sociobot.in/>  
**Disposition:** **FAIL** — the repaired local-first PWA and deployment work,
but the mobile footer contains several interactive targets smaller than the
44×44 CSS-pixel minimum in the supplied non-negotiable accessibility/design
contract. This is a release acceptance failure, despite the otherwise passing
functional, PWA, privacy, and response-policy checks.

## Reproducibility and build gates

The supplied worktree was clean at the candidate SHA before verification.
Node was `v22.23.2`, npm `10.9.8`.

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

- Fresh `npm ci` completed with 0 reported vulnerabilities.
- `npm test` passed: **7/7** Vitest tests.
- `npm run build` passed (`tsc --noEmit && vite build`) and produced `dist/`.
  There is no separate lint script; the exact production build runs the
  repository's TypeScript check.
- `npm run test:e2e` passed: **16/16** Chromium desktop (1440×1000) and mobile
  (390×844) tests. (The terminal capture elapsed before its final line, but
  Playwright's `test-results/.last-run.json` records `status: "passed"` and no
  failed tests.)
- Production artifacts are within static-PWA transfer budgets: initial JS
  **30,938 B** (**11.42 KB gzip**), CSS **14,973 B** (**4.33 KB gzip**), and
  first-screen WebP **29,100 B**.
- Three local mobile Lighthouse runs emitted reports before this container's
  Chromium crashed in Lighthouse's final collection: Performance **88/90/100**,
  Accessibility **100**, Best Practices **100**, SEO **100**. All three had
  FCP 0.9–1.0 s, LCP 1.5–1.6 s, and CLS 0. The 88/90 runs reported anomalous
  450/410 ms TBT, while the subsequent 100 run reported 10 ms. The bundle and
  LCP budgets pass; the runner instability and score variance are recorded for
  follow-up rather than represented as a stable regression.

## Independent product exercise

I exercised the built app independently of the repository suite at desktop
and 390×844 mobile, using generated WAV fixtures and a standards-shaped
read-only MIDI input:

- A valid 5-second local WAV imported, exposed A/B loop controls, played
  (`audio.paused === false` and “Loop playing.”), stopped, and survived reload.
  Setting A to 4.8 s with B at 5.0 s correctly clamped A to 4.5 s, maintaining
  the required 0.5-second minimum loop.
- A text file produced the actionable audio-type error. Both 0.8-second and
  12.5-second WAVs produced “Choose a 5–12 second practice phrase…”, then a
  valid file recovered normally. A malformed JSON backup said “Nothing was
  changed.” Export produced a dated `hookback-backup-2026-08-27.json` download.
- Virtual MIDI input completed an answer, saved it, showed a comparison and
  “Try this next.” The application asks Web MIDI with `sysex: false` and has
  no output/write path. A denied microphone produced the clear browser-settings
  / MIDI recovery message; no actual microphone hardware claim is made.
- Empty and populated Axe scans had **zero serious or critical violations**.
  `verify-url.sh` on both the local production preview and live URL found a
  title, `lang=en`, one `h1`, a main landmark, no missing image alt text, and
  no console or page errors.
- At 390px there was no horizontal overflow, reduced-motion transition duration
  was `0.01ms`, and keyboard focus was visible. The three clipped file inputs
  are correctly absent from sequential focus (`tabindex="-1"`).

## PWA, privacy, and deployment identity

- A fresh live mobile context installed the worker, reloaded under worker
  control, went offline via `context.setOffline(true)`, and reloaded the app
  shell successfully. A controlled `sw.js?verification-update=3` registration
  showed “Fresh version ready”; choosing **Update** removed the waiting worker
  and reloaded under that new controller.
- Before an optional license action, browser request capture saw only
  `https://song-loop-earcoach.sociobot.in`; there were no analytics, CDN
  scripts/fonts, clip uploads, or third-party requests. The optional visible
  production checkout URL is
  `https://api.sociobot.in/api/v1/products/song-loop-earcoach/checkout`, which
  returned **HTTP 303** to hosted checkout.
- The live deployment exactly matches the built candidate:

| Resource | SHA-256 |
| --- | --- |
| `/` | `4bdf109271422c71b8c8eee35a0bd0912a584639fecd72f12fe1994d89500cd9` |
| `/assets/index-D8bmibvz.js` | `3e6eab750729664d8df52c862952f091b3343c680e850c5437eae64ed20e9658` |
| `/assets/index-6Ovkm7Qv.css` | `283bd433f1db8a557b852c55e66e1f73607ff51075d84b235cd79a37c22c3fd7` |
| `/sw.js` | `e5edacb9f60b4df535f460f44fa86a844c21f86b38399a3312c591d360733741` |
| `/manifest.webmanifest` | `21b6f4f7d8c1cdc1eb6afedcfda883ebd837dad7e76b5e4f83c3c4181571461b` |

- Live responses are HTTPS with HSTS, `nosniff`, Referrer-Policy,
  self-restricted CSP, and microphone/MIDI Permissions-Policy. Hashed JS/CSS
  are `public, max-age=31536000, immutable`; `/sw.js` and the manifest are
  `no-cache`; the manifest is `application/manifest+json`.

## Defect

### Medium — mobile footer touch targets miss the 44×44 minimum

At both desktop and the requested 390px viewport, several visible interactive
footer elements have a physical hit rectangle below 44px high. Measured values
from the live-identical production build:

| Element | Measured CSS size |
| --- | --- |
| Hookback home link | 129×38 |
| Privacy link | 50×24 |
| Terms link | 41×24 |
| Export my data button | 114×24 |
| Import backup button | 108×24 |

The `Skip to practice` link is also 157×43. These include legal navigation
and the user-data export/import controls. They are keyboard-operable and their
focus outlines are visible, but are undersized for touch, contrary to the
attached accessibility and design-principles requirement that touch/click
targets be at least 44×44 CSS px. Add padding/minimum block size while
preserving spacing, then rerun mobile measurement and accessibility checks.

## Scope notes

No product code was modified during verification. The earlier billing,
invisible-file-focus, duration-policy, update-toast, cache, CSP, and
Permissions-Policy defects are verified repaired in this candidate. The
Lighthouse browser process crashed after writing each report in this container;
the emitted reports were retained and their raw values are above.
