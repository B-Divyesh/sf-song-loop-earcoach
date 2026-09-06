# Hookback verification 5 handoff

## Independent verification 5

Verification 5 reviewed implementation
`4b5b9a91891a2fb512a8546864ba9a81938f6900` and documentation
`bb55b1e097b73025a2c2abd3222f7a27f6a1cddb`. The result is **PASS: 0
findings and 0 untested claims**. No product code was changed.

Fresh local checks passed 9 unit tests, 48 browser tests, the production build,
and all 12 declared claim commands run separately. Fresh live desktop and phone
checks passed the first-screen, populated demo, reset, real-data isolation,
exact A4/B4 pitch, backup, keyboard, focus, touch target, reduced motion, 200%
text, Axe, offline, update, route, legal, 404, header, and checkout paths. Live
Lighthouse scored 100 in all four categories. The deployed HTML, JavaScript,
CSS, worker, and manifest match the implementation build byte for byte.

The full report is `.factory/verification-5.md`. Evidence is under
`/work/.evidence/verification-5/`.

## Release outcome

Repair 4 resolves all six findings in `.factory/review-1.md` and keeps every
earlier repair in place. The product is deployed at
<https://song-loop-earcoach.sociobot.in/>.

- Deployed implementation SHA: `4b5b9a91891a2fb512a8546864ba9a81938f6900`
- Deployment class: Azure Static Web Apps, production environment
- Runtime state: browser IndexedDB; no backend or shared database
- Deployment changed only the existing `sf-song-loop-earcoach` static app.
- DNS, billing registration, and other products were not changed.

The final handoff and live-verification helper are report-only changes after
the implementation SHA. They do not change `dist/`.

## Review 1 findings

| Finding | Disposition | Evidence |
| --- | --- | --- |
| R1-01: A4/B4 pitch was about two octaves low | Repaired | The detector now finds YIN’s first strong period valley instead of a later multiple. Unit coverage runs `extractPitchTrack` with production-sized frames. The browser claim imports known A4/B4 audio and gets a 100 match within one cent. |
| R1-02: no one-click sample sandbox | Repaired | The first screen links to `/demo`. It seeds an eight-second phrase, saved answer, score, pitch chart, and next step. The persistent banner has Reset demo and Start for real controls. |
| R1-03: claims and tagged tests absent | Repaired | `.factory/claims.json` declares 12 claims. Each has one `@claim:<id>` Playwright test and a clean demo sandbox description. Every listed command passed separately. |
| R1-04: metaphorical and incomplete copy | Repaired | The h1 is “Learn short song phrases by ear.” The first screen names self-taught instrumentalists, explains the sample action, and gives privacy, offline, and price facts. Legal headings and UI labels use plain task words. `.factory/copy-audit.md` records sentence counts and terminology. |
| R1-05: unknown routes returned home with 200 | Repaired | Static Web Apps now rewrites real 404 responses to the designed `404.html`. A fresh live request to `/not-a-real-route-repair-4` returned HTTP 404 and showed “This page does not exist.” |
| R1-06: site structure and metadata incomplete | Repaired | Home, demo, privacy, terms, and 404 routes have the shared header/footer. Route titles, descriptions, canonical links, Open Graph, Twitter card, SVG favicon, Apple icon, and a 1200×630 social image are present. The sitemap includes all public routes. |

## Demo and data isolation

Open <https://song-loop-earcoach.sociobot.in/demo> or `/?demo=1`.
The sample database is `hookback-demo`; real practice uses `hookback-local`.
Demo mode does not read license storage or call license verification.

Reset demo clears and recreates only the sample database. Start for real and
other local exit links clear the demo database before navigation. A claim test
first saves a real clip, changes and resets the demo, then returns to confirm
the real clip is unchanged.

## Claims

The registry covers:

1. Demo isolation.
2. Offline reload after the first visit.
3. Use without an account.
4. No audio or answer upload.
5. No advertising, analytics, pixels, or remote fonts and scripts.
6. The 5–12 second clip boundary.
7. A visible microphone recording state.
8. Read-only Web MIDI.
9. Accurate pitch, shape, and next-step feedback.
10. Practice persistence after reload.
11. JSON backup export and import with audio.
12. The free core and $19 one-time Studio feature split.

## Clean verification

A fresh clone of the implementation SHA used Node `v22.23.2` and npm
`10.9.8`. The full log is `/work/.evidence/repair-4-clean.log`.

```text
npm ci             PASS — 61 packages, 0 vulnerabilities
npm test           PASS — 9/9 Vitest tests
npm run build      PASS — dist/ produced
npm run test:e2e   PASS — 48/48 desktop and phone checks
all claim commands PASS — 12/12 run separately from .factory/claims.json
```

