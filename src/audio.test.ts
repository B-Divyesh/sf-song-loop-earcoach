import { describe, expect, it } from "vitest";
import { autoCorrelate, comparePitchTracks, frequencyToMidi, noteName } from "./audio";

describe("pitch analysis", () => {
  it("finds a clean A4 sine wave", () => {
    const sampleRate = 48_000;
    const samples = new Float32Array(4096);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.7;
    expect(autoCorrelate(samples, sampleRate)).toBeCloseTo(440, -1);
    expect(frequencyToMidi(440)).toBe(69);
    expect(noteName(69)).toBe("A4");
  });

  it("rejects silence rather than inventing pitch", () => {
    expect(autoCorrelate(new Float32Array(2048), 48_000)).toBeNull();
  });

  it("rewards a transposed contour while reporting its pitch center", () => {
    const target = [60, 60, 62, 64, 64, 62, 60];
    const answer = target.map(note => note + 1);
    const result = comparePitchTracks(target, answer);
    expect(result.contourScore).toBeGreaterThan(95);
    expect(result.direction).toBe("sharp");
    expect(result.medianCents).toBe(100);
  });

  it("gives an actionable hint for an unclear answer", () => {
    const result = comparePitchTracks([60, 62, 64, 65], []);
    expect(result.score).toBe(0);
    expect(result.hint).toMatch(/steady pitch|clear note/i);
  });
});
