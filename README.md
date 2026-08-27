# Hookback

Hookback is a private, offline-ready ear coach for self-taught instrumentalists.
Choose a short moment from a song file you already have, loop it, sing or play
it back through a microphone or MIDI keyboard, and get a comparison of melodic
shape plus one concrete next hint. It is deliberately not a streaming importer
or full-song transcription service.

Live: <https://song-loop-earcoach.sociobot.in>

## What ships

- Local audio import with adjustable A/B looping
- On-device monophonic pitch and contour estimation
- Microphone recording with a visible recording state, plus read-only Web MIDI
- IndexedDB practice queue and attempt history that survive restarts
- User-owned JSON export/import, including the selected audio files
- Installable PWA shell with offline fallback
- Free core; the optional $19 one-time Studio license adds practice packs and
  an all-time progress review through the Sociobot billing API

No clip or microphone recording is uploaded. Browser audio analysis works best
with a clear, single-note melody; chords and dense mixes are intentionally
reported as uncertain rather than presented as exact transcription.

## Run and verify

Requires Node 20.19+.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The exact production build command is `npm run build`; deploy the generated
`dist/` directory with `dist/index.html` at its root. Production builds use the
registered Sociobot API by default. For an explicitly configured staging build,
set `VITE_BILLING_BASE=https://pilot-api.sociobot.in/api/v1`.

Microphone and service-worker features require HTTPS (localhost is permitted).
For a real test, import a 5–12 second WAV/MP3 phrase (shorter and longer clips
are rejected so the practice unit stays useful), adjust A/B, play it, record an
answer, and confirm the queue and comparison survive a refresh. MIDI needs a
browser with Web MIDI support and uses inputs only (`sysex: false`).

## Structure

- `src/audio.ts` — local pitch extraction and contour comparison
- `src/db.ts` — IndexedDB persistence
- `src/license.ts` — cached Sociobot license verification
- `public/sw.js` — versioned app-shell/runtime cache
- `.factory/design.md` — product-specific visual system and asset provenance
- `.factory/handoff.md` — verification record and known limitations

Hookback is MIT licensed. See [LICENSE](LICENSE), and the app’s `/privacy/` and
`/terms/` pages for user-data and purchase details.
