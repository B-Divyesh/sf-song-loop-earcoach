# Verification 6 — PASS: learn short song phrases by ear

**Verification date:** 6 September 2026  
**Live URL:** <https://song-loop-earcoach.sociobot.in/>  
**Implementation reviewed:** `4b5b9a91891a2fb512a8546864ba9a81938f6900`  
**Documentation SHA reviewed:** `ba5a4afe82becaa6844096f198c786805031828f`  
**Verdict:** **PASS — 0 findings and 0 untested claims.**

The live HTML, JavaScript, CSS, service worker, and manifest are byte-for-byte
identical to the implementation candidate. Later commits contain tests and
reports; the temporary history fix was removed, so the shipped product files
still match `4b5b9a9`.

## What appears before scrolling

Fresh 1440×1000 desktop and 390×844 phone browsers showed all three required
items before scrolling:

- **Job:** Learn short song phrases by ear.
- **Audience:** self-taught instrumentalists who want to play songs from
  memory, one short phrase at a time.
- **First action:** **Try it with sample data**. The adjacent line says it opens
  a filled practice loop and pitch comparison.

The page title is **Hookback — learn short song phrases by ear**. The copy is
plain, the action is clear, and the three privacy, offline, and price facts are
also on the first screen.

## Clean checkout and build results

A fresh clone of `main` resolved to documentation SHA `ba5a4af`. It used Node
`v22.23.2`, npm `10.9.8`, and the repository-pinned Playwright `1.58.2`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 61 packages, 0 vulnerabilities |
| `npm test` | PASS — 9/9 Vitest tests |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 48/48 desktop and phone tests |
| Declared claim commands | PASS — 12/12 run separately |

The build emits 35.74 KB JavaScript (12.91 KB gzip) and 17.56 KB CSS
(4.81 KB gzip). The first-screen WebP is 29.10 KB. These pass the product's
static PWA budgets.

## Declared claims

The registry has 12 unique ids. Each id occurs in exactly one tagged test. I
ran every registry command separately from the clean checkout and inspected
the assertions for the promised outcome.

| Claim | Result | Evidence checked |
| --- | --- | --- |
| `demo-isolation` | PASS | A seeded real clip and loop point remained unchanged after two demo entries, changes, resets, and exits. |
| `offline-reload` | PASS | A fresh service-worker-controlled sample reloaded with its populated result while offline. |
| `no-account` | PASS | A clean context used the sample controls with no login fields, cookies, or credentials. |
| `local-audio` | PASS | Playback and a microphone answer made no remote request; recorded audio was absent from stored fields. |
| `no-tracking` | PASS | Demo load and reset used no ads, analytics, pixels, or remote font/script requests. |
| `clip-duration` | PASS | 0.8 and 12.5 seconds were rejected; exact 5.000 and 12.000 seconds were accepted, and 12.0 seconds was visible. |
| `recording-state` | PASS | Granted microphone use showed **Listening…**, the local-audio notice, and **Finish answer**. |
| `midi-read-only` | PASS | MIDI requested non-sysex input, received a note, and made no output call. |
| `pitch-feedback` | PASS | Known A4/B4 audio matched the same MIDI notes above 90%, within 5¢, with one next step. |
| `practice-persists` | PASS | The sample, result, and changed loop point remained after reload. A separate live check also passed after closing and reopening the tab. |
| `backup-audio` | PASS | Exported JSON contained the selected audio bytes and restored the sample. |
| `free-studio-split` | PASS | Free playback and backup export worked; the fixture checkout return verified a license, showed progress, and saved **Friday guitar** as a named pack. |

The repaired Studio test now operates both free actions and the claimed paid
outcomes. The repaired duration test now accepts exactly 12.000 seconds and
checks the visible 12.0-second loop. No unlisted, false, incomplete, or
untested public claim was found on the product, README, Privacy, or Terms.

## Live desktop and phone results

Both fresh browsers entered the sample in one click. The first populated screen
showed the realistic eight-second **Four-note guitar phrase**, a 99% match,
pitch shape, and one next step. The persistent **Demo — sample data, nothing is
saved** label remained after reload. Changing the B point to 6.5 seconds
survived reload; **Reset demo** restored the original eight-second result.

In separate fresh real storage, each viewport imported a five-second local
clip, changed the loop to 2.5 seconds, played and stopped it, and retained it.
After the demo was changed and reset, **Start for real** returned to that same
clip and loop point. The sample did not cross into real practice data.

The desktop live flow answered known audio through a standards-shaped MIDI
input, showed the comparison and next step, requested no sysex, and made no
output call. A fake granted microphone on the live runtime showed its recording
name, local notice, and finish action. No browser console or page errors
occurred during these flows.

## Normal, invalid, boundary, and recovery results

- Valid five- and twelve-second WAV files populated the workbench.
- A text file gave the audio-type message. A 0.8-second file and a 12.5-second
  file gave the 5–12 second guidance. Valid input then recovered normally.
- The exact 12.000-second file exposed **B · 0:12.0** and **12.0 sec**.
- Denied microphone access gave the browser-settings and MIDI alternative.
- Malformed backup JSON said **Nothing was changed** and left the queue intact.
- A fake invalid Studio token gave **That license is not active for Hookback**
  while the free practice controls remained available.
