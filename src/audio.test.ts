import { describe, expect, it } from "vitest";
import { autoCorrelate, comparePitchTracks, extractPitchTrack, frequencyToMidi, noteName } from "./audio";

describe("pitch analysis", () => {
  it("finds a clean A4 sine wave", () => {
    const sampleRate = 48_000;
    const samples = new Float32Array(4096);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.7;
    expect(autoCorrelate(samples, sampleRate)).toBeCloseTo(440, -1);
    expect(frequencyToMidi(440)).toBe(69);
    expect(noteName(69)).toBe("A4");
  });

  it("extracts A4 and B4 from production-sized frames without octave errors", () => {
    const sampleRate = 44_100;
    const samples = new Float32Array(sampleRate * 5);
    for (let i = 0; i < samples.length; i += 1) {
      const hz = i < sampleRate * 1.5 ? 440 : 493.88;
      samples[i] = Math.sin(2 * Math.PI * hz * i / sampleRate) * 0.55;
    }
    const buffer = {
      duration: 5,
      sampleRate,
      getChannelData: () => samples
    } as unknown as AudioBuffer;
    const track = extractPitchTrack(buffer);
    const aNotes = track.slice(0, 14);
    const bNotes = track.slice(-30);

    expect(track.length).toBeGreaterThan(50);
    expect(aNotes.every(note => Math.abs(note - 69) < 0.2)).toBe(true);
    expect(bNotes.every(note => Math.abs(note - 71) < 0.2)).toBe(true);
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
