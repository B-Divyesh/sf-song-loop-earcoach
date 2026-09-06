# Hookback demo sandbox

## Entry points

- Live: <https://song-loop-earcoach.sociobot.in/demo>
- Local: <http://127.0.0.1:4173/demo>
- Query alias: `/?demo=1`

The home page has a visible **Try it with sample data** link.
One click opens the demo with no account, file, microphone, or MIDI device.

## Sample data

The app creates an original eight-second single-note phrase in the browser.
Its notes form an A3, C♯4, E4, C♯4, B3, A3 phrase.
The sample includes one saved answer, a match score, pitch shape, and next step.

## Isolation and reset

Demo records use the `hookback-demo` IndexedDB database.
Real records use the separate `hookback-local` IndexedDB database.
License values are not read or verified in demo mode.

The persistent banner says **Demo — sample data, nothing is saved**.
Its **Reset demo** action clears `hookback-demo` and seeds the original sample.
Its **Start for real** action clears `hookback-demo` before opening `/`.
Other local links also clear demo data when they leave `/demo`.
No demo action reads, writes, exports, imports, or deletes `hookback-local`.