- Destructive clip removal, license removal, and replacement import require a
  confirmation that names the effect.

## Accessibility and mobile results

The factory URL check found `lang=en`, one h1, one main landmark, complete image
alt text, named buttons, and no console errors. Live Playwright Axe scans on
home, populated practice, demo, Privacy, Terms, and the missing-route page had
zero serious or critical violations. The explicit single dark treatment has
no second theme to check.

Every sequential desktop keyboard stop was visible with the designed 3 px
focus outline. Hidden file inputs remained outside the Tab order, while their
visible buttons worked. ArrowRight changed the focused A-loop value from 0 to
0.05. There was no keyboard trap.

At 390 px, all visible links, buttons, and usable inputs measured at least
44×44 CSS pixels. At 200% text, the sample retained playback and recording
controls without horizontal overflow. Reduced-motion transitions computed to
0.01 ms. Canvas charts have accessible names and the comparison has adjacent
plain text.

## Offline, update, privacy, and routes

A fresh phone context became service-worker controlled, went offline, and
reloaded `/demo` with the populated sample result. A changed worker URL showed
**Fresh version ready**; only choosing **Update** activated the new controller.
The manifest, 192/512 icons, maskable purpose, versioned start URL, and
standalone display are present.

Normal live practice and the complete demo flow made requests only to the
product origin. No analytics, tracking, remote fonts, remote scripts, audio
uploads, or unexpected requests appeared. IndexedDB separates `hookback-local`
and `hookback-demo`. Privacy explains local data, audio handling, export, site
data removal, billing verification, access logs, and a working contact path.

Home, Demo, Privacy, Terms, the direct 404 page, robots, sitemap, manifest,
icons, and every discovered link worked. Home, Demo, Privacy, Terms, and the
missing page have route-specific titles, one h1, and a main landmark. An
unknown address returned the designed **This page does not exist** page with
HTTP 404. That deliberate 404 is expected and is not a defect.

The live site sends HSTS, CSP, `nosniff`, Referrer-Policy, and scoped
microphone/MIDI Permissions-Policy headers. Hashed JavaScript and CSS use a
one-year immutable cache. The service worker and manifest use `no-cache`, and
the manifest has the correct MIME type.

## Billing and performance

The production **Buy Studio** endpoint returned HTTP 303 to the hosted Dodo
checkout. The checkout page identified **Hookback Studio** and **19.00**. No
payment was attempted. The automated fixture proves license capture,
verification, the paid progress view, and named packs; real entitlement
issuance remains managed by Sociobot billing.

Fresh live mobile Lighthouse scored Performance **100**, Accessibility **100**,
Best Practices **100**, and SEO **100**. FCP was 1.0 s, LCP 1.2 s, TBT 90 ms,
CLS 0, and transferred content was 69 KiB.

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
| Update notice did not appear | Repaired — the live waiting-worker notice and explicit activation passed. |
| Hashed assets were not immutable | Repaired — live JavaScript and CSS use one-year immutable caching. |
| CSP and Permissions-Policy were absent | Repaired — both are present on live responses. |
| Manifest MIME type was wrong | Repaired — the live manifest is `application/manifest+json`. |
| Checkout used a dead pilot URL | Repaired — the production endpoint reaches the hosted Hookback Studio checkout. |
| Hidden file inputs were keyboard stops | Repaired — all three remain outside sequential Tab order. |
| The 5–12 second range was not enforced | Repaired — live and tagged checks cover both invalid values and both exact boundaries. |
| Footer and global targets were under 44 px | Repaired — all visible phone targets pass 44×44 pixels. |
| A4/B4 pitch was about two octaves low | Repaired — known notes now match within the declared tolerance. |
| No one-click isolated sample | Repaired — populated sample, persistent label, reset, and seeded real-data isolation passed live. |
| Claims and tagged tests were absent | Repaired — 12 unique entries map one-to-one to 12 passing outcome tests. |
| Copy was metaphorical or incomplete | Repaired — job, audience, action, facts, headings, and recovery text are plain. |
| Unknown routes returned home with HTTP 200 | Repaired — missing routes return the designed page with HTTP 404. |
| Navigation, metadata, and shared structure were incomplete | Repaired — routes, titles, canonical links, shared header/footer, sitemap, and metadata pass. |
| Studio claim test did not operate paid outcomes | Repaired — checkout return, license verification, progress, and named-pack save are asserted. |
| Duration claim test omitted exact 12 seconds | Repaired — exact 12.000-second acceptance and visible output are asserted. |

## Scope and remaining external dependency

This is a static local-first PWA. Backend tenant isolation, server restart
persistence, health endpoints, and 429/Retry-After checks do not apply. Its
local signal-processing job does not need a hosted AI feature; no missed AI
step was found.

No real payment was made. Checkout completion and issued entitlement remain a
Sociobot billing dependency. Pitch comparison is monophonic; chords, dense
mixes, and noise can reduce accuracy. Microphone and MIDI depend on browser
support, permission, and connected hardware. These limits are stated in the
product and are not findings.

Evidence is under `/work/.evidence/verification-6/`, including desktop and
phone screenshots, URL-check output, the deep live-check script and result,
claim summary, and the Lighthouse report.

**Final verdict: PASS — 0 findings and 0 untested claims.**
