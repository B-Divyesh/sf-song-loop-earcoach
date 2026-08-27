# Verification 1 — FAIL

**Date:** 2026-08-27  
**Candidate:** `48d81d6323e3a703d8f55a44c029173265698b10`  
**Deployment:** <https://song-loop-earcoach.sociobot.in/>  
**Disposition:** **FAIL** — the core product is working, but the PWA update
contract and production cache policy do not meet the acceptance contract.

## Reproducibility

Verification used a new clone of
`https://github.com/B-Divyesh/sf-song-loop-earcoach.git` on `main`, confirmed
at the candidate SHA with a clean worktree. Node was v22.23.2.

```sh
npm ci
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

- `npm ci`: completed; audit reported 0 vulnerabilities.
- `npm test`: **4/4** Vitest tests passed.
- `npm run test:e2e`: **5/5** Playwright tests passed.
- `npm run build`: passed (`tsc --noEmit && vite build`) and generated `dist/`.
  There is no separate lint or typecheck script; typechecking is part of the
  exact production build.
- Production output: JS 30.32 KB (11.21 KB gzip), CSS 14.97 KB (4.33 KB gzip),
  hero WebP 29 KB — all within the stated static-PWA budgets.
- Local production-preview Lighthouse mobile: Performance **99**,
  Accessibility **100**, Best Practices **100**, SEO **100**; FCP 0.9 s,
  LCP 1.5 s, TBT 130 ms, CLS 0.

## Product and browser exercise

On the production build, at 1440×1000 and 390×844:

- Imported a valid three-second WAV, adjusted the loop, reloaded, reopened the
  saved clip, and completed a simulated read-only MIDI answer. The comparison,
  score, contour, next hint, and saved queue worked.
- Negative/recovery paths worked: a text file was rejected; a 0.5-second WAV
  received a recoverable decode error; a valid WAV could then be imported;
  malformed backup import left the queue unchanged; denied microphone and
  unavailable MIDI show actionable alternatives.
- Keyboard smoke test reached the skip link, home link, and upload action in
  order. Visible focus was `3px solid`; at 390 px there was no horizontal
  overflow. Reduced-motion computed transition duration was `0.01ms`.
- Axe found **zero serious or critical** issues on empty and populated local
  states, and on the deployed empty state. The deployed page has one `h1`, one
  `main`, a title, and `lang=en`. Console/page-error capture was empty.
- After service-worker installation and a controlled reload, both local and
  deployed pages reloaded offline successfully. The deployed browser made 12
  requests, all to `https://song-loop-earcoach.sociobot.in`; no analytics,
  CDN font/script, or third-party request was observed. Clip data is stored in
  IndexedDB; the only code-level network call is optional license verification.

## Deployment identity and response policy

The deployment is the candidate, not a stale build. SHA-256 matched for all
of the following local candidate and live resources:

| Resource | SHA-256 |
| --- | --- |
| `/` (`dist/index.html`) | `5412653ae5115744cac58c57c6dff6b7ef100ced0aaacbf288be5462f7cd2294` |
| `/assets/index-Cou1JsuK.js` | `d7da516b2a348943f202fa045b8d23fcb71c98caf603fa2b6f95e1967b02fa54` |
| `/sw.js` | `7115d5ce7e7c2ada4a9fc7f67e532cffeca39280654e367b4890174959f19452` |
| `/manifest.webmanifest` | `9f72b621949a0e17248055ec4ddd2f0d8f804ecae457b3c6c580f59ea1899450` |

HTTP redirects to HTTPS. The live site sends HSTS, `nosniff`, and
`Referrer-Policy: strict-origin-when-cross-origin`. It does not send a CSP or
Permissions-Policy header. More importantly, HTML, hashed JS, CSS, service
worker, and manifest are all served as `Cache-Control: public,
must-revalidate, max-age=30`; the manifest is `application/octet-stream`.

## Defects

### Medium — required in-app PWA update path does not work

The service worker calls `skipWaiting()` and `clientsClaim()`, but a real
update does not display the promised update notice. In a controlled browser
test, after the existing worker controlled the page, an intercepted changed
`sw.js` was supplied and `registration.update()` was called. The replacement
activated (`waiting: false`, `installing: false`, controller present), while
`#update-toast.hidden` remained `true`. The `Update` button therefore cannot
be offered to the user. This fails the pwa-offline contract requirement for an
in-app “update available” toast, even though offline reload itself works.

### Medium — production caching is not immutable for hashed assets

The exact live deployment sends a 30-second, must-revalidate policy for
content-hashed JS/CSS. The performance/PWA contract requires long-lived
immutable caching for hashed assets. The service worker masks this after
installation, but normal browser caching remains needlessly revalidated and
does not meet the deployment acceptance policy.

### Low — response-policy hardening is incomplete

Production lacks CSP and Permissions-Policy headers. This did not produce a
functional failure in the tested app, and no third-party traffic was observed,
but a CSP and a deliberately scoped microphone policy are appropriate for a
local-audio application.

## Required release actions

1. Change the service-worker update flow so a waiting/installed update
   visibly offers “Update”, then activates it only after the user chooses it
   (or otherwise make the post-update state explicit).
2. Configure the static host to serve fingerprinted `/assets/*` with a long
   immutable cache lifetime and `manifest.webmanifest` with
   `application/manifest+json` (or `application/json`).
3. Add a restrictive CSP and explicit Permissions-Policy, then repeat live
   header and update-path verification.
