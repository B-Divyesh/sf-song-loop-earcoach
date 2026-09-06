# Verification 5 — PASS: learn short song phrases by ear

**Verified:** 6 September 2026

**Live URL:** <https://song-loop-earcoach.sociobot.in/>

**Implementation reviewed:** `4b5b9a91891a2fb512a8546864ba9a81938f6900`

**Documentation reviewed:** `bb55b1e097b73025a2c2abd3222f7a27f6a1cddb`

**Verdict:** **PASS — 0 findings and 0 untested claims.**

The live product is byte-for-byte identical to the build from the implementation
candidate. The later documentation commit does not change the shipped product.
No product code was changed during this verification.

## First screen

Fresh 1440×1000 desktop and 390×844 phone browsers showed all three required
items before scrolling:

- **Job:** Learn short song phrases by ear.
- **Audience:** Self-taught instrumentalists who want to play songs from memory.
- **First action:** **Try it with sample data**. Its adjacent text says that it
  opens a filled practice loop and pitch comparison.

The first screen also shows the three short facts about local audio, offline
use, and free core practice. The title names the job in plain words.

## Demo and real data

The first-screen sample action opened `/demo` in one click. The first populated
view contained the named eight-second “Four-note guitar phrase,” waveform,
A/B loop, saved answer, 99% sample match, pitch shape, contour, next step, and
practice-queue entry. The persistent label read **Demo — sample data, nothing
is saved** and remained visible on desktop and phone.

Changing the B point and selecting **Reset demo** restored the original
eight-second sample. A separate live isolation test first added a real clip,
changed and reset the demo, then selected **Start for real**. The real clip was
unchanged and the sample clip was absent from real practice. This ran in fresh
desktop and phone contexts.

## Clean checkout checks

Node `v22.23.2` and npm `10.9.8` were used from the clean repository checkout.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 61 packages, 0 vulnerabilities |
| `npm test` | PASS — 9/9 Vitest tests |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 48/48 desktop and phone tests |
| Declared claim commands | PASS — 12/12 run separately |

The build emitted 35.74 KB JavaScript (12.91 KB gzip) and 17.56 KB CSS
(4.81 KB gzip). The initial JavaScript and CSS remain below the PWA budgets.

## Declared claims

Every entry in `.factory/claims.json` has exactly one matching
`@claim:<id>` test. Each declared command was run separately and passed.

| Claim id | Result | Observed proof |
| --- | --- | --- |
| `demo-isolation` | PASS | Demo reset and exit left a seeded real clip unchanged. |
| `offline-reload` | PASS | A fresh service-worker-controlled demo reloaded offline. |
| `no-account` | PASS | The clean demo worked with no login fields, cookies, or credentials. |
| `local-audio` | PASS | Clip playback and a recorded answer sent no cross-origin request; answer audio was not stored. |
| `no-tracking` | PASS | Demo load and reset used no ads, analytics, pixels, or remote font/script requests. |
| `clip-duration` | PASS | 0.8 s and 12.5 s were rejected; 5.0 s was accepted. |
| `recording-state` | PASS | Granted microphone use showed the recording label, local notice, and finish control. |
| `midi-read-only` | PASS | MIDI requested non-sysex input, received notes, and made no output call. |
| `pitch-feedback` | PASS | Known A4/B4 audio matched the same MIDI notes at 100%, 1¢ from center, with a next step. |
| `practice-persists` | PASS | Sample, result, and changed loop point survived reload. |
| `backup-audio` | PASS | Exported JSON contained audio bytes and restored the sample. |
| `free-studio-split` | PASS | Core controls worked without a license; the $19 one-time offer and production checkout target were present. |

Landing, legal, README, metadata, and UI copy were cross-checked against the
registry. No unlisted, false, incomplete, or untested public claim was found.

## Live product checks

The repository's app and PWA update tests were rerun against production in
fresh desktop and phone contexts: **24/24 passed**. An additional six live
checks passed for demo isolation, exact pitch feedback, and audio backup on
both viewports.

Normal, invalid, boundary, and recovery checks passed. A real five-second WAV
opened the workbench, saved its loop, accepted keyboard changes, produced MIDI
feedback, and survived reload. A text file, 0.8-second WAV, 12.5-second WAV,
malformed backup, and blocked microphone each produced a clear recovery
message. A valid file worked after invalid input, and malformed backup import
left the saved clip unchanged.

Keyboard order reached every visible control. The hidden file inputs remained
outside the Tab order, focus rings were visible, range arrows worked, and all
previously affected global and footer targets measured at least 44×44 CSS
pixels. At 200% text the demo had no horizontal overflow or lost controls.
Reduced-motion styles shortened transitions to 0.01 ms.

