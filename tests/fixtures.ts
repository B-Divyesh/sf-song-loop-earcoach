export function wavFixture(seconds = 5): Buffer {
  const sampleRate = 44_100;
  const count = Math.floor(sampleRate * seconds);
  const buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + count * 2, 4); buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36);
  buffer.writeUInt32LE(count * 2, 40);
  for (let index = 0; index < count; index += 1) {
    const hz = index < sampleRate * Math.min(1.5, seconds / 2) ? 440 : 493.88;
    buffer.writeInt16LE(Math.round(Math.sin(2 * Math.PI * hz * index / sampleRate) * 18_000), 44 + index * 2);
  }
  return buffer;
}

export async function installMidiInput(page: import("@playwright/test").Page): Promise<void> {
  await page.addInitScript(() => {
    const input = { onmidimessage: null as null | ((event: { data: Uint8Array }) => void) };
    const output = { send: () => { (window as typeof window & { midiOutputUsed: boolean }).midiOutputUsed = true; } };
    const testWindow = window as typeof window & {
      midiOptions?: { sysex: boolean; software: boolean };
      midiOutputUsed: boolean;
      sendTestNote?: (note: number) => void;
    };
    testWindow.midiOutputUsed = false;
    Object.defineProperty(navigator, "requestMIDIAccess", {
      value: async (options: { sysex: boolean; software: boolean }) => {
        testWindow.midiOptions = options;
        return { inputs: new Map([["test", input]]), outputs: new Map([["output", output]]) };
      }
    });
    testWindow.sendTestNote = note => input.onmidimessage?.({ data: new Uint8Array([0x90, note, 100]) });
  });
}
