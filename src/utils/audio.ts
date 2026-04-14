// Web Audio API-synthesized SFX. No external asset files — every sound is
// generated from oscillators + envelopes at runtime, so the build stays small
// and platform uploads don't need audio uploads.
//
// Mute state is persisted in localStorage so it survives reloads.

const MUTE_KEY = 'beerfriends_muted';

let ctx: AudioContext | null = null;
let muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === 'true'; }
  catch { return false; }
})();
const listeners = new Set<(m: boolean) => void>();

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    return ctx;
  } catch { return null; }
}

export function isMuted() { return muted; }

export function setMuted(next: boolean) {
  muted = next;
  try { localStorage.setItem(MUTE_KEY, String(muted)); } catch {}
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
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const now = c.currentTime;
  const { attack = 0.005, decay = 0.08, release = 0.1, peak = 0.3 } = env;

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
  tail.connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + release + 0.05);
}

function sweep(fromFreq: number, toFreq: number, duration: number, type: OscillatorType = 'triangle', peak = 0.25) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), now + duration);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.005);
  gain.gain.linearRampToValueAtTime(0, now + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

// ── Named SFX ──

function synthTap() {
  // Short bubbly pop: sine blip + low thump
  playTone(880, 'sine', 0.05, { attack: 0.002, decay: 0.03, release: 0.06, peak: 0.18 }, 1200);
  sweep(240, 120, 0.08, 'sine', 0.1);
}

function synthBuy() {
  // Two-note ka-ching rising: 659 → 988
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  playTone(659.25, 'triangle', 0.08, { peak: 0.22 });
  setTimeout(() => playTone(987.77, 'triangle', 0.12, { peak: 0.22 }), 70);
  void now;
}

function synthChime(notes: number[], gap = 80) {
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 'sine', 0.18, { attack: 0.005, decay: 0.04, release: 0.22, peak: 0.2 }, 2400), i * gap);
  });
}

function synthArpeggio(notes: number[], gap = 80) {
  notes.forEach((f, i) => {
    setTimeout(() => {
      playTone(f, 'triangle', 0.14, { attack: 0.004, decay: 0.06, release: 0.18, peak: 0.22 }, 2000);
      playTone(f * 2, 'sine', 0.14, { attack: 0.004, decay: 0.06, release: 0.14, peak: 0.1 });
    }, i * gap);
  });
}

function synthBell(freq: number) {
  playTone(freq, 'sine', 0.25, { attack: 0.003, decay: 0.06, release: 0.4, peak: 0.22 }, 3500);
  playTone(freq * 2, 'sine', 0.2, { attack: 0.003, decay: 0.05, release: 0.25, peak: 0.1 });
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
