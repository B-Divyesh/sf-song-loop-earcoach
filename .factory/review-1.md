# Review 1 — FAIL: learn short song phrases by ear

**Review date:** 2026-09-06  
**Live URL:** <https://song-loop-earcoach.sociobot.in/>  
**Implementation reviewed:** `7e8ee7ebce00feb66732fefdbba47640d41d058b`  
**Documentation SHA before this report:** `f1ca8592aef8b6166f821b6dec15d25797dc1176`  
**Verdict:** **FAIL — 6 findings and 11 untested public claims.**

Production is byte-for-byte identical to the build from the current checkout.
Commits after `7e8ee7e` changed reports only, so `7e8ee7e` is the implementation
candidate and `f1ca859` is the documentation candidate.

## What the first screen says

- **Job:** loop a short song phrase, answer from memory, and compare its pitch
  shape.
- **Audience:** not stated before scrolling. The researched audience is
  self-taught instrumentalists, but the first-screen sentence does not name
  them.
- **First action:** **Add a song clip**. There is no **Try it with sample data**
  action.

The visible h1 is “Catch the hook before it gets away.” It is a metaphor rather
than a title naming the job.

## Findings

### R1-01 — High — clean audio is assigned the wrong pitch, making MIDI feedback false

I imported a five-second PCM WAV containing 1.5 seconds of A4 at 440 Hz followed
by 3.5 seconds of B4 at 493.88 Hz. The production extraction path stored 61
pitch samples with a minimum of MIDI **41.14** and median/maximum **47.01**.
The expected pitches are MIDI **69** and **71**. A read-only MIDI answer using
the same notes produced a **37%** match, **53%** contour score, and the advice:
“Your shape matches, but your center sits about **2399 cents high**.”

This breaks the core compare-and-hint job for MIDI users and makes the public
pitch comparison claim false for a clean, deterministic input. The likely
cause is that `autoCorrelate` chooses a later highly correlated period multiple
inside the production 1,024-sample frame. The passing unit test uses a
4,096-sample frame, while no test exercises `extractPitchTrack` on a decoded
clip and compares it with known MIDI notes.

### R1-02 — High — the required one-click sample sandbox does not exist

Neither the desktop nor phone first screen has **Try it with sample data**.
Fresh visits to both `/?demo=1` and `/demo` return the ordinary empty product.
They have no seeded clip, populated comparison, persistent “Demo — sample data,
nothing is saved” label, **Reset demo**, or **Start for real** control. There is
no separate demo storage namespace to inspect and no `.factory/demo.md`.

The required sample journey, reset behavior, and proof that demo actions never
touch real data are therefore unavailable. For safe functional testing, I used
a synthetic clip only in new disposable browser contexts.

### R1-03 — High — every public claim lacks its required claim test

`.factory/claims.json` is absent. Consequently there are no declared
`@claim:<id>` commands to run, and none of the public promises has the required
one-command sandbox proof. Existing unit and browser tests are useful but are
untagged, do not map one-to-one to public claims, and do not use a demo entry
point. Eleven claim groups remain untested by the claims contract; the pitch
feedback group also fails the independent check in R1-01.

| Public claim group | Where it appears | Independent observation only |
| --- | --- | --- |
| Works offline after the first visit | metadata, README, terms | Offline reload passed |
| Works without an account | privacy | No account gate observed |
| Clips and recordings stay local and are not uploaded | home, README, privacy | Import/MIDI journey requested only the product origin |
| No ads, behavioral analytics, tracking pixels, or third-party fonts/scripts | privacy | Initial and populated request capture was same-origin |
| Only 5–12 second clips are accepted | home, README | 0.8 s and 12.5 s were rejected; 5 s recovered |
| Microphone recording has a visible local state | home, README | Denied-permission recovery passed; no declared claim test |
| Web MIDI is read-only | home, README | Browser request used `sysex:false`, `software:false` |
| Feedback compares pitch/contour and gives a useful next hint | home, README, terms | **Failed** for known A4/B4 input; see R1-01 |
| Queue and history survive restarts | README | Reload persistence passed; restart claim has no declared test |
| JSON export/import includes selected audio | home, README, privacy | Export produced a valid 108,192-byte backup with one clip |
| Free core and $19 one-time Studio feature split | home, README, terms | Core worked without a license; checkout showed Hookback Studio at $19 once |

**Untested claim count: 11.** “Untested” here means there is no required
declared, tagged claim command, even where this review made a manual observation.

### R1-04 — Medium — first-screen and legal copy do not meet the plain-words contract

The home h1, “Catch the hook before it gets away,” is metaphorical and does not
name the job. The adjacent sentence does not name the audience. The screen does
not present the required three short privacy/offline/price facts, and the
primary action does not say what appears after selection. Other headings and
labels continue the same brand-lore pattern: “Hear it. Hold it. Hook it back,”
“Hooks to bring back,” “See the long arc,” and “A kinder drill.” The Privacy
and Terms h1 text (“Your sound stays yours” and “Practice with respect”) also
does not name each page's job. `.factory/copy-audit.md` is absent.

### R1-05 — Medium — unknown URLs return the product with HTTP 200 instead of a designed 404

`/not-a-real-route-review-1` returned HTTP **200**, the normal home title and
h1, and HTML identical to `/`. There is no `404.html` or Static Web Apps 404
response override. This is not the expected deliberate 404; it is a missing
404 route and gives visitors no explanation or way back from an unknown URL.

