# Hookback visual thesis

## Direction: generative geometry as musical memory

Hookback turns a short sound into a shape the player can remember. The visual
language is built from **loop ribbons**: repeating angular contours, offset
echoes, beat dots, and crop marks. They resemble a melody drawn by hand on
graph paper without pretending to be exact notation. The geometry explains the
product's job—listen, return, compare—rather than acting as filler.

The interface is intentionally single-mode and dark: a late-night practice
desk made of blue-black ink, warm paper, acid-lime listening marks, and coral
recording marks. Every active state also carries a word or icon, never color
alone.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| ink | `#121815` | App background; near-black green like manuscript ink |
| ink-raised | `#1C2520` | Work surfaces |
| paper | `#F2F0E6` | Primary text |
| paper-muted | `#B9BDB2` | Secondary text (≥ 4.5:1 on ink) |
| pulse | `#C9FF48` | Listen/play/focus/action |
| pulse-ink | `#172000` | Text on pulse |
| coral | `#FF7A68` | Record/attention |
| sky | `#7CDDE2` | Comparison and MIDI |
| success | `#A5E887` | Positive feedback |
| warning | `#FFD36D` | Recoverable attention |
| danger | `#FF8C82` | Errors |
| rule | `#3E4942` | Boundaries and disabled controls |

Contrast is designed for the single explicit dark treatment. The paper and
muted-paper pairs exceed 4.5:1; the pulse fill uses dark ink text.

## Type

- Display: `Arial Black`, `Arial Narrow Bold`, system sans-serif. The tight,
  emphatic capitals feel like rehearsal tape labels and require no font
  download.
- Working text: `Inter`-like system stack (`ui-sans-serif`, `system-ui`,
  `Segoe UI`, sans-serif). It stays neutral and legible around dense controls.
- Numeric timing and pitch values use `ui-monospace` with tabular figures.

Scale: 14 / 16 / 20 / 28 / clamp(40–72) px. Body text is 16px minimum.
Measure is capped near 68 characters.

## Spacing and shape

An 8px base rhythm with 4px optical adjustments. Primary sections use 24–40px
gaps; controls have at least 44px targets and 8px separation. Corners are
mostly clipped (`2px`) rather than softly rounded. Angled pseudo-elements and
offset outlines create depth. On phones, the three-stage rail becomes a
vertical sequence and supplementary explanation collapses; recording controls
remain above the fold after a clip is selected.

## Interaction grammar

- Pulse-lime means “hear or proceed.” Coral means “the microphone is live.”
- A/B handles and the moving playhead are the only time-position controls.
- Each completed step stamps its numbered lozenge and advances the next one.
- Comparison draws two compact contour lines (clip and answer) on the same
  coordinate field; plain-language feedback is always adjacent.
- Buttons depress by 2px with their offset shadow collapsing. Focus is a
  double pulse/ink outline.

## Motion policy

UI transitions last 160–240ms and use only opacity and transform. The hero
contour drifts once on entry, and the live playhead moves only during playback.
No decoration loops indefinitely. With `prefers-reduced-motion`, entrances and
button transforms become instant, while state changes remain visible through
color, text, and shape.

## Original asset plan and provenance

One generated editorial still, `hookback-ribbon.webp`, supports the empty
state/first-run explanation. It is an abstract paper sculpture of one melody
folding back into itself—no performers, brands, notation, or UI mockup. The
remaining marks, icons, contour charts, and PWA icons are authored in CSS/SVG
or canvas as functional interface elements.

Prompt sheet:

> Use case: stylized-concept. Asset type: PWA onboarding illustration. Primary
> request: an abstract melody visualized as a single folded loop ribbon returning
> to its origin. Scene/backdrop: dark ink-black studio void with sparse graph
> paper registration marks. Subject: tactile angular ribbon, three echo contours,
> and a few beat-like discs. Style/medium: premium editorial paper sculpture,
> generative geometry, slightly imperfect cut edges, no photoreal people.
> Composition: wide 3:2 landscape, subject centered-right with calm negative
> space, strong readable silhouette. Lighting: raking softbox light, intimate
> late-night rehearsal mood. Palette: near-black green, bone paper, acid lime,
> coral, pale cyan. Materials: uncoated paper, screen-printed ink, subtle grain.
> Constraints: no text, no letters, no music notation, no instruments, no
> logos, no watermark, no brands, no UI screenshot, no gradients.

Generation: Azure AI Foundry factory image deployment via
`/opt/fleet/lib/gen-image.sh`, generated 2026-08-27. Original for Hookback;
retained prompt sidecar in `assets/src/` and disclosed in the footer.
