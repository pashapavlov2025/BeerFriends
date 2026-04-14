// Brewery-themed SFX synthesized with Web Audio API. No asset files — every
// sound is built from oscillators, filtered noise, and envelopes at runtime.
//
// Design goals:
//  - Nothing "electronic" — every sound reads as brewery (bubbles, pour,
//    glass clink). We achieve this mostly with filtered white noise +
//    pitch-sweeping sines (a classic synth-bubble recipe).
//  - Reliable across platforms: a one-shot unlock listener resumes the
//    AudioContext on first user gesture, well before any SFX call.
//  - A single master GainNode controls total loudness and doubles as an
//    instant mute: setting master.gain = 0 silences in-flight sounds too.

const MUTE_KEY = 'beerfriends_muted';
const MASTER_LEVEL = 0.55;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
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
    master.gain.value = muted ? 0 : MASTER_LEVEL;
    master.connect(ctx.destination);
    return ctx;
  } catch { return null; }
}

function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const len = Math.floor(c.sampleRate * 1.5);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

export function initAudio() {
  if (unlocked) return;
  const unlock = () => {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') {
      c.resume().then(() => { unlocked = true; }).catch(() => {});
    } else {
      unlocked = true;
    }
  };
  const evts: (keyof DocumentEventMap)[] = ['pointerdown', 'touchstart', 'keydown', 'click'];
  const handler = () => {
    unlock();
    evts.forEach(e => document.removeEventListener(e, handler));
  };
  const opts = { passive: true } as AddEventListenerOptions;
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

// ── Building blocks ──

/**
 * One bubble pop. Filtered noise burst + a short pitch-rising sine produce
 * the classic "blub" of a rising bubble breaking at the surface.
 */
function bubblePop(opts: {
  basePitch?: number;    // Hz — starting frequency of the tone component
  pitchRise?: number;    // multiplier — how much the pitch sweeps up (e.g. 2.2)
  durationMs?: number;   // total sound length
  noiseBw?: number;      // bandpass centre-frequency for noise shaping
  peak?: number;         // gain peak (0..1)
  delay?: number;        // schedule offset in seconds
}) {
  const c = ensureCtx();
  if (!c || !master) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const {
    basePitch = 180 + Math.random() * 140,
    pitchRise = 2.0 + Math.random() * 0.6,
    durationMs = 90,
    noiseBw = 550 + Math.random() * 300,
    peak = 0.55,
    delay = 0,
  } = opts;
  const start = c.currentTime + delay;
  const dur = durationMs / 1000;

  // Noise click gives the "wet pop" texture.
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer(c);
  noise.loop = false;
  const nFilter = c.createBiquadFilter();
  nFilter.type = 'bandpass';
  nFilter.frequency.setValueAtTime(noiseBw, start);
  nFilter.Q.value = 9;
  const nGain = c.createGain();
  nGain.gain.setValueAtTime(0, start);
  nGain.gain.linearRampToValueAtTime(peak * 0.45, start + 0.004);
  nGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  noise.connect(nFilter).connect(nGain).connect(master);
  noise.start(start, Math.random() * 0.5);
  noise.stop(start + dur + 0.05);

  // Pitch-rising sine gives the "bubbly" character.
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(basePitch, start);
  osc.frequency.exponentialRampToValueAtTime(basePitch * pitchRise, start + dur);
  const oGain = c.createGain();
  oGain.gain.setValueAtTime(0, start);
  oGain.gain.linearRampToValueAtTime(peak, start + 0.006);
  oGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(oGain).connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/**
 * Glass clink — several inharmonic sine partials with fast attack and long
 * exponential decay produce a shimmering metallic-glass ring.
 */
function glassClink(freq = 2100, peak = 0.35, durationMs = 600) {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime;
  const dur = durationMs / 1000;
  // Slightly inharmonic ratios — hallmark of glass/bell-like timbres.
  const partials = [
    { ratio: 1,   amp: 1.0 },
    { ratio: 2.4, amp: 0.55 },
    { ratio: 3.7, amp: 0.28 },
    { ratio: 5.2, amp: 0.15 },
  ];
  partials.forEach(({ ratio, amp }) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const g = c.createGain();
    const partialDur = dur / (0.6 + ratio * 0.15); // higher partials decay faster
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak * amp, start + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, start + partialDur);
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + partialDur + 0.05);
  });
}

/** Warm bell — smaller, gentler version of glassClink used for Lore. */
function warmBell(freq = 660) {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime;
  const partials = [
    { ratio: 1,   amp: 0.55, dur: 0.55 },
    { ratio: 2,   amp: 0.3,  dur: 0.35 },
    { ratio: 3.01, amp: 0.12, dur: 0.22 },
  ];
  partials.forEach(({ ratio, amp, dur }) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const g = c.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(amp, start + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  });
}

// ── Named SFX (brewery-themed) ──

/** Single crisp bubble — every tap. */
function synthTap() {
  bubblePop({ basePitch: 260, pitchRise: 2.3, durationMs: 80, peak: 0.6 });
}

/** Three-bubble pour — purchase/upgrade. */
function synthBuy() {
  bubblePop({ basePitch: 180, pitchRise: 2.1, durationMs: 90, peak: 0.55, delay: 0 });
  bubblePop({ basePitch: 220, pitchRise: 2.4, durationMs: 85, peak: 0.5, delay: 0.06 });
  bubblePop({ basePitch: 300, pitchRise: 2.6, durationMs: 75, peak: 0.55, delay: 0.13 });
}

/** Ascending pour — unlocking a new beer / crafted recipe. */
function synthUnlock() {
  const pitches = [200, 280, 360, 460];
  pitches.forEach((p, i) => bubblePop({ basePitch: p, pitchRise: 2.2, durationMs: 90, peak: 0.55, delay: i * 0.07 }));
}

/** Glass clink — achievement claimed. Two clinks, like hitting glasses. */
function synthAchievement() {
  glassClink(2100, 0.38, 650);
  setTimeout(() => glassClink(1850, 0.32, 600), 120);
}

/** Celebration fountain — prestige. Lots of bubbles + a final high clink. */
function synthPrestige() {
  for (let i = 0; i < 10; i++) {
    const pitch = 160 + i * 40 + Math.random() * 60;
    bubblePop({ basePitch: pitch, pitchRise: 2.3 + Math.random() * 0.3, durationMs: 100, peak: 0.55, delay: i * 0.06 });
  }
  setTimeout(() => {
    glassClink(2400, 0.4, 800);
    glassClink(1800, 0.3, 700);
  }, 650);
}

/** Soft bell — rewarded Lore completion. */
function synthLore() {
  warmBell(660);
}

export type SfxName = 'tap' | 'buy' | 'achievement' | 'prestige' | 'lore' | 'unlock';

export function playSfx(name: SfxName) {
  if (muted) return;
  try {
    switch (name) {
      case 'tap': synthTap(); break;
      case 'buy': synthBuy(); break;
      case 'unlock': synthUnlock(); break;
      case 'achievement': synthAchievement(); break;
      case 'prestige': synthPrestige(); break;
      case 'lore': synthLore(); break;
    }
  } catch {
    // never throw from audio — it must not break gameplay
  }
}