Axe found zero serious or critical issues on home, populated practice, demo,
privacy, terms, and not-found states on desktop and phone. The factory URL
check confirmed a title, `lang=en`, one h1, a main landmark, image alt text,
named buttons, and zero console or page errors.

Privacy and Terms opened directly with their own titles, one h1, shared
navigation, and shared footer. Browser back navigation restored the prior
page and saved state. All internal routes and assets returned 200. The public
Sociobot contact returned 200. An unknown route returned HTTP 404 with the
designed “This page does not exist” page and a route-specific title.

Fresh live request capture stayed on the product origin throughout the demo
flow. The optional checkout is the only observed external product action.

## Offline, update, payment, and performance

A fresh phone context installed the service worker, became controlled, went
offline, and reloaded `/demo` with its populated result. A controlled waiting
worker displayed **Fresh version ready** and activated only after **Update**.

The production checkout returned HTTP 303 to the hosted checkout, whose final
page returned 200. The visible offer identified Hookback Studio, $19, and a
one-time purchase. No purchase was performed, so post-payment entitlement is
not claimed as tested.

Live response checks found HSTS, CSP, `nosniff`, Referrer-Policy, and scoped
microphone/MIDI Permissions-Policy headers. Hashed JavaScript and CSS use a
one-year immutable cache. The service worker and manifest use `no-cache`, and
the manifest has the correct MIME type.

A clean live mobile Lighthouse run scored **100 Performance, 100
Accessibility, 100 Best Practices, and 100 SEO**. FCP was 0.9 s, LCP 1.1 s,
TBT 0 ms, CLS 0, and total transfer was 48 KiB. An earlier run wrote a valid
99/100/100/100 report before its browser tab crashed during final collection;
the successful repeat is the recorded result.

## Deployment identity

| Resource | Local and live SHA-256 |
| --- | --- |
| `/` | `0e7113ed06649e86ab78411a9d4e30482f6dc45bd89c7b2e65273781377ef181` |
| `/assets/index-BuWQCHok.js` | `e9631333c93edb8a186a9f7cf733b01db35fc992b5211cea5116277135c74c4d` |
| `/assets/index-D4Er5eME.css` | `9dc61e7bc0eb721b84efd5a434588a2737bbf2848643742fbef633f2fedc4659` |
| `/sw.js` | `77f278ed59b62bf5e643e3aaafae76f77eb1005cd93425aef5c5dfc28d0a6ece` |
| `/manifest.webmanifest` | `29e17a6332b15419784cf4721c7da3c53ab2c39ba8318cab3396a77b7a0c2fa9` |

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Update notice did not appear | Repaired — the live waiting-worker notice and activation passed. |
| Hashed assets were not immutable | Repaired — live JavaScript and CSS have one-year immutable caching. |
| CSP and Permissions-Policy were absent | Repaired — both are present on live responses. |
| Checkout used a dead pilot URL | Repaired — the production endpoint redirects to a working hosted checkout. |
| Hidden file inputs were keyboard stops | Repaired — all three have `tabindex=-1`; visible controls own the keyboard path. |
| The 5–12 second boundary was not enforced | Repaired — both outside values were rejected and the 5-second boundary passed. |
| Footer and global controls were below 44 px | Repaired — desktop and phone measurements passed. |
| A4/B4 pitch was about two octaves low | Repaired — live desktop and phone both scored 100% within 1¢. |
| No one-click isolated sample | Repaired — the populated `/demo`, reset, label, and real-data isolation passed live. |
| Claims and tagged tests were absent | Repaired — 12 registry entries map one-to-one to 12 passing commands. |
| Copy was metaphorical or incomplete | Repaired — the job, audience, action, facts, route headings, and audit use plain words. |
| Unknown routes returned home with HTTP 200 | Repaired — an unknown URL returns the designed page with HTTP 404. |
| Navigation, route metadata, and shared structure were incomplete | Repaired — home, demo, legal, and 404 metadata and shared structure passed live. |

## Scope and limits

This is a static local-first PWA. Backend tenant isolation, server database
restart persistence, health endpoints, and 429/Retry-After behavior do not
apply. Product data is held in separate browser IndexedDB databases for real
and demo use.

Pitch comparison is intentionally monophonic. Physical microphone and MIDI
hardware still depend on browser support and permission. These limits are
stated in the product and are not defects. The local pitch-comparison job does
not need a hosted AI feature, so there is no missed AI step.

## Evidence

- Command and claim logs: `/work/.evidence/verification-5/`
- Live screenshots: `/work/.evidence/verification-5/live/`
- Factory URL check: `/work/.evidence/verification-5/url-check/`
- Successful Lighthouse report: `/work/.evidence/verification-5/lighthouse-live-repeat.json`
- Deployment hashes: `/work/.evidence/verification-5/deployment-hashes.log`

**Final verdict: PASS — 0 findings and 0 untested claims.**
