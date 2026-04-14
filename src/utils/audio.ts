// Brewery-themed SFX synthesized with Web Audio API. No asset files — every
// sound is built from filtered noise + gentle sine tones at runtime.
//
// Design notes (after two rounds of player feedback — "sounds are harsh /
// strange"):
//  - Real beer bubbles are mostly BROADBAND noise with brief tonal
//    coloring. Earlier versions leaned on aggressive pitch-sweeping sines
//    (2.0–2.6×) which sounded synthetic. We now use LOWPASS noise around
//    600–900 Hz as the dominant voice and barely-audible sines as colour.
//  - Real glass rings in the 800–1300 Hz range — the previous 2100 Hz
//    fundamental sat in the ear's most sensitive band and read as "sting".
//    We use 950 Hz with harmonic ratios [1, 2, 3.01] instead of inharmonic
//    metal ratios.
//  - A master DynamicsCompressor catches the sum of overlapping partials
//    so nothing clips; MASTER_LEVEL is also dropped from 0.55 → 0.35.
//  - Setting master.gain = 0 is still an instant mute.

const MUTE_KEY = 'beerfriends_muted';
const MASTER_LEVEL = 0.35;

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
    // Soft-knee compressor on the master bus. Catches simultaneous partials
    // (e.g. prestige's 10 bubbles + double clink) and prevents clipping
    // while adding a subtle "bar room" density.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 6;
    comp.ratio.value = 2;
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
    master.connect(comp).connect(ctx.destination);
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
 * One soft beer bubble. Dominant voice: lowpass-filtered white noise around
 * 600–900 Hz (the "chu" of water). A barely-audible low sine gives the pop
 * a hint of pitch without sounding like a synth bloop.
 */
function bubblePop(opts: {
  basePitch?: number;    // Hz — starting frequency of the subtle tone layer
  pitchRise?: number;    // multiplier — gentle pitch lift (default 1.25×)
  durationMs?: number;   // total sound length
  noiseCut?: number;     // lowpass cutoff in Hz for the noise body
  peak?: number;         // overall gain peak (0..1)
  delay?: number;        // schedule offset in seconds
}) {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const {
    basePitch = 90 + Math.random() * 60,
    pitchRise = 1.2 + Math.random() * 0.15,
    durationMs = 120 + Math.random() * 30,
    noiseCut = 650 + Math.random() * 300,
    peak = 0.55,
    delay = 0,
  } = opts;
  const start = c.currentTime + delay;
  const dur = durationMs / 1000;

  // Main body: lowpass-filtered noise — broad warm "chu".
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer(c);
  noise.loop = false;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(noiseCut, start);
  // Slight downward sweep on the cutoff mimics the "settling" of a bubble.
  lp.frequency.exponentialRampToValueAtTime(Math.max(200, noiseCut * 0.6), start + dur);
  lp.Q.value = 0.8;
  const nGain = c.createGain();
  nGain.gain.setValueAtTime(0, start);
  nGain.gain.linearRampToValueAtTime(peak, start + 0.008);
  nGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  noise.connect(lp).connect(nGain).connect(out);
  noise.start(start, Math.random() * 0.5);
  noise.stop(start + dur + 0.05);

  // Subtle tone layer: a quiet low sine that drifts up slightly. Adds pitch
  // information without reading as "synth". Kept 3× quieter than the noise.
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(basePitch, start);
  osc.frequency.exponentialRampToValueAtTime(basePitch * pitchRise, start + dur * 0.8);
  const oGain = c.createGain();
  oGain.gain.setValueAtTime(0, start);
  oGain.gain.linearRampToValueAtTime(peak * 0.18, start + 0.01);
  oGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(oGain).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/**
 * Warm mug/glass clink — harmonic partials (not inharmonic metal ratios) at
 * a fundamental in the natural glass range. Highshelf cut tames any sizzle.
 */
function glassClink(freq = 950, peak = 0.3, durationMs = 550) {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime;
  const dur = durationMs / 1000;
  // Tame high frequencies so the clink feels "wooden bar table" not "dentist".
  const shelf = c.createBiquadFilter();
  shelf.type = 'highshelf';
  shelf.frequency.value = 3800;
  shelf.gain.value = -9;
  shelf.connect(out);
  // Three harmonic partials — cleaner than the previous inharmonic stack.
  const partials = [
    { ratio: 1,    amp: 1.0 },
    { ratio: 2,    amp: 0.38 },
    { ratio: 3.01, amp: 0.16 },
  ];
  partials.forEach(({ ratio, amp }) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const g = c.createGain();
    const partialDur = dur / (0.7 + ratio * 0.2); // higher partials decay faster
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak * amp, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, start + partialDur);
    osc.connect(g).connect(shelf);
    osc.start(start);
    osc.stop(start + partialDur + 0.05);
  });
}

