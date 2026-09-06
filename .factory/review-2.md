# Review 2 — FAIL: learn short song phrases by ear

**Review date:** 6 September 2026  
**Live URL:** <https://song-loop-earcoach.sociobot.in/>  
**Implementation reviewed:** `4b5b9a91891a2fb512a8546864ba9a81938f6900`  
**Documentation SHA before this report:** `d8d294fd7063d54c9602e11c4ccfc1527f26ac3c`  
**Verdict:** **FAIL — 2 findings and 2 untested claims.**

The live HTML, JavaScript, CSS, service worker, and manifest are byte-for-byte
identical to the clean implementation build. Commits after `4b5b9a9` add only
verification documentation and a live-verification helper; they do not change
the shipped product image.

## What appears before scrolling

Fresh 1440×1000 desktop and 390×844 phone browsers showed:

- **Job:** Learn short song phrases by ear.
- **Audience:** self-taught instrumentalists who want to play songs from
  memory, one short phrase at a time.
- **First action:** **Try it with sample data**. The adjacent text says it opens
  a filled practice loop and pitch comparison.

The wording is plain, the title names the job, and all three items are visible
without scrolling at both sizes.

## Findings

### R2-01 — Medium — the Studio claim test does not test the claimed paid features

The `free-studio-split` claim says that the free core works and that the $19
one-time Studio purchase adds named packs and an all-time progress review. Its
declared command passes, but the tagged test only checks that **Play loop** and
**Export my data** are enabled, reads the offer copy, and checks the checkout
link's `href`. It does not operate either free control, open the hosted
checkout, simulate a valid license, save a named pack, or inspect progress.

This is not the observable outcome required by the claims contract. A broken
play button, export action, license return, pack save, or progress view could
all pass the current claim command.

An independent live fixture confirmed the current implementation works: the
license was removed from the URL, the progress view appeared, and “Friday
guitar” persisted on the clip. The real checkout displayed Hookback Studio and
$19. That manual evidence shows the public claim is currently true, but it
does not replace the required tagged sandbox test.

### R2-02 — Medium — the duration claim test omits the inclusive 12-second boundary

The `clip-duration` claim says Hookback accepts clips from 5 to 12 seconds.
Its tagged test accepts exactly 5 seconds and rejects 0.8 and 12.5 seconds. It
never submits exactly 12 seconds and therefore does not prove the stated upper
boundary is inclusive. This is an incomplete quantitative claim test.

The live product accepted a deterministic 12.000-second WAV and exposed a
decoded duration of 12 seconds. The behavior is correct; the declared command
still lacks the required assertion.

**Untested claim count: 2.** Each count is one claim registry entry whose
tagged command does not prove its full public statement.

## Declared claim commands

Every command in `.factory/claims.json` was run separately from a fresh clone.
All commands exited successfully, but two are incomplete as described above.

| Claim | Command result | Contract result |
| --- | --- | --- |
| `demo-isolation` | Pass | Pass |
| `offline-reload` | Pass | Pass |
| `no-account` | Pass | Pass |
| `local-audio` | Pass | Pass |
| `no-tracking` | Pass | Pass |
| `clip-duration` | Pass | **Incomplete — R2-02** |
| `recording-state` | Pass | Pass |
| `midi-read-only` | Pass | Pass |
| `pitch-feedback` | Pass | Pass |
| `practice-persists` | Pass | Pass |
| `backup-audio` | Pass | Pass |
| `free-studio-split` | Pass | **Incomplete — R2-01** |

The registry contains 12 unique ids and the test suite contains exactly one
matching tag for each id. No additional unsupported product-capability claim
was found on the landing page, README, Privacy, or Terms pages.

## Clean-checkout results

A fresh clone at documentation SHA `d8d294f` used Node `v22.23.2`. The worktree
remained clean after all commands.

```text
npm ci             PASS — 61 packages, 0 vulnerabilities
npm test           PASS — 9/9 Vitest tests
npm run build      PASS — dist/ produced
npm run test:e2e   PASS — 48/48 desktop and phone tests
claim commands     PASS exits — 12/12 run separately; 2 incomplete assertions
```

The build emits 35.74 KB JavaScript (12.91 KB gzip) and 17.56 KB CSS
(4.81 KB gzip). The first-screen WebP is 29.10 KB. All are within the PWA
budgets.

## Live product evidence

