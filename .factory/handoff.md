# Hookback repair 5 handoff

## Status

**PASS — the two strict-review claim gaps are repaired.**

Hookback is a local-first PWA for self-taught instrumentalists learning short song phrases by ear. Its first action is **Try it with sample data**. The free core works without an account or license.

## Revisions and deployment

- Runtime implementation SHA: `4b5b9a91891a2fb512a8546864ba9a81938f6900`. The final HTML, JavaScript, CSS, service worker, and manifest are byte-for-byte identical to this implementation candidate.
- Verification and claim-suite SHA: `5f40314`. Its repair tests and claim-registry descriptions do not alter the built artifact.
- This handoff is a later documentation-only commit and does not change `dist/`.
- The durable static deployer uploaded `dist/` to the existing production Azure Static Web App `sf-song-loop-earcoach` on 6 September 2026. No backend, database, billing setting, environment variable, or replica setting changed.

| Resource | Local and live SHA-256 |
| --- | --- |
| `/` | `0e7113ed06649e86ab78411a9d4e30482f6dc45bd89c7b2e65273781377ef181` |
| `/assets/index-BuWQCHok.js` | `e9631333c93edb8a186a9f7cf733b01db35fc992b5211cea5116277135c74c4d` |
| `/assets/index-D4Er5eME.css` | `9dc61e7bc0eb721b84efd5a434588a2737bbf2848643742fbef633f2fedc4659` |
| `/sw.js` | `77f278ed59b62bf5e643e3aaafae76f77eb1005cd93425aef5c5dfc28d0a6ece` |
| `/manifest.webmanifest` | `29e17a6332b15419784cf4721c7da3c53ab2c39ba8318cab3396a77b7a0c2fa9` |

## Strict-review repair

- `@claim:free-studio-split` now adds a local phrase, plays the free loop, observes **Loop playing**, exports a backup containing the selected audio, follows the exact production checkout URL through a test-only routed return, receives a valid fixture license via the real browser capture/verification path, observes **Studio license active** and **Practice progress**, saves **Friday guitar**, and finds that pack in the queue.
- The checkout fixture is confined to the automated sandbox. It does not claim a payment was made or replace the production Sociobot checkout.
- `@claim:clip-duration` rejects deterministic 0.8- and 12.5-second WAVs, then accepts exact 5.000- and 12.000-second WAVs. The upper-boundary outcome is visible: B moves to `0:12.0` and the loop reads `12.0 sec`.
- `@claim:demo-isolation` now makes a second demo entry/reset round-trip and asserts that the same visible real clip remains queued while the sample does not cross the storage boundary.

## Final checks

The documented clean setup used Node `v22.23.2` and npm `10.9.8`.

```text
npm ci               PASS — 61 packages, 0 vulnerabilities
npm test             PASS — 9/9 Vitest tests
npm run build        PASS — dist/ produced
12 claim commands    PASS — each registry command run separately
npm run test:e2e     PASS — 48/48 desktop and phone Playwright tests
```

The final build is 35.74 KB JavaScript (12.91 KB gzip) and 17.56 KB CSS (4.81 KB gzip). The first-screen WebP is 29.10 KB. The suite covers normal, invalid, boundary, recovery, keyboard, touch target, reduced motion, 200% text, offline, update, accessibility, privacy, metadata, legal pages, and deliberate 404 behavior. Axe found no serious or critical violations. Local `verify-url.sh` found a title, `lang=en`, one h1, a main landmark, image alt text, named buttons, and no console errors.

## Fresh HTTPS verification

Fresh 1440×1000 desktop and 390×844 phone contexts showed before scrolling: **Learn short song phrases by ear** for self-taught instrumentalists who want to play songs from memory, with **Try it with sample data** as the first action.

Both entered the populated eight-second **Four-note guitar phrase** demo, showed the persistent **Demo — sample data, nothing is saved** label after reload, reset to the original result, added real data, ran a second demo reset, and returned to the unchanged visible real queue. Live Axe found zero serious or critical issues. These flows had no console/page errors and no cross-origin requests.

The production URL verifier passed. A fresh controlled phone service worker reloaded `/demo` offline with the populated sample visible. HSTS, CSP, `nosniff`, Referrer-Policy, microphone/MIDI Permissions-Policy, and immutable hashed-JS caching are live. Privacy and Terms return 200 with route titles; an unknown route returns the designed page with expected HTTP 404.

## Earlier findings

| Earlier finding | Current proof |
| --- | --- |
| Update notice, immutable assets, CSP, Permissions-Policy | Final browser and response-header checks pass. |
| Dead pilot checkout | UI and regression test use the production Sociobot endpoint. |
| Hidden file-input stops and undersized targets | Final desktop and phone keyboard/touch tests pass. |
| Pitch, duration, demo, claims, copy, 404, and structure | Final claims, browser suite, live flows, and copy audit pass. |

## Limits and evidence

The free loop, pitch feedback, queue, and export remain free. Hookback Studio is advertised as a $19 one-time unlock for named practice packs and all-time progress review. Public metadata is in `/work/.evidence/billing-offer.json`; the verb-first catalog description is copied to `/work/.evidence/catalog-description.txt` and is 85 characters.

No payment was made during this repair. Purchase completion and issued entitlement remain a Sociobot billing dependency. The fixture proves only the product’s local return, license capture, verification response, and paid UI path. Pitch comparison is monophonic; dense mixes and chords can reduce accuracy. Microphone and MIDI hardware still depend on browser support and permission.

- Local URL verification: `/work/.evidence/repair-5/local-url/`
- Fresh live URL verification: `/work/.evidence/repair-5/live-url/`
- Fresh desktop and phone screenshots/summary: `/work/.evidence/repair-5/live-final-run/`
- Billing metadata: `/work/.evidence/billing-offer.json`
- Catalog description copy: `/work/.evidence/catalog-description.txt`
