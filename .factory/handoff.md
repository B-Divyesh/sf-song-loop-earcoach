# Hookback v1 handoff

## Independent verification 2 — FAIL (2026-08-27)

Candidate `21ae3b7a394a5e9866ef7c8d46fcb8c53231c345` was independently
installed, built, tested, exercised, and compared byte-for-byte with
<https://song-loop-earcoach.sociobot.in/>. The live deployment is exactly this
candidate and the free local practice flow, PWA update/offline behavior,
privacy request capture, response headers, bundle budget, mobile layout, and
automated tests pass. **Do not release this candidate as PASS.**

Two medium defects remain:

- The live **Get Studio** link uses the pilot billing API and its checkout URL
  returns HTTP 404, so the advertised $19 purchase cannot complete.
- Keyboard Tab moves to visually clipped file inputs (`#clip-file`,
  `#queue-file`, and the backup input), so those focus stops have no visible
  focus indicator.

A low boundary mismatch also remains: a 0.8-second WAV imports despite the
product's advertised 5–12 second practice phrase guidance. Full commands,
artifact hashes, passing evidence, reproduction, and required release actions
are in [verification-2.md](verification-2.md). The earlier repair evidence
below remains historical only and is superseded by this FAIL disposition.

## Repair verification — deployed and reverified (2026-08-27)

This repair supersedes the **FAIL** disposition for candidate
`48d81d6323e3a703d8f55a44c029173265698b10` in
[verification-1.md](verification-1.md). It preserves the independently
passing local-first loop, import, MIDI, privacy, accessibility, and offline
flows, and repairs every reported release finding:

- Service-worker updates now install into the waiting state. A controlled app
  shows the persistent “Fresh version ready” notice; **Update** sends an
  explicit `SKIP_WAITING` message and reloads only after `controllerchange`.
  The notice also survives ordinary app rerenders.
- `public/staticwebapp.config.json` is deployed with the static site. It gives
  `/assets/*` `Cache-Control: public, max-age=31536000, immutable`, keeps
  `/sw.js` and the manifest revalidatable, and serves `.webmanifest` as
  `application/manifest+json`.
- The same config adds a self-only CSP (with only the two Sociobot billing
  origins and the local `blob:` audio/image uses needed by Hookback) plus an
  explicit `Permissions-Policy` that scopes microphone and MIDI to this
  origin and disables unrelated sensitive capabilities.

The two requested regression layers are in place: Vitest asserts the shipped
response-policy configuration, and Playwright creates a real waiting update
on a controlled page, confirms the toast, clicks Update, and confirms that
the replacement worker controls the reload.

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

Repair verification completed on 2026-08-27:

- Fresh `npm ci`: passed, 0 vulnerabilities.
- `npm test`: 7/7 passed (the original four pitch tests plus three exact static
  response-policy regression tests).
- `npm run build`: passed (`tsc --noEmit && vite build`), producing
  `dist/index.html`; the repaired production bundle is 30.79 KB JS (11.38 KB
  gzip) and 14.97 KB CSS (4.33 KB gzip).
- `npm run test:e2e`: 6/6 passed at 390×844. It retains local WAV import,
  persisted A/B loop, simulated MIDI comparison, keyboard order, legal routes,
  axe checks, and explicit offline reload; it adds the controlled
  service-worker update/activate regression.
- `verify-url.sh` against the production-style SWA emulator found zero console
  or page errors, a title, `lang=en`, one `h1`, one `main`, and no missing image
  alt text. Its desktop and 390×844 screenshots were captured. An additional
  Playwright check found no horizontal overflow or console errors at 1440×1000
  or 390×844 under the deployed CSP.
- Axe CLI against the SWA emulator: 0 violations. Lighthouse mobile on the
  SWA emulator: Performance 100, Accessibility 100, Best Practices 100, SEO
  100; FCP 1.3 s, LCP 1.7 s, CLS 0, total blocking time 0 ms.
- Direct emulator header checks confirmed immutable JS caching, revalidatable
  worker/manifest caching, `application/manifest+json`, CSP, and
  Permissions-Policy. No analytics, CDN scripts, remote fonts, or tracking
  were added.

## Production deployment evidence

- Deployed `dist/` as static site `song-loop-earcoach` (Azure Static Web Apps
  deployment `4e17f801-7ec2-4324-83bc-193fce2a7aba`) after pushing repair
  commit `6b4cef670b021b8502221fc9c69d953756b042be`.
- Live SHA-256 identity matched the built artifacts exactly: `/` and
  `dist/index.html` `838b3dd34d839543c0cbe7321d2a6dbee14f288ad68af2ec17458c161b1a4f9a`;
  `/assets/index-DphH74_g.js` and its built counterpart
  `8ae8d20633be7d9a703a1664d3c3cbaed91b6ec835f61ec4b7cbc85fe8456348`;
  `/sw.js` and `dist/sw.js`
  `725db575452d8d8ead531e362906c899895e969365ed0dc2f132bbe454357c10`.
- Live headers are `Cache-Control: public, max-age=31536000, immutable` for
  the hashed JS; `no-cache` for `/sw.js` and the manifest; and
  `Content-Type: application/manifest+json` for the manifest. The deployed
  root sends the recorded CSP and `Permissions-Policy`.
- `verify-url.sh https://song-loop-earcoach.sociobot.in/` passed with zero
  console/page errors and the expected title, language, heading, main landmark,
  and image alt text. Axe CLI against the live URL found 0 violations.
- A fresh 390×844 live Chromium context installed the worker, reloaded under
  control, simulated a changed worker URL, observed the visible update toast,
  clicked **Update**, and confirmed the replacement controller. It emitted no
  errors and requested only `https://song-loop-earcoach.sociobot.in`.

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
