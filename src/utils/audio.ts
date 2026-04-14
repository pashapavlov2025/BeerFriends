// Brewery SFX — proper bubble synthesis, take 3.
//
// Previous revisions used pitch-RISING sines + sustained bandpass noise,
// which are technically wrong: real water bubbles follow the Minnaert
// model — a sine ringing at the bubble's resonance frequency, with the
// pitch DROPPING slightly as the bubble rises and expands (lower
// pressure → larger radius → lower f). The amplitude decays exponentially.
// The noise contribution is a very short (5–20 ms) click at the attack,
// representing the surface-tension break, NOT a sustained hiss.
//
// Sources consulted for this revision:
//   • Andy Farnell — "Designing Sound" (ch. on water/bubbles)
//   • Minnaert formula  f ≈ 3.26 / R(mm)  Hz
//   • Practical recipes from the Pure Data / SuperCollider communities
//
// Design parameters:
//   • Bubble fundamental range: 180–1200 Hz (covers beer bubble sizes
//     ~3 mm down to ~0.3 mm; visible beer bubbles tend to be 2–5 mm).
//   • Pitch drop: f ramps DOWN ~30–40 % over ~60–120 ms.
//   • Amplitude envelope: fast linear attack (~6 ms) → exponential decay.
//   • Noise click: 8–18 ms burst, bandpassed around 1.5–3 kHz, tiny gain.
//   • Master: DynamicsCompressor for headroom + a softshelf HF cut.

const MUTE_KEY = 'beerfriends_muted';
const MASTER_LEVEL = 0.38;

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

    // High-shelf: take the edge off anything above 4 kHz so no SFX ever
    // reads as "whistle" or "sizzle".
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 4200;
    shelf.gain.value = -7;

    // Compressor on the master bus. Keeps overlapping partials from
    // clipping and adds a subtle "room" density.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 8;
    comp.ratio.value = 2.4;
    comp.attack.value = 0.003;
    comp.release.value = 0.15;

    master.connect(shelf).connect(comp).connect(ctx.destination);
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

// ── One bubble (Minnaert-style) ──
// Dominant voice: sine at the bubble's resonance frequency, pitch dropping
// as the bubble expands, amplitude decaying exponentially. Noise click
// gives the "tk" of the surface breaking.
function bubble(opts: {
  startFreq: number;   // Hz — bubble resonance at emergence
  endFreq?: number;    // Hz — where pitch lands (default ~65 % of start)
  durationMs?: number; // total ring time (exp decay after this is inaudible)
  peak?: number;       // main gain peak (0..1)
  delay?: number;      // schedule offset in seconds
}) {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});

  const {
    startFreq,
    endFreq = startFreq * (0.55 + Math.random() * 0.15),
    durationMs = 120,
    peak = 0.45,
    delay = 0,
  } = opts;
  const start = c.currentTime + delay;
  const dur = durationMs / 1000;

  // Main sine: bubble ringing at its resonance.
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, endFreq), start + dur);
  const oGain = c.createGain();
  oGain.gain.setValueAtTime(0, start);
  oGain.gain.linearRampToValueAtTime(peak, start + 0.006);
  oGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(oGain).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);

  // Very short noise click at attack — surface tension break. Keep it
  // quiet (~18 % of peak) and tightly filtered so it doesn't whistle.
  const clickDur = 0.014;
  const noise = c.createBufferSource();
  noise.buffer = getNoiseBuffer(c);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800 + Math.random() * 900;
  bp.Q.value = 1.8;
  const nGain = c.createGain();
  nGain.gain.setValueAtTime(0, start);
  nGain.gain.linearRampToValueAtTime(peak * 0.18, start + 0.002);
  nGain.gain.exponentialRampToValueAtTime(0.001, start + clickDur);
  noise.connect(bp).connect(nGain).connect(out);
  noise.start(start, Math.random() * 0.5);
  noise.stop(start + clickDur + 0.02);
}

