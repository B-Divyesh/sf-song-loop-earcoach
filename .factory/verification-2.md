# Verification 2 — FAIL

**Date:** 2026-08-27  
**Candidate:** `21ae3b7a394a5e9866ef7c8d46fcb8c53231c345`  
**Live URL:** <https://song-loop-earcoach.sociobot.in/>  
**Disposition:** **FAIL** — the core free PWA is sound and the live site is the
candidate, but an advertised paid checkout is broken in production and
keyboard navigation includes invisible focus stops.

## Reproducibility and build gates

The supplied worktree was clean at the candidate SHA before verification.
Node was v22.23.2. I ran:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

- `npm ci` completed with 0 reported vulnerabilities.
- `npm test` passed: 7/7 Vitest tests.
- `npm run build` passed: `tsc --noEmit && vite build`; `dist/` was produced.
  There is no separate lint script; type checking is part of the production
  build.
- The first E2E attempt could not launch because the lockfile resolves
  Playwright 1.62.1 while only another browser revision was preinstalled.
  After the prescribed `npx playwright install chromium`, `npm run test:e2e`
  passed: 6/6 Playwright tests.
- Production build budget: JS 30,787 bytes (11,330 bytes gzip), CSS 14,973
  bytes (4,326 bytes gzip), largest first-screen WebP 29,100 bytes. These are
  within the 200 KB JS, 50 KB CSS, and 300 KB image limits.
- Independent local mobile Lighthouse emitted Performance **99**,
  Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.7 s, LCP
  1.7 s, TBT 0 ms, CLS 0. Chrome crashed during Lighthouse's final
  screenshot/BFCache collection after it had emitted the report, so the score
  is recorded with that runner caveat rather than hiding the non-zero CLI exit.

## Functional and PWA exercise

On the production build, I exercised 1440×1000 desktop and 390×844 mobile.

- A valid 5-second WAV imported, showed the A/B workbench, clamped an A value
  of 4.8 to 4.5 when B was 5.0 (the required 0.5-second minimum), and persisted
  through reload. The repository's independent browser test also completed a
  virtual read-only MIDI answer and showed score, contour, and next hint.
- Invalid text input showed the audio-type recovery message. A 0.5-second WAV
  and a mislabeled/undecodable WAV both showed a recovery error; a subsequent
  valid WAV successfully imported. Fresh manual checks also produced actionable
  blocked-microphone and blocked-MIDI alternatives and rejected malformed JSON
  backup with “Nothing was changed.”
- A fresh live mobile context installed the service worker, reloaded under
  control, went offline with `context.setOffline(true)`, and reloaded the app
  shell successfully. A controlled live `sw.js?qa-update=20260827` update
  produced the visible update notice; clicking **Update** reloaded under the
  new controller. No console or page errors occurred.
- At both viewports there was one `h1`, one `main`, `lang=en`, no horizontal
  overflow, and reduced motion computed to 0.01 ms. Axe (the repository's
  Playwright integration) reported zero serious/critical findings on empty and
  populated states. The manual keyboard check found the defect below.

## Privacy, response policy, and deployment identity

Fresh live-page request capture made requests only to
`https://song-loop-earcoach.sociobot.in`; no analytics, remote fonts, CDN
scripts, clip uploads, or third-party requests were observed before an
optional license action. The only code-level external request is the optional
license/checkout endpoint. Local audio is stored in IndexedDB; normal
microphone capture is processed in memory.

Live responses have HTTPS/HSTS, `nosniff`, `Referrer-Policy`, a self-restricted
CSP, and an explicit microphone/MIDI Permissions-Policy. The live hashed JS
and CSS use `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` and
the manifest use `no-cache`; the manifest is
`application/manifest+json`.

Live SHA-256 values exactly matched this candidate's built `dist/`:

| Resource | SHA-256 |
| --- | --- |
| `/` | `838b3dd34d839543c0cbe7321d2a6dbee14f288ad68af2ec17458c161b1a4f9a` |
| `/assets/index-DphH74_g.js` | `8ae8d20633be7d9a703a1664d3c3cbaed91b6ec835f61ec4b7cbc85fe8456348` |
| `/assets/index-6Ovkm7Qv.css` | `283bd433f1db8a557b852c55e66e1f73607ff51075d84b235cd79a37c22c3fd7` |
| `/sw.js` | `725db575452d8d8ead531e362906c899895e969365ed0dc2f132bbe454357c10` |
| `/manifest.webmanifest` | `9f72b621949a0e17248055ec4ddd2f0d8f804ecae457b3c6c580f59ea1899450` |

## Defects

### Medium — the live Studio checkout is a dead pilot URL

The production page's **Get Studio** link is
`https://pilot-api.sociobot.in/api/v1/products/song-loop-earcoach/checkout`.
That exact endpoint returns **HTTP 404** (verified without following a
redirect). The candidate bundle contains the same pilot base URL. This makes
the advertised $19 one-time purchase impossible and does not meet the paid
unlock contract for a live product. Configure the production build with
`VITE_BILLING_BASE=https://api.sociobot.in/api/v1` after registering the
production product, then verify checkout and restore/verification end to end.

### Medium — keyboard Tab reaches invisible file inputs

On the live 390px page, the fourth Tab stop is the 1×1 clipped
`#clip-file` input, and the sixth is the clipped `#queue-file` input (the
footer's import input has the same pattern). Their computed focus rule is a
3px outline, but it is clipped/off-screen and therefore not visibly perceivable.
This violates the required visible-focus keyboard path even though axe does
not classify it as serious/critical. Remove these inputs from the sequential
tab order and keep their labelled trigger buttons as the keyboard entry point,
or use an accessible visible file-input pattern.

### Low — the advertised 5–12 second phrase guidance is not enforced

The product says “We recommend a clear 5–12 second phrase,” but a generated
0.8-second WAV imported normally and created a 0.8-second loop. A 0.5-second
file is rejected, so the actual lower bound is 0.7 seconds. This is a weak
practice unit for the stated brief and makes the boundary/error policy
inconsistent. Enforce or clearly explain the supported duration range.

## Required release actions

1. Register/configure the production billing product and rebuild/redeploy with
   the production Sociobot API base; prove that the visible checkout link no
   longer returns 404.
2. Fix the invisible file-input tab stops and add a keyboard regression test
   that asserts every sequential focus target is visibly perceivable.
3. Decide and test the intended clip-duration policy, including the 5-second
   lower boundary described in the product brief.
