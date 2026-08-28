# Independent verification 4 — PASS

**Verified 2026-08-28** against candidate commit
`723c830b530876ff150c35e4f5347fc966838d3b` and production
<https://song-loop-earcoach.sociobot.in/>.

## Disposition

**PASS.** This is a deployed, working local-first PWA for the researched job:
choose a short owned audio phrase, set a loop, respond using microphone or
read-only MIDI, receive a contour comparison and next hint, and return to the
saved practice queue. No release-blocking defect was found. There are no open
critical, high, medium, or low product defects from this verification.

## Clean-install and build evidence

The checkout was clean and already at the requested candidate before testing.

```text
npm ci                 PASS — 61 packages; 0 vulnerabilities
npm test               PASS — 7/7 Vitest tests
npm run build          PASS — tsc --noEmit && vite build
npm run test:e2e       PASS — 18/18 Playwright Chromium checks
```

The exact production build emitted `dist/` with 30.94 KB JS (11.42 KB gzip)
and 15.24 KB CSS (4.35 KB gzip). These are below the 200 KB JS and 50 KB CSS
static-PWA budgets. The first-screen WebP is 29.10 KB.

## Independent browser exercise

In a new Chromium profile, independently of the shipped tests, I exercised
both `http://localhost:4174` (the production `dist/` preview) and the live
HTTPS site at 390×844:

- Imported an exact five-second WAV, successfully entered the practice
  workbench, submitted a MIDI answer using a mocked input, received the
  comparison plus actionable next hint, and confirmed the scored attempt in
  the persisted queue.
- Verified non-audio input reports a clear recovery message; an invalid JSON
  backup reports that nothing changed. Exported a real backup and imported it
  back successfully (`Imported 1 hook.`).
- The repository E2E suite separately proved the 0.8 s and 12.5 s boundary
  clips are rejected with the stated 5–12 second recovery message. Its normal
  test also proves loop-point persistence through reload.
- With a fake granted microphone, `Record answer` immediately showed the
  coral `Listening…` recording state and `Recorded locally` notice; finishing
  the test recording saved the attempt. With no microphone permission it
  showed “Microphone access was blocked… switch to MIDI.”
- The normal MIDI path requested `{ sysex: false, software: false }` and
  accepts only input notes. Browser tests also cover missing MIDI input and
  update behavior.
- Initial page-load request capture contained only the page’s own origin on
  both preview and live; no analytics, CDN, upload, or third-party font/script
  request occurred. The optional Studio link points at the production Sociobot
  endpoint, whose checkout returns HTTP 303 to hosted checkout.

## Accessibility, UX, and responsive checks

- Empty and populated independent Axe scans: **0 serious/critical** findings
  locally and live. The shipped 18-test suite also passes empty/populated Axe
  scans.
- No console errors or `pageerror` events in the independent preview/live
  journeys.
- The 390px page had exactly 0px horizontal overflow. Desktop (1440px) and
  390px screenshots were visually reviewed; the mobile layout intentionally
  stacks stages and remains legible.
- Keyboard regression coverage passed for every sequential stop. Hidden file
  inputs have `tabindex=-1`; their visible labelled controls are the keyboard
  entry points. An independent focus probe found a visible 3px solid focus
  outline. All global/footer targets are checked by the suite at ≥44×44px in
  desktop and mobile.
- `prefers-reduced-motion: reduce` reduces transitions to 0.01ms; no
  uncontrolled decorative loop was observed.

Mobile Lighthouse reports written before this container’s Chromium crashed in
the final screenshot/BFCache collection were: performance **88 / 97 / 100**,
accessibility **100 / 100 / 100**, best practices **100 / 100 / 100**, and
SEO **100 / 100 / 100**. The latter two repeat runs satisfy the performance
threshold; FCP was 0.9–1.0 s, LCP 1.5–1.6 s, CLS 0. The first-run 470ms TBT
and all three final non-zero exits correlate with the terminal
`TARGET_CRASHED` screenshot/BFCache artifact after JSON report emission, not a
page error; no product defect is assigned from that runner instability.

## PWA, privacy, and response-policy checks

- The manifest has standalone display, versioned start URL, matching dark
  splash colors, and 192/512 icons including maskable purpose.
- Independent preview and live checks waited for service-worker control, then
  set the context offline and reloaded the shell successfully. The E2E suite
  additionally creates a waiting worker, verifies the visible update toast,
  selects Update, and confirms the replacement worker controls the reload.
- Local clips, recordings, attempts, and queue data remain in IndexedDB;
  export/import is available before any Studio unlock. No audio request left
  the origin during testing.
- Live `/`, `/sw.js`, and manifest have HTTPS/HSTS, `nosniff`, strict-origin
  referrer policy, self-restricted CSP, and microphone/MIDI-only
  Permissions-Policy. The hashed JS response is
  `public, max-age=31536000, immutable`; `/sw.js` and the manifest are
  `no-cache`, and the manifest is `application/manifest+json`.

## Deployment identity

Fresh SHA-256 comparisons establish that the live site is the candidate’s
production build, not a stale/deployment-only variant:

| Resource | SHA-256 |
| --- | --- |
| `/` | `c9a720fbdd08a428ad1ab34ab3b28cb814963420d149294c525636c0b2f8efa2` |
| `/assets/index-CECmo6YL.js` | `3e6eab750729664d8df52c862952f091b3343c680e850c5437eae64ed20e9658` |
| `/assets/index-CYHkUulu.css` | `877396695469bbfa2e1a1ae3e21f09acd8d8c99430849870f35e7ff7c7fa9521` |
| `/sw.js` | `617520ef63b3a75a1324e52f096d16f1d9c0d24b17681204459f87013690fc44` |
| `/manifest.webmanifest` | `b080e61f08958479e340d1d58744e2dfa09ed00742a9cd532d73ed0c647037e8` |

## Residual limitations

These are communicated product constraints, not verification defects:
monophonic pitch estimation is deliberately less certain for dense/chordal
clips, and real microphone/MIDI hardware depends on compatible browser/device
permissions. The supported and denied paths above are covered without
claiming physical-hardware automation.
