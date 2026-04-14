// Web Audio API-synthesized SFX. No external asset files — every sound is
// generated from oscillators + envelopes at runtime, so the build stays small
// and platform uploads don't need audio uploads.
//
// Notes on reliability:
// - Browsers require a user gesture to start an AudioContext. We proactively
//   "unlock" it on the first pointerdown/touchstart/keydown event, not on the
//   first SFX call — this avoids the race where resume() is still async when
//   we schedule the oscillator.
// - A single master gain node lets us scale the whole output.
// - Individual envelopes can stay tight; master gain controls loudness.

const MUTE_KEY = 'beerfriends_muted';
const MASTER_LEVEL = 0.55;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;
let muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === 'true'; }
  catch { return false; }
})();
const listeners = new Set<(m: boolean) => void>();

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_LEVEL;
    master.connect(ctx.destination);
    return ctx;
  } catch { return null; }
}

/**
 * Wire a one-shot unlock on any user interaction. Must be called once at app
 * startup — subsequent SFX calls then play immediately without the suspended-
 * context race.
 */
export function initAudio() {
  if (unlocked) return;
  const unlock = () => {
    const c = ensureCtx();
    if (!c) return;
    // resume() returns a promise, but even synchronous handling is enough for
    // modern browsers to transition state. We flip our flag on the promise.
    if (c.state === 'suspended') {
      c.resume().then(() => { unlocked = true; }).catch(() => {});
    } else {
      unlocked = true;
    }
  };
  const opts = { passive: true } as AddEventListenerOptions;
  const evts: (keyof DocumentEventMap)[] = ['pointerdown', 'touchstart', 'keydown', 'click'];
  const handler = () => {
    unlock();
    evts.forEach(e => document.removeEventListener(e, handler));
  };
  evts.forEach(e => document.addEventListener(e, handler, opts));
}

export function isMuted() { return muted; }

export function setMuted(next: boolean) {
  muted = next;
  try { localStorage.setItem(MUTE_KEY, String(muted)); } catch {}
  if (master) master.gain.value = muted ? 0 : MASTER_LEVEL;
  listeners.forEach(l => l(muted));
}

export function toggleMute() { setMuted(!muted); return muted; }

export function subscribeMute(fn: (m: boolean) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// ── SFX primitives ──

type EnvOpts = { attack?: number; decay?: number; release?: number; peak?: number };

function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  env: EnvOpts = {},
  filterFreq?: number,
) {
  const c = ensureCtx();
  if (!c || !master) return;
  // Best-effort resume; safe to call repeatedly.
  if (c.state === 'suspended') c.resume().catch(() => {});
  const now = c.currentTime;
  const { attack = 0.005, decay = 0.08, release = 0.1, peak = 0.6 } = env;

  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.linearRampToValueAtTime(peak * 0.4, now + attack + decay);
  gain.gain.linearRampToValueAtTime(0, now + duration + release);

  let tail: AudioNode = gain;
  if (filterFreq) {
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    gain.connect(filter);
    tail = filter;
  }
  osc.connect(gain);
  tail.connect(master);
  osc.start(now);
  osc.stop(now + duration + release + 0.05);
}

function sweep(fromFreq: number, toFreq: number, duration: number, type: OscillatorType = 'triangle', peak = 0.5) {
  const c = ensureCtx();
  if (!c || !master) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), now + duration);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.005);
  gain.gain.linearRampToValueAtTime(0, now + duration);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

// ── Named SFX ──

function synthTap() {
  // Short bubbly pop: sine blip + low thump
  playTone(880, 'sine', 0.05, { attack: 0.002, decay: 0.03, release: 0.06, peak: 0.55 }, 1800);
  sweep(260, 120, 0.09, 'sine', 0.35);
}

function synthBuy() {
  // Two-note ka-ching rising: 659 → 988
  playTone(659.25, 'triangle', 0.08, { peak: 0.6 });
  setTimeout(() => playTone(987.77, 'triangle', 0.14, { peak: 0.6 }), 70);
}

function synthChime(notes: number[], gap = 80) {
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 'sine', 0.2, { attack: 0.005, decay: 0.05, release: 0.25, peak: 0.55 }, 3000), i * gap);
  });
}

function synthArpeggio(notes: number[], gap = 80) {
  notes.forEach((f, i) => {
    setTimeout(() => {
      playTone(f, 'triangle', 0.16, { attack: 0.004, decay: 0.07, release: 0.2, peak: 0.6 }, 2400);
      playTone(f * 2, 'sine', 0.16, { attack: 0.004, decay: 0.07, release: 0.16, peak: 0.25 });
    }, i * gap);
  });
}

function synthBell(freq: number) {
  playTone(freq, 'sine', 0.28, { attack: 0.003, decay: 0.08, release: 0.45, peak: 0.6 }, 3500);
  playTone(freq * 2, 'sine', 0.22, { attack: 0.003, decay: 0.06, release: 0.28, peak: 0.28 });
}

export type SfxName = 'tap' | 'buy' | 'achievement' | 'prestige' | 'lore' | 'unlock';

export function playSfx(name: SfxName) {
  if (muted) return;
  try {
    switch (name) {
      case 'tap': synthTap(); break;
      case 'buy': synthBuy(); break;
      case 'unlock': synthChime([523.25, 783.99], 60); break;
      case 'achievement': synthChime([523.25, 659.25, 783.99]); break;
      case 'prestige': synthArpeggio([523.25, 659.25, 783.99, 1046.5, 1318.5]); break;
      case 'lore': synthBell(784); break;
    }
  } catch {
    // never throw from audio — it must not break gameplay
  }
}