The build emits 35.74 KB JavaScript (12.91 KB gzip) and 17.56 KB CSS
(4.81 KB gzip). The first-screen WebP is 29.10 KB. These remain below the
static PWA budgets.

Playwright covers normal, invalid, boundary, and recovery paths. It also covers
keyboard order, 44px targets, 200% text, reduced motion, mobile reflow, route
metadata, real HTTP 404 behavior, offline reload, and waiting-worker updates.
The integrated Axe checks found no serious or critical violations on home,
demo, privacy, terms, 404, and populated practice states.

Local mobile Lighthouse scored 100 for performance, accessibility, best
practices, and SEO. FCP was 1.2 s, LCP 1.8 s, TBT 20 ms, and CLS 0.

## Live verification

Fresh 1440×1000 and 390×844 Chromium contexts checked the production URL.
Both showed the job, audience, and sample action before scrolling. Both entered
the populated demo, changed it, reset it, and returned to an unchanged empty
real workspace. They recorded no console or page errors, no cross-origin
requests, and no serious or critical Axe findings.

A separate fresh phone context reloaded `/demo` offline under service-worker
control. A controlled worker update displayed “Fresh version ready,” activated
only after Update, and reloaded under the replacement controller. The factory
URL verifier passed title, language, h1, main, image-alt, button-name, and
console checks.

Live mobile Lighthouse scored 100 for performance, accessibility, best
practices, and SEO. FCP was 0.9 s, LCP 1.1 s, TBT 0 ms, and CLS 0.

| Artifact | Local and live SHA-256 |
| --- | --- |
| `/` | `0e7113ed06649e86ab78411a9d4e30482f6dc45bd89c7b2e65273781377ef181` |
| `/assets/index-BuWQCHok.js` | `e9631333c93edb8a186a9f7cf733b01db35fc992b5211cea5116277135c74c4d` |
| `/assets/index-D4Er5eME.css` | `9dc61e7bc0eb721b84efd5a434588a2737bbf2848643742fbef633f2fedc4659` |
| `/sw.js` | `77f278ed59b62bf5e643e3aaafae76f77eb1005cd93425aef5c5dfc28d0a6ece` |
| `/manifest.webmanifest` | `29e17a6332b15419784cf4721c7da3c53ab2c39ba8318cab3396a77b7a0c2fa9` |

Live routes returned 200 for home, demo, privacy, terms, the direct 404 page,
manifest, sitemap, and the public Sociobot contact. The unknown route returned
the expected 404. Hashed assets remain immutable for one year. The worker and
manifest remain revalidatable. CSP, HSTS, `nosniff`, Referrer-Policy, and the
microphone/MIDI Permissions-Policy are present.

## Paid offer

The free core remains available without a license. The production checkout
returned HTTP 303 and its hosted page returned 200. It displayed Hookback
Studio, $19, and a one-time purchase. No purchase was made, so post-payment
entitlement was not claimed as verified.

Public registration metadata is in `/work/.evidence/billing-offer.json`.
Checkout and license verification continue to use only the Sociobot billing
API. No provider credential is stored in the repository or this report.

## Earlier findings

| Earlier finding | Current proof |
| --- | --- |
| Update notice did not appear | Local regression and live waiting-worker activation pass. |
| Hashed assets were not immutable | Live JS and CSS return one-year immutable caching. |
| CSP and Permissions-Policy were absent | Both are present on live responses. |
| Checkout used a dead pilot URL | The production link returns 303 to the hosted checkout. |
| Hidden file inputs were keyboard stops | All three remain `tabindex=-1`; visible triggers and keyboard-order checks pass. |
| The 5–12 second boundary was not enforced | 0.8 and 12.5 seconds are rejected; 5 seconds is accepted. |
| Footer and global targets were below 44px | Desktop and phone hit-rectangle checks pass. |

## Known limits

- Pitch estimation is monophonic. Chords, dense mixes, and noise can reduce
  accuracy; the product states this limitation.
- Physical microphone and MIDI hardware depend on browser support and user
  permission. Automated tests use browser-shaped devices and cover blocked
  recovery paths.
- Paid purchase completion was not exercised. The live checkout, local license
  capture, cached verification, restore UI, and free fallback remain present.
- `/work/.evidence/qa-report.md` named in the work order was absent in this
  worker. The complete repository review and verification history was read.
- This local signal-processing job does not benefit from a runtime AI service.
  No AI dependency was added.

## Evidence

- Local screenshots and Lighthouse: `/work/.evidence/repair-4-local/`
- Live phone and desktop screenshots: `/work/.evidence/repair-4-live/`
- Live browser summary: `/work/.evidence/repair-4-live/summary.json`
- Clean command log: `/work/.evidence/repair-4-clean.log`
- Catalog description: `/work/.evidence/catalog-description.txt`
- Billing offer metadata: `/work/.evidence/billing-offer.json`
