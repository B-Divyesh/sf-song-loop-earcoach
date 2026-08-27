# Hookback v1 handoff

## What was built

Hookback is a complete static, installable PWA for learning a short melody from
a user-owned local audio file:

- Audio files are decoded locally and stored as blobs in IndexedDB. Users set
  accessible A/B points, hear a continuously repeating phrase, and return to a
  saved queue after reload.
- Microphone answers use `getUserMedia`/`MediaRecorder`; the visible coral
  recording state remains on screen until the user finishes. Audio is decoded
  in memory, reduced to a monophonic pitch track, and discarded.
- Web MIDI is input-only (`sysex: false`, `software: false`) and records note-on
  values without requesting output/write access.
- The local comparison reports overall match, transposition-aware contour
  match, median pitch-center distance, an overlaid contour chart, and one
  phrase-specific next hint. Unclear/polyphonic input gets an honest uncertain
  state rather than fabricated transcription.
- Practice attempts, due dates, and queue state persist locally. JSON
  export/import includes audio and is available to free users.
- The free core is fully usable. A $19 one-time Studio license adds named
  practice packs and all-time progress review. Checkout/verification use the
  Sociobot pilot API by default, with no product ID hardcoded; production sets
  `VITE_BILLING_BASE=https://api.sociobot.in/api/v1`. License returns are
  captured, locally cached, removed from the URL, verified at most daily, and
  never block the free first paint.
- `/privacy/`, `/terms/`, `robots.txt`, sitemap, manifest, 192/512 icons,
  versioned service worker, app-shell/runtime caching, and an offline fallback
  are included.
- The product-specific generative-geometry system and original artwork
  provenance are recorded in `.factory/design.md`. The shipped WebP is 29 KB.

## Run and verify

```sh
npm ci
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

`npm run build` is the exact build command. It produces `dist/index.html` at
the required static deploy root.

Verification completed on 2026-08-27:

- Vitest: 4/4 unit tests passed (pitch detection, silence handling, contour
  matching, useful low-signal feedback).
- Playwright at 390×844: 5/5 passed. It covers local WAV import, A/B persistence
  after reload, an end-to-end simulated MIDI answer and comparison, keyboard
  focus order, axe checks in empty and active states, direct legal routes, and
  a reload with `context.setOffline(true)` served by the service worker.
- Axe: zero serious or critical violations in empty and populated workbench
  states.
- Console/page-error capture: zero errors on initial load.
- Lighthouse mobile, local production preview: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100. FCP 0.9 s, LCP 1.2 s,
  CLS 0, total blocking time 0 ms.
- Production assets: 30.32 KB JS and 14.97 KB CSS uncompressed (11.21 KB and
  4.33 KB gzip); no runtime dependencies, CDN scripts, remote fonts, tracking,
  or analytics. Hero WebP is 29 KB.
- Manual visual review completed at 1440×1000 and 390×844. Touch controls are
  at least 44 px and the three-stage workbench stacks intentionally on mobile.

## Known limits and next steps

- Pitch estimation is intentionally monophonic. Chords, heavy drums, room
  noise, and dense mixes can reduce confidence; the UI explains this.
- Actual microphone capture and physical MIDI hardware depend on browser/device
  permissions and cannot be hardware-automated in this container. The MIDI
  browser flow was exercised with a standards-shaped virtual input; microphone
  denial/unsupported states are implemented.
- Safari does not expose Web MIDI. Microphone mode remains available there.
- The factory still needs to register the paid product and replace the staging
  billing base at release. No infrastructure, DNS, product ID, or billing
  credentials were changed here.
