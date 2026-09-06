# Review 3 — PASS: learn short song phrases by ear

**Review date:** 6 September 2026

**Live URL:** <https://song-loop-earcoach.sociobot.in/>

**Implementation reviewed:** `4b5b9a91891a2fb512a8546864ba9a81938f6900`

**Documentation SHA reviewed:** `2e781879bbfa7cc85ced5686f34be94a0b013dc1`
**Verdict:** **PASS — 0 findings and 0 untested claims.**

The live HTML, JavaScript, CSS, service worker, and manifest are byte-for-byte
identical to a clean build of the implementation candidate. Later commits
change tests and reports, not the shipped product image.

## What appears before scrolling

Fresh 1440×1000 desktop and 390×844 phone browsers showed:

- **Job:** Learn short song phrases by ear.
- **Audience:** self-taught instrumentalists who want to play songs from
  memory, one short phrase at a time.
- **First action:** **Try it with sample data**. The adjacent line says it opens
  a filled practice loop and pitch comparison.

The page title is **Hookback — learn short song phrases by ear**. The opening
copy is direct and contains no metaphor or mood heading. The same opening
section gives short facts about local audio, offline use, and the free core.

## Clean checkout and declared commands

A fresh clone of `main` resolved to documentation SHA `2e78187`. It used Node
`v22.23.2`, npm `10.9.8`, and repository-pinned Playwright `1.58.2`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 61 packages, 0 vulnerabilities |
| `npm test` | PASS — 9/9 Vitest tests |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 48/48 desktop and phone tests |
| Every command in `.factory/claims.json` | PASS — 12/12 run separately |

The build emits 35.74 KB JavaScript (12.91 KB gzip), 17.56 KB CSS (4.81 KB
gzip), and a 29.10 KB first-screen WebP. These are below the PWA budgets.

## Public claims

The registry has 12 unique IDs and each ID occurs in exactly one tagged test.
I inspected the assertions and ran each registry command separately.

| Claim | Result | Evidence checked |
| --- | --- | --- |
| `demo-isolation` | PASS | A seeded real clip remained unchanged after two demo entries, edits, resets, and exits. |
| `offline-reload` | PASS | A fresh controlled demo reloaded offline with the sample result. |
| `no-account` | PASS | A clean context opened working sample practice with no login fields, cookies, or stored credentials. |
| `local-audio` | PASS | Playback and a microphone answer made no remote request; recorded audio was not stored. |
| `no-tracking` | PASS | Demo load and reset used no ads, analytics, pixels, or remote fonts or scripts. |
| `clip-duration` | PASS | 0.8 and 12.5 seconds were rejected; exact 5.000 and 12.000 seconds were accepted. |
| `recording-state` | PASS | Granted microphone use showed **Listening…**, the local-audio notice, and **Finish answer**. |
| `midi-read-only` | PASS | MIDI requested non-sysex input, received notes, and never called output. |
| `pitch-feedback` | PASS | Known A4/B4 audio matched the same MIDI notes at 100%, one cent from center, with a next step. |
| `practice-persists` | PASS | The sample, result, and changed loop point remained after reload. |
| `backup-audio` | PASS | Exported JSON contained the selected audio bytes and restored the sample. |
| `free-studio-split` | PASS | Free playback and export worked; a fixture license showed progress and saved a named pack. |

The Studio and exact-12-second tests now exercise the outcomes omitted in
Review 2. No false, incomplete, unlisted, or untested capability claim was
found on Home, Demo, Privacy, Terms, or README.

## Live desktop and phone exercise

Both fresh browsers entered the sample in one click. The populated view showed
the realistic eight-second **Four-note guitar phrase**, a 99% match, pitch
shape, and one next step. The persistent **Demo — sample data, nothing is
saved** label remained after reload. Changing B to 6.5 seconds survived reload;
**Reset demo** restored the original eight-second sample.

Separate real storage was seeded with a five-second clip and a 2.5-second loop
in each viewport. Demo changes and reset did not change that clip or loop.
Back and forward navigation also preserved the real/demo boundary. Demo-only
content never appeared in real practice.

Normal, boundary, invalid, and recovery paths passed:

- exact 5- and 12-second WAV files loaded; 0.8- and 12.5-second files were rejected;
- a text file gave the audio-type recovery message, then valid input worked;
- matching read-only MIDI produced a 100% score, one-cent pitch center, and a next step;
- granted microphone use showed the recording state and stop action;
- denied microphone access gave browser-setting and MIDI guidance;
- malformed backup JSON said **Nothing was changed** and preserved the queue;
- live JSON export contained audio and successfully restored the sample;
- a fake invalid Studio token left the free practice path available;
- destructive clip, license, and replacement-import paths name their effect in confirmation text.

The production checkout endpoint redirected to the hosted checkout, which
showed Hookback Studio and the 19.00 price. No payment was attempted.

## Accessibility, privacy, routes, and offline behavior

The factory URL check passed with `lang=en`, one h1, one main landmark,
complete alt text, named buttons, and no console errors. Fresh Axe scans of
Home, populated practice, Demo, Privacy, Terms, and the missing-route page had
zero serious or critical violations. Hookback deliberately uses one documented
dark treatment, so there is no second theme to inspect.

