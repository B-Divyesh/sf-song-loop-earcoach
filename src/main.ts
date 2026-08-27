import "./styles.css";
import { comparePitchTracks, extractPitchTrack, noteName } from "./audio";
import { clearClips, deleteClip, listClips, saveClip } from "./db";
import { captureAndVerifyLicense, checkoutUrl, optimisticallyUnlocked, readLicense, removeLicense, saveLicense } from "./license";
import type { Attempt, ClipRecord, Comparison } from "./types";

type State = {
  clips: ClipRecord[];
  active: ClipRecord | null;
  buffer: AudioBuffer | null;
  busy: boolean;
  recording: boolean;
  mode: "microphone" | "midi";
  comparison: Comparison | null;
  answer: number[];
  message: string;
  error: string;
  unlocked: boolean;
  licenseNote: string;
  updateReady: boolean;
  applyingUpdate: boolean;
};

const state: State = {
  clips: [], active: null, buffer: null, busy: true, recording: false,
  mode: "microphone", comparison: null, answer: [], message: "", error: "",
  unlocked: optimisticallyUnlocked(), licenseNote: "", updateReady: false, applyingUpdate: false
};

let objectUrl = "";
let audioContext: AudioContext | null = null;
let raf = 0;
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let mediaChunks: Blob[] = [];
let midiAccess: { inputs: Map<string, { onmidimessage: ((event: { data: Uint8Array }) => void) | null }> } | null = null;
let midiNotes: number[] = [];
let waveformBase: ImageData | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]!);
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}.${Math.floor((seconds % 1) * 10)}`;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const MIN_CLIP_SECONDS = 5;
const MAX_CLIP_SECONDS = 12;

function getContext(): AudioContext {
  audioContext ??= new AudioContext();
  return audioContext;
}

function setAnnouncement(message: string, error = false): void {
  state.message = error ? "" : message;
  state.error = error ? message : "";
  const live = $("#live-status");
  if (live) {
    live.textContent = message;
    live.className = error ? "status error" : "status";
  }
}

function activeAttempts(): Attempt[] {
  return state.clips.flatMap(clip => clip.attempts);
}

function render(): void {
  const clip = state.active;
  const attempts = activeAttempts();
  const dayCount = new Set(attempts.map(a => new Date(a.at).toDateString())).size;
  const avg = attempts.length ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0;
  app.innerHTML = `
    <header class="site-header">
      <a class="wordmark" href="/" aria-label="Hookback home"><span class="mark" aria-hidden="true">↩</span> Hookback</a>
      <div class="header-state"><span class="offline-dot" aria-hidden="true"></span><span id="network-label">${navigator.onLine ? "Local mode" : "Offline · still working"}</span></div>
    </header>
    <main id="main">
      <section class="intro ${clip ? "intro-compact" : ""}" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="eyebrow">Your song. Your ear. No upload.</p>
          <h1 id="page-title">Catch the hook<br><span>before it gets away.</span></h1>
          <p class="dek">Loop one phrase, play it back from memory, then see where your melodic shape bends. Everything stays on this device.</p>
          ${!clip ? `<button class="primary upload-button" id="clip-trigger"><span>Add a song clip</span><small>Audio files stay private</small></button>
          <input id="clip-file" class="visually-hidden" type="file" tabindex="-1" aria-label="Choose an audio clip" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" />` : ""}
        </div>
        ${!clip ? `<figure class="hero-art"><picture><source srcset="/assets/hookback-ribbon.webp" type="image/webp"><img src="/assets/hookback-ribbon.jpg" width="1152" height="768" alt="An angular paper ribbon folding back through three melodic contours" decoding="async" fetchpriority="high"></picture><figcaption>Hear it. Hold it. Hook it back.</figcaption></figure>` : ""}
      </section>

      <div id="live-status" class="${state.error ? "status error" : "status"}" role="status" aria-live="polite">${escapeHtml(state.error || state.message)}</div>

      ${clip ? practiceMarkup(clip) : emptyMarkup()}
      ${queueMarkup()}
      ${progressMarkup(attempts, dayCount, avg)}
      ${supportMarkup()}
    </main>
    <footer><p>Made for patient ears. Your clips and recordings never leave this device.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><button class="text-button" id="export-data">Export my data</button><button class="text-button" id="import-trigger">Import backup</button></nav><input class="visually-hidden" id="import-data" type="file" tabindex="-1" accept="application/json" aria-label="Choose Hookback backup to import"><p class="generated-note">Abstract artwork generated for Hookback with the Factory image model.</p></footer>
    <div id="update-toast" class="toast" role="status" aria-live="polite" ${state.updateReady ? "" : "hidden"}>Fresh version ready. <button id="apply-update" ${state.applyingUpdate ? "disabled" : ""}>${state.applyingUpdate ? "Updating…" : "Update"}</button></div>
  `;
  bindCommon();
  if (clip) bindPractice();
  drawAll();
}

function emptyMarkup(): string {
  return `<section class="empty-workbench" aria-labelledby="how-title">
    <div><span class="step-no">01</span><h2 id="how-title">Choose a small moment</h2><p>Use a song file you already have. Choose a clear 5–12 second phrase.</p></div>
    <div><span class="step-no">02</span><h2>Sing or play it back</h2><p>Answer through your microphone or a connected MIDI keyboard.</p></div>
    <div><span class="step-no">03</span><h2>Compare the shape</h2><p>Get one achievable next hint—not a wall of theory.</p></div>
  </section>`;
}

function practiceMarkup(clip: ClipRecord): string {
  const duration = clip.duration.toFixed(2);
  return `<section class="workbench" aria-label="Practice workbench">
    <div class="clip-heading"><div><p class="eyebrow">Now looping</p><h2>${escapeHtml(clip.name)}</h2></div><button id="change-clip" class="secondary">Choose another</button></div>
    <div class="stage-grid">
      <section class="stage listen-stage" aria-labelledby="listen-title">
        <header><span class="step-no">01</span><div><p class="stage-kicker">Listen</p><h2 id="listen-title">Cut the phrase</h2></div></header>
        <canvas id="waveform" width="960" height="180" role="img" aria-label="Waveform showing the selected loop region"></canvas>
        <audio id="clip-audio" src="${objectUrl}" preload="metadata"></audio>
        <div class="range-labels"><output id="a-label" for="range-a">A · ${formatTime(clip.a)}</output><output id="b-label" for="range-b">B · ${formatTime(clip.b)}</output></div>
        <div class="dual-range">
          <label for="range-a" class="visually-hidden">Loop start</label><input id="range-a" type="range" min="0" max="${duration}" step="0.05" value="${clip.a}" />
          <label for="range-b" class="visually-hidden">Loop end</label><input id="range-b" type="range" min="0" max="${duration}" step="0.05" value="${clip.b}" />
        </div>
        <div class="button-row"><button id="play-loop" class="primary"><span aria-hidden="true">▶</span> Play loop</button><button id="stop-loop" class="secondary"><span aria-hidden="true">■</span> Stop</button><span class="loop-length">${(clip.b - clip.a).toFixed(1)} sec</span></div>
      </section>
      <section class="stage answer-stage" aria-labelledby="answer-title">
        <header><span class="step-no">02</span><div><p class="stage-kicker">Answer</p><h2 id="answer-title">Hook it back</h2></div></header>
        <div class="mode-switch" role="group" aria-label="Answer input">
          <button class="mode ${state.mode === "microphone" ? "active" : ""}" data-mode="microphone" aria-pressed="${state.mode === "microphone"}">Microphone</button>
          <button class="mode ${state.mode === "midi" ? "active" : ""}" data-mode="midi" aria-pressed="${state.mode === "midi"}">MIDI</button>
        </div>
        <div class="answer-orbit ${state.recording ? "is-recording" : ""}"><span class="orbit-line" aria-hidden="true"></span><strong>${state.recording ? (state.mode === "microphone" ? "Listening…" : "Reading notes…") : "From memory"}</strong><small>${state.mode === "microphone" ? "Sing, hum, or play one note at a time" : "Connect a MIDI keyboard, then play the phrase"}</small></div>
        <div class="button-row">${!state.recording ? `<button id="record-start" class="record-button"><span class="record-dot" aria-hidden="true"></span> ${state.mode === "microphone" ? "Record answer" : "Start MIDI answer"}</button>` : `<button id="record-stop" class="stop-button"><span aria-hidden="true">■</span> Finish answer</button>`}<span class="privacy-note">${state.mode === "microphone" ? "Recorded locally" : "Read-only note input"}</span></div>
      </section>
      <section class="stage compare-stage ${state.comparison ? "has-result" : ""}" aria-labelledby="compare-title">
        <header><span class="step-no">03</span><div><p class="stage-kicker">Compare</p><h2 id="compare-title">See the turn</h2></div></header>
        ${comparisonMarkup()}
      </section>
    </div>
  </section>`;
}

function comparisonMarkup(): string {
  if (!state.comparison || !state.active) return `<div class="waiting"><div class="waiting-lines" aria-hidden="true"><i></i><i></i><i></i></div><p>Your clip and answer contours will meet here.</p></div>`;
  const c = state.comparison;
  const cents = c.medianCents === null ? "Pitch center unavailable" : `${Math.abs(c.medianCents)}¢ ${c.direction === "centered" ? "from center" : c.direction}`;
  return `<div class="score-block"><div class="score-ring" style="--score:${c.score * 3.6}deg"><span><strong>${c.score}</strong><small>match</small></span></div><div><p class="result-label">${c.score >= 75 ? "Hook held" : c.score >= 45 ? "Shape emerging" : "One turn at a time"}</p><p>${c.contourScore}% contour · ${cents}</p></div></div>
    <canvas id="contour" width="600" height="190" role="img" aria-label="Overlay of the clip contour and your answer contour"></canvas>
    <div class="legend"><span class="clip-key">Clip</span><span class="answer-key">Your answer</span></div>
    <aside class="hint"><span aria-hidden="true">→</span><div><strong>Try this next</strong><p>${escapeHtml(c.hint)}</p></div></aside>
    <button id="try-again" class="primary">Try the phrase again</button>`;
}

function queueMarkup(): string {
  return `<section class="queue-section" aria-labelledby="queue-title"><div class="section-heading"><div><p class="eyebrow">Practice queue</p><h2 id="queue-title">Hooks to bring back</h2></div><button class="secondary upload-small" id="queue-trigger">+ Add clip</button><input id="queue-file" class="visually-hidden" type="file" tabindex="-1" aria-label="Choose another audio clip" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" /></div>
    ${state.clips.length ? `<ul class="queue-list">${state.clips.map((item, index) => {
      const latest = item.attempts.at(-1); const active = item.id === state.active?.id;
      return `<li class="queue-item ${active ? "active" : ""}"><button class="queue-open" data-clip="${item.id}" ${active ? 'aria-current="true"' : ""}><span class="queue-index">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(item.name)}</strong><small>${formatTime(item.b - item.a)} loop · ${latest ? `${latest.score}% last match` : "New"}${item.pack ? ` · ${escapeHtml(item.pack)}` : ""}</small></span><span class="queue-arrow" aria-hidden="true">↗</span></button><button class="delete-clip" data-delete="${item.id}" aria-label="Remove ${escapeHtml(item.name)} from queue">×</button></li>`;
    }).join("")}</ul>` : `<div class="queue-empty"><p>No saved hooks yet.</p><span>Add a clip above—your queue is stored only in this browser.</span></div>`}
  </section>`;
}

function progressMarkup(attempts: Attempt[], days: number, avg: number): string {
  if (!state.unlocked) return `<section class="upgrade" aria-labelledby="upgrade-title"><div><p class="eyebrow">Hookback Studio · $19 once</p><h2 id="upgrade-title">Keep practice packs. See the long arc.</h2><p>The free loop, feedback, queue, and data export stay free. Studio adds named practice packs and an all-time progress review. One purchase, no subscription.</p></div><div class="upgrade-actions"><a class="primary" href="${checkoutUrl()}">Get Studio</a><button id="restore-license" class="secondary">Restore license</button></div><form id="license-form" class="license-form" hidden><label for="license-token">License token</label><div><input id="license-token" autocomplete="off" spellcheck="false"><button class="primary" type="submit">Verify</button></div></form><p class="license-note">${escapeHtml(state.licenseNote)}</p></section>`;
  const recent = [...attempts].sort((a, b) => a.at - b.at).slice(-12);
  return `<section class="progress" aria-labelledby="progress-title"><div class="section-heading"><div><p class="eyebrow">Studio unlocked</p><h2 id="progress-title">The long arc</h2></div><button id="manage-license" class="text-button">Remove license</button></div><div class="stat-row"><div><strong>${attempts.length}</strong><span>answers</span></div><div><strong>${days}</strong><span>practice days</span></div><div><strong>${avg}%</strong><span>average match</span></div></div><div class="progress-bars" aria-label="Recent match scores">${recent.length ? recent.map(a => `<i style="--h:${Math.max(8, a.score)}%" title="${a.score}%"></i>`).join("") : `<p>Your recent scores will collect here.</p>`}</div>${state.active ? `<form id="pack-form" class="pack-form"><label for="pack-name">Practice pack for this hook</label><div><input id="pack-name" value="${escapeHtml(state.active.pack || "")}" maxlength="32" placeholder="e.g. Friday guitar"><button class="secondary">Save pack</button></div></form>` : ""}</section>`;
}

function supportMarkup(): string {
  return `<section class="support" aria-labelledby="support-title"><p class="eyebrow">A kinder drill</p><h2 id="support-title">What Hookback hears—and what it doesn’t</h2><div class="support-grid"><p><strong>It follows pitch shape.</strong> Feedback compares the rise and fall of a clear, single-note melody. Chords and dense mixes can confuse the estimate.</p><p><strong>It is not transcription.</strong> Use the score as a compass, then trust your ears. Tight loops and humming work best.</p><p><strong>It keeps your music private.</strong> Audio, answers, and history are processed locally. Nothing is uploaded by Hookback.</p></div></section>`;
}

function bindCommon(): void {
  $("#clip-trigger")?.addEventListener("click", () => $("#clip-file")?.click());
  $("#clip-file")?.addEventListener("change", event => void receiveFile((event.target as HTMLInputElement).files?.[0]));
  $("#queue-trigger")?.addEventListener("click", () => $("#queue-file")?.click());
  $("#queue-file")?.addEventListener("change", event => void receiveFile((event.target as HTMLInputElement).files?.[0]));
  $("#change-clip")?.addEventListener("click", () => $("#queue-file")?.click());
  document.querySelectorAll<HTMLElement>("[data-clip]").forEach(button => button.addEventListener("click", () => void activateClip(button.dataset.clip!)));
  document.querySelectorAll<HTMLElement>("[data-delete]").forEach(button => button.addEventListener("click", () => void removeClip(button.dataset.delete!)));
  $("#export-data")?.addEventListener("click", () => void exportData());
  $("#import-trigger")?.addEventListener("click", () => $("#import-data")?.click());
  $("#import-data")?.addEventListener("change", event => void importData((event.target as HTMLInputElement).files?.[0]));
  $("#restore-license")?.addEventListener("click", () => {
    const form = $("#license-form") as HTMLFormElement | null;
    if (form) { form.hidden = false; $("#license-token")?.focus(); }
  });
  $("#license-form")?.addEventListener("submit", event => void restoreLicense(event));
  $("#manage-license")?.addEventListener("click", () => {
    if (confirm("Remove the Studio license from this device? Your practice data will stay.")) {
      removeLicense(); state.unlocked = false; state.licenseNote = "License removed from this device."; render();
    }
  });
  $("#apply-update")?.addEventListener("click", applyServiceWorkerUpdate);
  $("#pack-form")?.addEventListener("submit", event => void savePack(event));
}

function bindPractice(): void {
  $("#play-loop")?.addEventListener("click", playLoop);
  $("#stop-loop")?.addEventListener("click", stopLoop);
  $("#range-a")?.addEventListener("input", updateRange);
  $("#range-b")?.addEventListener("input", updateRange);
  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach(button => button.addEventListener("click", () => {
    state.mode = button.dataset.mode as State["mode"]; state.comparison = null; state.answer = []; render();
  }));
  $("#record-start")?.addEventListener("click", () => void startAnswer());
  $("#record-stop")?.addEventListener("click", () => void finishAnswer());
  $("#try-again")?.addEventListener("click", () => { state.comparison = null; state.answer = []; render(); $("#record-start")?.focus(); });
}

async function receiveFile(file?: File): Promise<void> {
  if (!file) return;
  if (!file.type.startsWith("audio/") && !/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name)) {
    setAnnouncement("That doesn’t look like an audio file. Choose MP3, WAV, M4A, AAC, OGG, or FLAC.", true); return;
  }
  if (file.size > 200 * 1024 * 1024) {
    setAnnouncement("That file is over 200 MB. Trim or compress it before adding it.", true); return;
  }
  state.busy = true;
  setAnnouncement("Reading the clip locally…");
  try {
    const bytes = await file.arrayBuffer();
    const buffer = await getContext().decodeAudioData(bytes.slice(0));
    if (!Number.isFinite(buffer.duration)) throw new Error("undecodable");
    if (buffer.duration < MIN_CLIP_SECONDS || buffer.duration > MAX_CLIP_SECONDS) {
      setAnnouncement("Choose a 5–12 second practice phrase so Hookback can make a useful loop.", true);
      return;
    }
    const a = 0;
    const b = Math.min(buffer.duration, 10);
    const clip: ClipRecord = {
      id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ""), type: file.type || "audio/mpeg",
      blob: file, duration: buffer.duration, createdAt: Date.now(), updatedAt: Date.now(), a, b,
      targetPitches: extractPitchTrack(buffer, a, b), attempts: [], nextDue: Date.now()
    };
    await saveClip(clip);
    state.clips = [clip, ...state.clips];
    state.active = clip;
    state.buffer = buffer;
    state.comparison = null;
    setObjectUrl(file);
    state.message = `Ready. A ${formatTime(b - a)} loop is selected.`;
    state.error = "";
  } catch {
    state.error = "I couldn’t decode that audio file in this browser. Try WAV, MP3, or M4A.";
    state.message = "";
  } finally {
    state.busy = false;
    render();
  }
}

function setObjectUrl(blob: Blob): void {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(blob);
  waveformBase = null;
}

async function activateClip(id: string): Promise<void> {
  stopLoop();
  const clip = state.clips.find(item => item.id === id);
  if (!clip) return;
  try {
    state.message = "Opening your saved hook…"; state.error = ""; render();
    const bytes = await clip.blob.arrayBuffer();
    state.buffer = await getContext().decodeAudioData(bytes.slice(0));
    state.active = clip; state.comparison = null; state.answer = [];
    setObjectUrl(clip.blob);
    state.message = "Hook ready.";
  } catch {
    state.error = "This saved clip can’t be decoded now. Export your data, then try importing it in an updated browser.";
  }
  render();
  window.scrollTo({ top: $(".workbench")?.getBoundingClientRect().top ?? 0, behavior: "smooth" });
}

async function removeClip(id: string): Promise<void> {
  const clip = state.clips.find(item => item.id === id);
  if (!clip || !confirm(`Remove “${clip.name}” and its ${clip.attempts.length} saved answer${clip.attempts.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
  await deleteClip(id);
  state.clips = state.clips.filter(item => item.id !== id);
  if (state.active?.id === id) {
    state.active = null; state.buffer = null; state.comparison = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = "";
  }
  state.message = `Removed ${clip.name}.`;
  render();
}