/** Warm bell — smaller, gentler version of glassClink used for Lore. */
function warmBell(freq = 560) {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime;
  const partials = [
    { ratio: 1,    amp: 0.45, dur: 0.6 },
    { ratio: 2,    amp: 0.24, dur: 0.38 },
    { ratio: 3.01, amp: 0.09, dur: 0.24 },
  ];
  partials.forEach(({ ratio, amp, dur }) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const g = c.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(amp, start + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  });
}

/**
 * Shatter: broadband noise burst (highpass 2 kHz) + three staggered low-
 * freq clinks — reads as "ceramic mug shattering on the floor".
 */
function shatter() {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime;
  const dur = 0.26;

  // Crunchy burst.
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer(c);
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2000;
  hp.Q.value = 0.7;
  const nGain = c.createGain();
  nGain.gain.setValueAtTime(0, start);
  nGain.gain.linearRampToValueAtTime(0.5, start + 0.004);
  nGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  noise.connect(hp).connect(nGain).connect(out);
  noise.start(start, Math.random() * 0.4);
  noise.stop(start + dur + 0.05);

  // A few low-pitched clinks scattered across ~180 ms — shards landing.
  [
    { f: 820, d: 0.00, peak: 0.28 },
    { f: 1100, d: 0.06, peak: 0.22 },
    { f: 1450, d: 0.12, peak: 0.18 },
  ].forEach(({ f, d, peak }) => {
    setTimeout(() => glassClink(f, peak, 420), d * 1000);
  });
}

// Small helper to humanize scheduling — prevents metronomic delays on the
// multi-pop SFX. Returns a delay in seconds with ±jitter ms applied.
function jitter(baseSec: number, maxMs = 15): number {
  return Math.max(0, baseSec + (Math.random() * 2 - 1) * (maxMs / 1000));
}

// ── Named SFX (brewery-themed) ──

/** Single soft bubble — every tap. Low, wet, not bright. */
function synthTap() {
  bubblePop({ basePitch: 110, pitchRise: 1.2, durationMs: 100, noiseCut: 750, peak: 0.55 });
}

/** Three-bubble pour — purchase/upgrade. Sounds like beer filling a mug. */
function synthBuy() {
  bubblePop({ basePitch: 90, noiseCut: 600, durationMs: 130, peak: 0.55, delay: jitter(0) });
  bubblePop({ basePitch: 110, noiseCut: 700, durationMs: 120, peak: 0.5, delay: jitter(0.07) });
  bubblePop({ basePitch: 140, noiseCut: 800, durationMs: 110, peak: 0.5, delay: jitter(0.14) });
}

/** Ascending pour — unlocking a new beer / crafted recipe. */
function synthUnlock() {
  const pitches = [90, 115, 145, 180];
  pitches.forEach((p, i) => bubblePop({
    basePitch: p, pitchRise: 1.25, durationMs: 120, noiseCut: 600 + i * 120,
    peak: 0.55, delay: jitter(i * 0.075),
  }));
}

/** Mug clink — achievement claimed. Two warm clinks like mugs hitting. */
function synthAchievement() {
  glassClink(950, 0.32, 580);
  setTimeout(() => glassClink(820, 0.28, 520), 130);
}

/** Celebration fountain — prestige. Lots of bubbles + a final warm clink. */
function synthPrestige() {
  for (let i = 0; i < 10; i++) {
    const pitch = 80 + i * 22 + Math.random() * 20;
    bubblePop({
      basePitch: pitch, pitchRise: 1.25 + Math.random() * 0.1, durationMs: 130,
      noiseCut: 600 + i * 40, peak: 0.5, delay: jitter(i * 0.065, 20),
    });
  }
  setTimeout(() => {
    glassClink(1050, 0.32, 700);
    glassClink(820, 0.26, 620);
  }, 700);
}

/** Soft bell — rewarded Lore completion. */
function synthLore() {
  warmBell(560);
}

/** Random mug break on tavern floor. */
function synthBreak() {
  shatter();
}

export type SfxName = 'tap' | 'buy' | 'achievement' | 'prestige' | 'lore' | 'unlock' | 'break';

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
      case 'break': synthBreak(); break;
    }
  } catch {
    // never throw from audio — it must not break gameplay
  }
}