Fresh desktop and phone contexts entered the sample in one click. The persistent
demo label remained after reload. The sample showed a 99% match, pitch shape,
and a next step. Changing and resetting the demo restored its original eight-
second sample. A separately seeded real clip remained unchanged after demo use
and reset.

A deterministic A4/B4 WAV answered with matching read-only MIDI notes scored
100% and was one cent from center. MIDI requested neither sysex nor software
output and did not call an output device.

Normal, invalid, boundary, and recovery paths passed. The product accepted 5-
and 12-second WAVs; rejected 0.8- and 12.5-second WAVs; recovered after a text
file; gave a clear blocked-microphone message; and rejected malformed backup
JSON without changing the saved queue.

Keyboard order reached all visible controls with a 3 px focus ring. Range
arrows changed the A point from 0 to 0.05. Checked global, demo, and footer
targets measured at least 44×44 CSS pixels. At 200% text the phone demo had no
horizontal overflow or lost controls. Reduced-motion transitions computed to
0.01 ms.

Playwright Axe found zero serious or critical issues on home, demo, populated
practice, Privacy, Terms, direct 404, and missing-route states. The factory URL
check found one h1, one main landmark, `lang=en`, complete image alt text,
named buttons, and no console or page errors. All discovered links and
fragments worked. Privacy and Terms have route-specific titles. The deliberate
unknown URL returned HTTP 404 with the designed “This page does not exist”
screen; this expected 404 is not a defect.

Fresh request capture during the demo stayed on the product origin. The
optional checkout was the only external product action exercised. No account,
analytics, remote font, or remote script request appeared.

## Offline, updates, headers, and performance

A fresh phone context became service-worker controlled, went offline, and
reloaded `/demo` with the populated comparison. Registering a changed worker
showed **Fresh version ready**; only **Update** activated the new controller.

The live site sends HSTS, CSP, `nosniff`, Referrer-Policy, and scoped
microphone/MIDI Permissions-Policy headers. Hashed JavaScript and CSS use a
one-year immutable cache. The worker and manifest use `no-cache`, and the
manifest has the correct MIME type.

Fresh live mobile Lighthouse scores were Performance **100**, Accessibility
**100**, Best Practices **100**, and SEO **100**. FCP was 1.0 s, LCP 1.1 s,
TBT 0 ms, CLS 0, and transferred content was 50 KiB.

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
| Update notice did not appear | Repaired — waiting-worker notice and explicit activation passed live. |
| Hashed assets were not immutable | Repaired — live JavaScript and CSS use a one-year immutable cache. |
| CSP and Permissions-Policy were absent | Repaired — both are present on live responses. |
| Checkout used a dead pilot URL | Repaired — the production endpoint reaches the hosted Hookback Studio checkout. |
| Hidden file inputs were keyboard stops | Repaired — all three remain outside sequential Tab order. |
| The 5–12 second range was not enforced | Product repaired — live 0.8, 5, 12, and 12.5 second checks behaved correctly. The tagged claim test still has R2-02. |
| Footer and global targets were under 44 px | Repaired — desktop, phone, and demo measurements passed. |
| A4/B4 pitch was about two octaves low | Repaired — live score was 100% within one cent. |
| No one-click isolated sample | Repaired — populated sample, persistent label, reset, and real-data isolation passed. |
| Claims and tagged tests were absent | Partly repaired — all 12 entries and tags exist, but R2-01 and R2-02 are incomplete. |
| Copy was metaphorical or incomplete | Repaired — the first screen and route headings use plain task words. |
| Unknown routes returned home with HTTP 200 | Repaired — missing routes return the designed HTTP 404 page. |
| Navigation, route metadata, and shared structure were incomplete | Repaired — home, demo, legal, and 404 structure and metadata passed. |

## Scope and limits

This is a static local-first PWA. Backend tenant isolation, server restart
persistence, health endpoints, and 429/Retry-After checks do not apply. Browser
IndexedDB separates real and demo data. The monophonic signal-processing job
does not need a hosted AI feature, so there is no missed AI leverage finding.
No product code, infrastructure, billing configuration, DNS, user data, or
other product was modified.

Evidence is under `/work/.evidence/review-2/`, including clean command logs,
claim-command logs, screenshots, live-flow JSON, URL verification, link crawl,
headers, deployment hashes, the supplemental boundary/Studio check, and the
Lighthouse report.

**Final verdict: FAIL — 2 findings and 2 untested claims.**