Keyboard order reached every visible control with the designed 3 px focus
outline. Hidden file inputs remained outside sequential focus, range keys
worked, and there was no trap. Phone targets checked at 390 px met 44×44 CSS
pixels. At 200% text, the demo retained its practice controls without
horizontal overflow. Reduced-motion transitions computed to 0.01 ms. Canvas
charts have accessible names and adjacent text alternatives.

Complete live practice and demo request capture used only the product origin.
There were no analytics, tracking, remote font, remote script, or audio-upload
requests. The only external requests exercised separately were the visible
Sociobot privacy link, checkout, and an explicit invalid-license check.

A fresh phone context became service-worker controlled and reloaded the
populated demo offline. Registering a changed worker showed **Fresh version
ready**; only choosing **Update** activated it. The manifest has standalone
display, a versioned start URL, 192/512 icons, and maskable purpose.

Home, Demo, Privacy, Terms, the direct 404 page, robots, sitemap, manifest,
icons, and every discovered link worked. Route titles, canonical links, one
h1, and main landmarks were present. An unknown URL returned the designed
**This page does not exist** page with HTTP 404. That deliberate 404 is
expected and is not a defect.

The site sends HSTS, CSP, `nosniff`, Referrer-Policy, and scoped microphone/MIDI
Permissions-Policy headers. Hashed JavaScript and CSS use one-year immutable
caching. The service worker and manifest use `no-cache`; the manifest MIME
type is `application/manifest+json`.

## Performance and deployment identity

Fresh live mobile Lighthouse scored Performance **100**, Accessibility **100**,
Best Practices **100**, and SEO **100**. FCP was 0.9 s, LCP 1.1 s, TBT 0 ms,
CLS 0, and transferred content was 50 KiB.

| Resource | Clean candidate and live SHA-256 |
| --- | --- |
| `/` | `0e7113ed06649e86ab78411a9d4e30482f6dc45bd89c7b2e65273781377ef181` |
| `/assets/index-BuWQCHok.js` | `e9631333c93edb8a186a9f7cf733b01db35fc992b5211cea5116277135c74c4d` |
| `/assets/index-D4Er5eME.css` | `9dc61e7bc0eb721b84efd5a434588a2737bbf2848643742fbef633f2fedc4659` |
| `/sw.js` | `77f278ed59b62bf5e643e3aaafae76f77eb1005cd93425aef5c5dfc28d0a6ece` |
| `/manifest.webmanifest` | `29e17a6332b15419784cf4721c7da3c53ab2c39ba8318cab3396a77b7a0c2fa9` |

## Earlier findings and minor observations

| Earlier issue | Current disposition |
| --- | --- |
| Update notice did not appear | Repaired — waiting-worker notice and explicit activation passed live. |
| Hashed assets were not immutable | Repaired — live hashed assets have one-year immutable caching. |
| CSP and Permissions-Policy were absent | Repaired — both headers are present and scoped. |
| Manifest MIME type was wrong | Repaired — live type is `application/manifest+json`. |
| Checkout used a dead pilot URL | Repaired — the production endpoint reaches the hosted Hookback Studio checkout. |
| Hidden file inputs were keyboard stops | Repaired — all three remain outside sequential Tab order. |
| The 5–12 second range was not enforced | Repaired — live and claim checks cover both invalid values and exact boundaries. |
| Footer and global targets were under 44 px | Repaired — checked phone targets meet 44×44 pixels. |
| Known A4/B4 audio was assigned about two octaves low | Repaired — the live known-note comparison scores 100% within one cent. |
| The one-click isolated sample was missing | Repaired — populated sample, persistent label, reset, and real-data isolation passed. |
| Claim registry and tagged tests were absent | Repaired — 12 unique claims map one-to-one to 12 passing tests. |
| Copy was metaphorical or incomplete | Repaired — the job, audience, action, headings, facts, and recovery copy are plain. |
| Unknown routes returned Home with HTTP 200 | Repaired — unknown URLs return the designed page with HTTP 404. |
| Navigation, metadata, and shared structure were incomplete | Repaired — route titles, canonical links, header/footer, sitemap, and social metadata pass. |
| Studio claim test did not operate paid outcomes | Repaired — free actions, license return, progress, and named-pack save are asserted. |
| Duration claim test omitted exact 12 seconds | Repaired — exact 12.000-second acceptance and visible output are asserted. |
| Earlier Lighthouse runs varied or crashed after collection | Cleared — a fresh live run exited successfully with 100/100/100/100. |

## Scope and remaining external dependency

This is a static, local-first PWA. Backend tenant isolation, server restart
persistence, health endpoints, and 429/Retry-After checks do not apply. CLI,
library, and desktop installed-artifact checks do not apply. The local signal
processing job does not need a hosted AI step, so no missed AI feature was
found.

No real payment was made. Checkout completion and issued entitlement remain a
Sociobot billing dependency. Pitch comparison is intentionally monophonic;
chords, dense mixes, and noise can reduce accuracy. Microphone and MIDI depend
on browser support, permission, and hardware. The product states these limits.

Evidence is under `/work/.evidence/review-3/`, including fresh screenshots,
the live browser review, URL-check output, and the Lighthouse report.

**Final verdict: PASS — 0 findings and 0 untested claims.**