### R1-06 — Medium — required site structure and metadata are incomplete

The home header has no navigation to Demo or Privacy. The home footer lacks
“Built by Param Factory” and a version/build id. Privacy and Terms use a
different reduced header/footer and also omit the standard product line,
complete legal links, factory credit, and build id. The home document has no
canonical URL, Open Graph metadata, Twitter card metadata, or apple-touch icon.
The sitemap lists only `/`, `/privacy/`, and `/terms/`; it has no demo or 404
route. The product-specific artwork and dark visual system remain distinctive,
but the mandatory shared information skeleton is incomplete.

## Clean-checkout commands

A new clone at `f1ca8592aef8b6166f821b6dec15d25797dc1176` used Node
`v22.23.2` and npm `10.9.8`.

```text
npm ci             PASS — 61 packages, 0 vulnerabilities
npm test           PASS — 7/7 Vitest tests
npm run build      PASS — dist/ produced
npm run test:e2e   PASS — 18/18 Playwright checks
```

No claim commands could be run because `.factory/claims.json` is missing.
The clean checkout remained unchanged after the commands.

Build sizes are within budget: JavaScript 30,938 bytes (11.42 KB gzip), CSS
15,240 bytes (4.35 KB gzip), and the first-screen WebP 29,100 bytes. Live mobile
Lighthouse scored Performance **99**, Accessibility **100**, Best Practices
**100**, and SEO **100**; FCP was 1.0 s, LCP 1.2 s, TBT 90 ms, CLS 0, and total
transfer 67 KiB.

## Live browser and accessibility evidence

Fresh Chromium contexts at 1440×1000 and 390×844 found one h1, one main,
`lang=en`, no horizontal overflow, no console/page errors, and only same-origin
requests before optional billing. The factory `verify-url.sh` passed. Axe on
the empty home, populated product, Privacy, Terms, and the fallback URL found
zero serious or critical violations.

Keyboard order was complete, all ten sequential controls were visible with a
3 px focus outline, and the formerly undersized global/footer targets measured
at least 44×44 CSS pixels on desktop and phone. ArrowRight changed the focused
A-loop range from 0 to 0.05. An effective 200% desktop reflow check had zero
horizontal overflow. Reduced motion computed to 0.01 ms.

Normal/recovery checks passed apart from R1-01: invalid text input, 0.8-second
and 12.5-second clips, denied microphone permission, and malformed backup all
gave actionable messages; the malformed backup left the saved queue unchanged.
A five-second clip populated the workbench, saved a comparison and hint, and
persisted across reload. The export download contained the selected audio.

The manifest, icons, legal pages, robots file, sitemap, and service worker all
return 200. Privacy's Sociobot contact link returns 200 and exposes a contact
email. The Studio endpoint returns 303 to hosted checkout, where the product
and one-time $19 price are present. No purchase was attempted.

## Offline, update, headers, and deployment identity

A new phone context became service-worker controlled, reloaded successfully
while offline, then installed a changed worker URL. “Fresh version ready”
appeared; selecting **Update** activated the new controller. Live hashed assets
use one-year immutable caching; the worker and manifest use `no-cache`; the
manifest MIME type is correct. HSTS, CSP, Referrer-Policy, `nosniff`, and scoped
microphone/MIDI Permissions-Policy are present.

| Resource | Live and local SHA-256 |
| --- | --- |
| `/` / `dist/index.html` | `c9a720fbdd08a428ad1ab34ab3b28cb814963420d149294c525636c0b2f8efa2` |
| `/assets/index-CECmo6YL.js` | `3e6eab750729664d8df52c862952f091b3343c680e850c5437eae64ed20e9658` |
| `/assets/index-CYHkUulu.css` | `877396695469bbfa2e1a1ae3e21f09acd8d8c99430849870f35e7ff7c7fa9521` |
| `/sw.js` | `617520ef63b3a75a1324e52f096d16f1d9c0d24b17681204459f87013690fc44` |
| `/manifest.webmanifest` | `b080e61f08958479e340d1d58744e2dfa09ed00742a9cd532d73ed0c647037e8` |

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Update notice did not appear | **Repaired** — live waiting-worker notice and activation passed |
| Hashed assets were not immutable | **Repaired** — live one-year immutable headers confirmed |
| CSP and Permissions-Policy absent | **Repaired** — both live headers confirmed |
| Checkout used a dead pilot URL | **Repaired** — production endpoint returned 303; checkout showed $19 once |
| Hidden file inputs were keyboard stops | **Repaired** — all three are outside Tab order; visible triggers work |
| 5–12 second boundary was not enforced | **Repaired** — both boundaries rejected and valid recovery passed |
| Footer/global controls were below 44 px | **Repaired** — every previously named target measured at least 44×44 |

The 2026-08-28 PASS did not evaluate the later mandatory demo, claims,
plain-words, and complete site-structure contracts, and its populated test did
not validate pitch accuracy. Those omissions explain the changed verdict; no
later implementation has been deployed.

## Scope notes

This is a static PWA, so backend tenant isolation, database restart persistence,
health endpoints, and 429/Retry-After checks do not apply. The product does not
need an AI feature for its local signal-processing job; no missed AI leverage
finding is warranted. No product code, infrastructure, billing, DNS, user data,
or other product was modified.
