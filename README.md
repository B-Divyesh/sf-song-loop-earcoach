# Hookback

Hookback helps self-taught instrumentalists learn short song phrases by ear.
Choose a 5–12 second audio file, loop it, and answer from memory.
Hookback compares single-note pitch and melodic shape, then gives one next step.

Try the isolated sample at <https://song-loop-earcoach.sociobot.in/demo>.
The live product is <https://song-loop-earcoach.sociobot.in/>.

## What it does

- Imports local audio and provides an adjustable A/B loop.
- Records an answer with a visible microphone state or read-only Web MIDI.
- Compares single-note pitch and melodic shape on the device.
- Saves the practice queue and answers in IndexedDB across page reloads.
- Exports and imports JSON backups that include selected audio.
- Works offline after the first visit.
- Keeps the loop, feedback, queue, and export free.
- Offers $19 Hookback Studio as a one-time purchase for packs and progress review.

Hookback does not upload clips or microphone recordings.
It uses no account, ads, behavioral analytics, tracking pixels, or remote fonts and scripts.
Chords, dense mixes, and background noise can reduce pitch accuracy.
Hookback does not transcribe full songs.

## Run and verify

Install Node 20.19 or later. Start from a clean checkout.

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Run `npm run dev` for development.
Run `npm run preview` to inspect the production build locally.
The build creates `dist/` with `dist/index.html` at its root.

The claim registry is [.factory/claims.json](.factory/claims.json).
Run each listed command from a clean checkout.
The browser tests use Playwright 1.58.2 and its Chromium build.

## Demo sandbox

Open `/demo` or `/?demo=1` to load an eight-second sample phrase.
The sample includes a saved answer, pitch comparison, score, and next step.
Demo data uses the separate `hookback-demo` IndexedDB database.
Resetting or leaving the demo clears that database.
The app never reads or changes the `hookback-local` database while demo mode is active.

See [.factory/demo.md](.factory/demo.md) for the test path and reset details.

## Paid features

The free practice loop remains usable without a license.
Hookback Studio costs $19 once and adds named packs plus all-time progress review.
Checkout and license checks use the Sociobot billing API.
Sociobot and Dodo act as merchant of record.

Production builds use `https://api.sociobot.in/api/v1`.
An explicit preview build may set `VITE_BILLING_BASE` to the pilot API.
No payment provider key belongs in this repository.

## Project structure

- `src/audio.ts` contains local pitch extraction and comparison.
- `src/db.ts` contains separate real and demo storage access.
- `src/license.ts` contains cached Sociobot license verification.
- `public/sw.js` contains offline caching and update behavior.
- `.factory/design.md` records the visual system and asset provenance.
- `.factory/handoff.md` records verification results and known limits.

Hookback uses the MIT license in [LICENSE](LICENSE).
Read the live [privacy policy](https://song-loop-earcoach.sociobot.in/privacy/) and [terms](https://song-loop-earcoach.sociobot.in/terms/).
