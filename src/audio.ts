import type { Comparison } from "./types";

const MIN_HZ = 65;
const MAX_HZ = 1200;

export function autoCorrelate(samples: Float32Array, sampleRate: number): number | null {
  let rms = 0;
  for (const sample of samples) rms += sample * sample;
  rms = Math.sqrt(rms / samples.length);
  if (rms < 0.012) return null;

  const minLag = Math.floor(sampleRate / MAX_HZ);
  const maxLag = Math.min(Math.floor(sampleRate / MIN_HZ), samples.length / 2);
  let bestLag = -1;
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let corr = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < samples.length - lag; i += 1) {
      corr += samples[i] * samples[i + lag];
      normA += samples[i] * samples[i];
      normB += samples[i + lag] * samples[i + lag];
    }
    const normalized = corr / Math.sqrt(normA * normB || 1);
    if (normalized > best) {
      best = normalized;
      bestLag = lag;
    }
  }
  if (best < 0.72 || bestLag < 0) return null;
  return sampleRate / bestLag;
}

export function frequencyToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function extractPitchTrack(buffer: AudioBuffer, start = 0, end = buffer.duration): number[] {
  const source = buffer.getChannelData(0);
  const frame = 2048;
  const step = Math.max(512, Math.floor(buffer.sampleRate * 0.06));
  const first = Math.max(0, Math.floor(start * buffer.sampleRate));
  const last = Math.min(source.length - frame, Math.floor(end * buffer.sampleRate));
  const values: number[] = [];
  for (let offset = first; offset <= last; offset += step) {
    const hz = autoCorrelate(source.subarray(offset, offset + frame), buffer.sampleRate);
    if (hz) values.push(frequencyToMidi(hz));
  }
  return cleanTrack(values);
}

export function cleanTrack(values: number[]): number[] {
  if (!values.length) return [];
  const result: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const neighborhood = values.slice(Math.max(0, i - 2), i + 3).sort((a, b) => a - b);
    const median = neighborhood[Math.floor(neighborhood.length / 2)];
    if (Math.abs(values[i] - median) < 4) result.push(values[i]);
  }
  return result;
}

function sampleTo(track: number[], length: number): number[] {
  if (!track.length || length <= 0) return [];
  if (length === 1) return [track[0]];
  return Array.from({ length }, (_, i) => {
    const index = (i / (length - 1)) * (track.length - 1);
    const lo = Math.floor(index);
    const hi = Math.min(track.length - 1, lo + 1);
    const mix = index - lo;
    return track[lo] * (1 - mix) + track[hi] * mix;
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function comparePitchTracks(targetRaw: number[], answerRaw: number[]): Comparison {
  if (targetRaw.length < 3) {
    return { score: 0, contourScore: 0, medianCents: null, direction: "unknown", hint: "The clip’s melody wasn’t clear enough. Tighten A/B around one exposed phrase." };
  }
  if (answerRaw.length < 3) {
    return { score: 0, contourScore: 0, medianCents: null, direction: "unknown", hint: "I couldn’t find a steady pitch. Try one clear note at a time, closer to the mic." };
  }
  const n = Math.min(48, Math.max(8, Math.min(targetRaw.length, answerRaw.length)));
  const target = sampleTo(targetRaw, n);
  const answer = sampleTo(answerRaw, n);
  const targetBase = median(target);
  const answerBase = median(answer);
  const contourDistances = target.map((v, i) => Math.abs((v - targetBase) - (answer[i] - answerBase)));
  const contourMean = contourDistances.reduce((a, b) => a + b, 0) / n;
  const contourScore = Math.max(0, Math.round(100 * Math.exp(-contourMean / 2.5)));
  const signed = answer.map((v, i) => (v - target[i]) * 100);
  const cents = median(signed);
  const pitchScore = Math.max(0, Math.round(100 * Math.exp(-Math.abs(cents) / 260)));
  const score = Math.round(contourScore * 0.7 + pitchScore * 0.3);
  const direction = Math.abs(cents) < 30 ? "centered" : cents > 0 ? "sharp" : "flat";
  let hint = "The shape is landing. Repeat it once more without the clip.";
  if (contourScore < 45) {
    const jumps = contourDistances.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const zone = jumps[0].i / n;
    hint = `Focus on the ${zone < 0.34 ? "opening" : zone < 0.67 ? "middle turn" : "ending"}; that is where your contour differs most.`;
  } else if (direction === "sharp") hint = `Your shape matches, but your center sits about ${Math.round(Math.abs(cents))} cents high. Start a touch lower.`;
  else if (direction === "flat") hint = `Your shape matches, but your center sits about ${Math.round(Math.abs(cents))} cents low. Start a touch higher.`;
  return { score, contourScore, medianCents: Math.round(cents), direction, hint };
}

export function noteName(midi: number): string {
  const names = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const rounded = Math.round(midi);
  return `${names[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}