/** Warm mug/glass clink using harmonic partials at a natural glass freq. */
function glassClink(freq = 950, peak = 0.3, durationMs = 550) {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime;
  const dur = durationMs / 1000;

  const partials = [
    { ratio: 1,    amp: 1.0 },
    { ratio: 2,    amp: 0.32 },
    { ratio: 3.01, amp: 0.12 },
  ];
  partials.forEach(({ ratio, amp }) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const g = c.createGain();
    const partialDur = dur / (0.75 + ratio * 0.2);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak * amp, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, start + partialDur);
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + partialDur + 0.05);
  });
}

/** Gentler bell for Lore. */
function warmBell(freq = 540) {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime;
  const partials = [
    { ratio: 1,    amp: 0.45, dur: 0.7 },
    { ratio: 2,    amp: 0.22, dur: 0.42 },
    { ratio: 3.01, amp: 0.08, dur: 0.26 },
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

/** Shatter — highpassed noise burst + scattered low clinks. */
function shatter() {
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime;
  const dur = 0.28;

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

  [
    { f: 780, d: 0.00, peak: 0.26 },
    { f: 1050, d: 0.06, peak: 0.2 },
    { f: 1380, d: 0.12, peak: 0.16 },
  ].forEach(({ f, d, peak }) => {
    setTimeout(() => glassClink(f, peak, 420), d * 1000);
  });
}

// Timing helper — small random jitter on multi-pop SFX.
function jitter(baseSec: number, maxMs = 18): number {
  return Math.max(0, baseSec + (Math.random() * 2 - 1) * (maxMs / 1000));
}

// ── Named SFX ──

/** Tap — a single small rising-surface bubble. */
function synthTap() {
  const f = 900 + Math.random() * 300;      // small bubble ~2 mm
  bubble({ startFreq: f, endFreq: f * 0.6, durationMs: 110, peak: 0.5 });
}

/** Buy — mug filling up. Three falling-pitch "glugs" like beer pouring. */
function synthBuy() {
  // Larger bubbles → lower freqs; pitch drops across the pour as the
  // cavity fills (classic "bottle glug").
  bubble({ startFreq: 420, endFreq: 220, durationMs: 140, peak: 0.5, delay: jitter(0) });
  bubble({ startFreq: 360, endFreq: 190, durationMs: 140, peak: 0.5, delay: jitter(0.1) });
  bubble({ startFreq: 310, endFreq: 170, durationMs: 150, peak: 0.5, delay: jitter(0.2) });
}

/** Unlock — reverse-direction: four bubbles with DESCENDING start pitches
 *  reading as a satisfying "ascending in importance" pour. We cheat the
 *  pitch-perception here by playing each bubble slightly louder and longer. */
function synthUnlock() {
  const starts = [520, 640, 800, 980];
  starts.forEach((sf, i) => bubble({
    startFreq: sf,
    endFreq: sf * 0.55,
    durationMs: 140,
    peak: 0.45 + i * 0.03,
    delay: jitter(i * 0.085),
  }));
}

/** Achievement — two warm mug clinks. */
function synthAchievement() {
  glassClink(940, 0.32, 580);
  setTimeout(() => glassClink(800, 0.28, 520), 130);
}

/** Prestige — bubble fountain + double clink finale. */
function synthPrestige() {
  for (let i = 0; i < 10; i++) {
    const sf = 300 + i * 55 + Math.random() * 40;
    bubble({
      startFreq: sf,
      endFreq: sf * (0.55 + Math.random() * 0.15),
      durationMs: 130,
      peak: 0.45,
      delay: jitter(i * 0.065, 22),
    });
  }
  setTimeout(() => {
    glassClink(1040, 0.32, 720);
    glassClink(800, 0.26, 620);
  }, 720);
}

/** Lore — soft bell. */
function synthLore() {
  warmBell(540);
}

/** Break — random mug shatter on the tavern floor. */
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