function playLoop(): void {
  const audio = $("#clip-audio") as HTMLAudioElement | null;
  if (!audio || !state.active) return;
  audio.currentTime = state.active.a;
  void audio.play().then(() => {
    setAnnouncement("Loop playing.");
    cancelAnimationFrame(raf);
    const tick = () => {
      if (!state.active || audio.paused) return;
      if (audio.currentTime >= state.active.b || audio.currentTime < state.active.a) audio.currentTime = state.active.a;
      drawWaveform(audio.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }).catch(() => setAnnouncement("Playback was blocked. Press Play loop once more.", true));
}

function stopLoop(): void {
  cancelAnimationFrame(raf);
  const audio = $("#clip-audio") as HTMLAudioElement | null;
  if (audio) { audio.pause(); if (state.active) audio.currentTime = state.active.a; }
  drawWaveform();
}

let rangeTimer = 0;
function updateRange(): void {
  if (!state.active) return;
  const aInput = $("#range-a") as HTMLInputElement;
  const bInput = $("#range-b") as HTMLInputElement;
  let a = Number(aInput.value);
  let b = Number(bInput.value);
  if (a > b - 0.5) {
    if (document.activeElement === aInput) a = b - 0.5; else b = a + 0.5;
  }
  a = clamp(a, 0, state.active.duration - 0.5);
  b = clamp(b, a + 0.5, state.active.duration);
  aInput.value = String(a); bInput.value = String(b);
  state.active.a = a; state.active.b = b; state.active.updatedAt = Date.now();
  $("#a-label")!.textContent = `A · ${formatTime(a)}`;
  $("#b-label")!.textContent = `B · ${formatTime(b)}`;
  $(".loop-length")!.textContent = `${(b - a).toFixed(1)} sec`;
  state.comparison = null;
  drawWaveform();
  window.clearTimeout(rangeTimer);
  rangeTimer = window.setTimeout(async () => {
    if (state.active && state.buffer) {
      state.active.targetPitches = extractPitchTrack(state.buffer, a, b);
      await saveClip(state.active);
      setAnnouncement(state.active.targetPitches.length < 3 ? "Pitch is hard to isolate here. Try a clearer or tighter phrase." : "Loop points saved.", state.active.targetPitches.length < 3);
    }
  }, 320);
}

async function startAnswer(): Promise<void> {
  if (!state.active) return;
  stopLoop();
  state.error = ""; state.message = "";
  if (state.mode === "microphone") await startMicrophone(); else await startMidi();
}

async function startMicrophone(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    setAnnouncement("Microphone recording isn’t available here. Try MIDI or use a current browser over HTTPS.", true); return;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
    mediaChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = event => { if (event.data.size) mediaChunks.push(event.data); };
    mediaRecorder.start();
    state.recording = true; state.message = "Recording is on. Your audio stays in this browser."; render();
  } catch {
    setAnnouncement("Microphone access was blocked. Allow it in browser settings, or switch to MIDI.", true);
  }
}

async function startMidi(): Promise<void> {
  const requestMIDIAccess = (navigator as Navigator & { requestMIDIAccess?: (options: { sysex: boolean; software: boolean }) => Promise<typeof midiAccess> }).requestMIDIAccess;
  if (!requestMIDIAccess) { setAnnouncement("Web MIDI isn’t available in this browser. Use microphone mode or a Chromium-based browser.", true); return; }
  try {
    midiAccess = await requestMIDIAccess.call(navigator, { sysex: false, software: false });
    if (!midiAccess || midiAccess.inputs.size === 0) { setAnnouncement("No MIDI input found. Connect a keyboard and try again; Hookback never writes to it.", true); return; }
    midiNotes = [];
    midiAccess.inputs.forEach(input => {
      input.onmidimessage = event => {
        const [status, note, velocity] = event.data;
        if ((status & 0xf0) === 0x90 && velocity > 0) {
          midiNotes.push(note);
          const orbit = $(".answer-orbit small");
          if (orbit) orbit.textContent = `${midiNotes.length} note${midiNotes.length === 1 ? "" : "s"} · latest ${noteName(note)}`;
        }
      };
    });
    state.recording = true; state.message = "MIDI input armed. Play the phrase, then finish."; render();
  } catch {
    setAnnouncement("MIDI access was blocked. Allow it in browser settings, or switch to microphone.", true);
  }
}

async function finishAnswer(): Promise<void> {
  if (!state.recording) return;
  state.recording = false;
  if (state.mode === "microphone") await finishMicrophone();
  else {
    midiAccess?.inputs.forEach(input => { input.onmidimessage = null; });
    await scoreAnswer(midiNotes);
  }
}

async function finishMicrophone(): Promise<void> {
  if (!mediaRecorder) return;
  const stopped = new Promise<void>(resolve => { mediaRecorder!.onstop = () => resolve(); });
  mediaRecorder.stop();
  await stopped;
  mediaStream?.getTracks().forEach(track => track.stop());
  mediaStream = null;
  try {
    const blob = new Blob(mediaChunks, { type: mediaRecorder.mimeType });
    const buffer = await getContext().decodeAudioData(await blob.arrayBuffer());
    await scoreAnswer(extractPitchTrack(buffer));
  } catch {
    state.error = "The answer recording couldn’t be read. Try again, a little closer to the microphone."; render();
  } finally {
    mediaRecorder = null; mediaChunks = [];
  }
}

async function scoreAnswer(answer: number[]): Promise<void> {
  if (!state.active) return;
  state.answer = answer;
  state.comparison = comparePitchTracks(state.active.targetPitches, answer);
  const attempt: Attempt = {
    id: crypto.randomUUID(), at: Date.now(), mode: state.mode, score: state.comparison.score,
    contourScore: state.comparison.contourScore, medianCents: state.comparison.medianCents,
    answerPitches: answer.slice(0, 128)
  };
  state.active.attempts.push(attempt);
  state.active.updatedAt = Date.now();
  state.active.nextDue = Date.now() + (state.comparison.score >= 75 ? 2 : 1) * 86_400_000;
  await saveClip(state.active);
  state.clips = state.clips.map(clip => clip.id === state.active!.id ? state.active! : clip).sort((a, b) => a.nextDue - b.nextDue);
  state.message = answer.length >= 3 ? "Answer compared and saved." : "No clear pitch was found; the attempt is saved so you can see the practice count.";
  render();
  $(".compare-stage")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function drawAll(): void {
  drawWaveform();
  drawContour();
}

function drawWaveform(playhead?: number): void {
  const canvas = $("#waveform") as HTMLCanvasElement | null;
  if (!canvas || !state.active || !state.buffer) return;
  const context = canvas.getContext("2d")!;
  const { width, height } = canvas;
  if (playhead !== undefined && waveformBase) {
    context.putImageData(waveformBase, 0, 0);
    const x = (playhead / state.active.duration) * width;
    context.fillStyle = "#ff7a68"; context.fillRect(x - 1, 0, 3, height);
    return;
  }
  const data = state.buffer.getChannelData(0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#151d19";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#2c3831";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += width / 12) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
  const aX = (state.active.a / state.active.duration) * width;
  const bX = (state.active.b / state.active.duration) * width;
  context.fillStyle = "rgba(201,255,72,.09)";
  context.fillRect(aX, 0, bX - aX, height);
  const stride = Math.max(1, Math.floor(data.length / width));
  context.beginPath();
  for (let x = 0; x < width; x += 1) {
    let min = 1; let max = -1;
    for (let i = 0; i < stride; i += 1) { const value = data[x * stride + i] ?? 0; min = Math.min(min, value); max = Math.max(max, value); }
    context.moveTo(x, (1 + min) * height / 2);
    context.lineTo(x, (1 + max) * height / 2);
  }
  context.strokeStyle = "#b9bdb2"; context.globalAlpha = 0.72; context.stroke(); context.globalAlpha = 1;
  context.fillStyle = "#c9ff48"; context.fillRect(aX, 0, 3, height); context.fillRect(bX - 3, 0, 3, height);
  waveformBase = context.getImageData(0, 0, width, height);
  if (playhead !== undefined) {
    const x = (playhead / state.active.duration) * width;
    context.fillStyle = "#ff7a68"; context.fillRect(x - 1, 0, 3, height);
  }
}

function drawContour(): void {
  const canvas = $("#contour") as HTMLCanvasElement | null;
  if (!canvas || !state.active || !state.answer.length) return;
  const context = canvas.getContext("2d")!;
  const { width, height } = canvas;
  context.fillStyle = "#151d19"; context.fillRect(0, 0, width, height);
  context.strokeStyle = "#2c3831"; context.lineWidth = 1;
  for (let y = 25; y < height; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
  const tracks = [state.active.targetPitches, state.answer].filter(track => track.length);
  const base = Math.min(...tracks.flat());
  const top = Math.max(...tracks.flat());
  tracks.forEach((track, trackIndex) => {
    context.beginPath();
    track.forEach((value, index) => {
      const x = 18 + (index / Math.max(1, track.length - 1)) * (width - 36);
      const y = height - 18 - ((value - base) / Math.max(2, top - base)) * (height - 36);
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.strokeStyle = trackIndex ? "#7cdde2" : "#c9ff48";
    context.lineWidth = 5; context.lineJoin = "round"; context.lineCap = "round"; context.stroke();
  });
}

async function exportData(): Promise<void> {
  try {
    setAnnouncement("Preparing your private backup…");
    const records = await Promise.all(state.clips.map(async clip => ({
      ...clip,
      blob: { type: clip.blob.type, data: arrayBufferToBase64(await clip.blob.arrayBuffer()) }
    })));
    const payload = JSON.stringify({ format: "hookback-backup", version: 1, exportedAt: new Date().toISOString(), clips: records });
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `hookback-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnouncement("Backup exported. It contains the audio clips you chose, so keep it private.");
  } catch {
    setAnnouncement("The backup couldn’t be created. Your saved practice is unchanged.", true);
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function base64ToBlob(data: string, type: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

async function importData(file?: File): Promise<void> {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text()) as { format: string; version: number; clips: Array<Omit<ClipRecord, "blob"> & { blob: { type: string; data: string } }> };
    if (parsed.format !== "hookback-backup" || parsed.version !== 1 || !Array.isArray(parsed.clips)) throw new Error("format");
    if (!confirm(`Import ${parsed.clips.length} hook${parsed.clips.length === 1 ? "" : "s"}? This replaces the current local queue.`)) return;
    const imported = parsed.clips.map(item => ({ ...item, blob: base64ToBlob(item.blob.data, item.blob.type) })) as ClipRecord[];
    await clearClips();
    await Promise.all(imported.map(saveClip));
    state.clips = imported.sort((a, b) => a.nextDue - b.nextDue);
    state.active = null; state.buffer = null; state.comparison = null;
    state.message = `Imported ${imported.length} hook${imported.length === 1 ? "" : "s"}.`;
    render();
  } catch {
    setAnnouncement("That file isn’t a valid Hookback backup. Nothing was changed.", true);
  }
}

async function restoreLicense(event: Event): Promise<void> {
  event.preventDefault();
  const token = ($("#license-token") as HTMLInputElement).value.trim();
  if (!token) { setAnnouncement("Paste the complete license token first.", true); return; }
  saveLicense(token);
  state.licenseNote = "Checking the license…"; render();
  const result = await captureAndVerifyLicense(true);
  state.unlocked = result.valid;
  state.licenseNote = result.valid ? "Studio restored on this device." : result.offline ? "Couldn’t reach license verification. You can keep using the free practice loop." : "That license is not active for Hookback.";
  render();
}

async function savePack(event: Event): Promise<void> {
  event.preventDefault();
  if (!state.active || !state.unlocked) return;
  state.active.pack = ($("#pack-name") as HTMLInputElement).value.trim();
  state.active.updatedAt = Date.now();
  await saveClip(state.active);
  state.message = state.active.pack ? `Saved to “${state.active.pack}”.` : "Removed from its practice pack.";
  render();
}

function bindNetwork(): void {
  const update = () => {
    const label = $("#network-label");
    if (label) label.textContent = navigator.onLine ? "Local mode" : "Offline · still working";
    document.body.classList.toggle("offline", !navigator.onLine);
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    serviceWorkerRegistration = registration;
    const showUpdate = () => {
      if (!navigator.serviceWorker.controller || state.updateReady) return;
      state.updateReady = true;
      state.applyingUpdate = false;
      render();
    };
    const watchInstallingWorker = (worker: ServiceWorker | null) => {
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") showUpdate();
      });
    };
    if (registration.waiting) showUpdate();
    registration.addEventListener("updatefound", () => {
      watchInstallingWorker(registration.installing);
    });
  } catch {
    // The app remains fully usable online when service-worker registration is unavailable.
  }
}

function applyServiceWorkerUpdate(): void {
  const waiting = serviceWorkerRegistration?.waiting;
  if (!waiting) {
    state.updateReady = false;
    state.applyingUpdate = false;
    setAnnouncement("This version is already active.");
    render();
    return;
  }
  state.applyingUpdate = true;
  render();
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
  waiting.postMessage({ type: "SKIP_WAITING" });
}

async function init(): Promise<void> {
  try {
    state.clips = await listClips();
  } catch {
    state.error = "Local storage isn’t available. You can practice now, but this browser may not keep the queue.";
  }
  state.busy = false;
  render();
  bindNetwork();
  void registerServiceWorker();
  const hadToken = Boolean(readLicense());
  const verdict = await captureAndVerifyLicense();
  state.unlocked = verdict.valid;
  if (hadToken && !verdict.valid && !verdict.offline) state.licenseNote = "License no longer active. The free practice loop is still yours.";
  if (verdict.offline && optimisticallyUnlocked()) state.unlocked = true;
  render();
}

void init();
