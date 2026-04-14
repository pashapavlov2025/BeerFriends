import { useEffect, useRef } from 'react';
import { playSfx } from '../utils/audio';

// Pure CSS tavern scene — no emoji. Four seated patrons around a round
// wooden table, each with a large mug of foamy beer in front of them.
// All artwork is made of nested <div>s styled with gradients and pseudo-
// elements in app.css; this component only handles layout + FX events.
//
// Imperative API for parent code:
//   spillBeer(intensity)  — amber puddle blooms on the floor
//   breakMug()            — a mug falls into the scene and shatters
//   cheers()              — all four mugs tilt up at once
//
// A CustomEvent('tavern-fx') hook is also registered so side modules
// (or console testing) can trigger events without importing this file.

type SpillIntensity = 'small' | 'medium' | 'large';

type FxHandlers = {
  spill: (intensity: SpillIntensity) => void;
  breakMug: () => void;
  cheers: () => void;
};

let handlers: FxHandlers | null = null;

export function spillBeer(intensity: SpillIntensity = 'medium') {
  handlers?.spill(intensity);
}
export function breakMug() {
  handlers?.breakMug();
}
export function cheers() {
  handlers?.cheers();
}

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

// A CSS-only beer mug: body + handle + amber beer fill + foam cap.
function Mug({ className = '' }: { className?: string }) {
  return (
    <div className={`mug ${className}`}>
      <div className="mug-body">
        <div className="mug-beer" />
        <div className="mug-foam" />
        <div className="mug-shine" />
      </div>
      <div className="mug-handle" />
    </div>
  );
}

// A CSS-only seated patron: round head with hairstyle + simple body.
function Patron({ variant, className = '' }: { variant: 1 | 2 | 3 | 4; className?: string }) {
  return (
    <div className={`patron patron--v${variant} ${className}`}>
      <div className="patron-body" />
      <div className="patron-head">
        <div className="patron-face" />
        <div className="patron-hair" />
      </div>
    </div>
  );
}

export function TavernFloor() {
  const fxLayerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cheersTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const layer = fxLayerRef.current;
    if (!layer) return;

    const spawn = (el: HTMLElement, lifetimeMs: number) => {
      layer.appendChild(el);
      window.setTimeout(() => { el.remove(); }, lifetimeMs);
    };

    const spill: FxHandlers['spill'] = (intensity) => {
      const size = intensity === 'large' ? 210 : intensity === 'medium' ? 140 : 90;
      const puddle = document.createElement('div');
      puddle.className = `puddle puddle--${intensity}`;
      puddle.style.width = `${size}px`;
      puddle.style.height = `${size * 0.34}px`;
      puddle.style.left = `calc(50% - ${size / 2}px)`;
      puddle.style.bottom = `8px`;
      spawn(puddle, 1500);

      const foamCount = intensity === 'large' ? 12 : intensity === 'medium' ? 7 : 4;
      for (let i = 0; i < foamCount; i++) {
        const f = document.createElement('div');
        f.className = 'foam';
        const xOffset = rand(-size / 2 + 10, size / 2 - 10);
        f.style.left = `calc(50% + ${xOffset}px)`;
        f.style.bottom = `${14 + rand(0, 10)}px`;
        f.style.animationDelay = `${i * 40}ms`;
        spawn(f, 1400);
      }
    };

    const breakMugFn: FxHandlers['breakMug'] = () => {
      const falling = document.createElement('div');
      falling.className = 'falling-mug';
      falling.innerHTML = `
        <div class="mug mug--falling">
          <div class="mug-body"><div class="mug-beer"></div><div class="mug-foam"></div><div class="mug-shine"></div></div>
          <div class="mug-handle"></div>
        </div>`;
      spawn(falling, 700);

      window.setTimeout(() => {
        // Shard pieces fly outward from the smash point.
        for (let i = 0; i < 5; i++) {
          const s = document.createElement('div');
          s.className = 'shard';
          const angle = rand(-1, 1);
          s.style.setProperty('--dx', `${angle * 70}px`);
          s.style.setProperty('--dy', `${-rand(18, 36)}px`);
          s.style.setProperty('--rot', `${angle * 220}deg`);
          s.style.left = `calc(50% - 4px)`;
          s.style.bottom = `10px`;
          s.style.animationDelay = `${i * 18}ms`;
          spawn(s, 700);
        }
        spill('small');
        playSfx('break');
      }, 520);
    };

    const cheersFn: FxHandlers['cheers'] = () => {
      const root = rootRef.current;
      if (!root) return;
      root.classList.add('tavern-cheers');
      const sparkle = document.createElement('div');
      sparkle.className = 'cheers-burst';
      // Three little star-bursts above the table.
      sparkle.innerHTML = `<span>✦</span><span>✧</span><span>✦</span>`;
      spawn(sparkle, 900);
      if (cheersTimeoutRef.current) clearTimeout(cheersTimeoutRef.current);
      cheersTimeoutRef.current = window.setTimeout(() => {
        root.classList.remove('tavern-cheers');
      }, 900);
    };

    handlers = { spill, breakMug: breakMugFn, cheers: cheersFn };

    const onDebug = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind: string; intensity?: SpillIntensity } | undefined;
      if (!detail) return;
      if (detail.kind === 'spill') spill(detail.intensity ?? 'medium');
      if (detail.kind === 'break') breakMugFn();
      if (detail.kind === 'cheers') cheersFn();
    };
    window.addEventListener('tavern-fx', onDebug);
    return () => {
      handlers = null;
      window.removeEventListener('tavern-fx', onDebug);
      if (cheersTimeoutRef.current) clearTimeout(cheersTimeoutRef.current);
    };
  }, []);

  return (
    <div className="tavern-floor" ref={rootRef} aria-hidden="true">
      <div className="tavern-floor-planks" />
      <div className="tavern-table">
        <div className="tavern-table-top" />
        <div className="tavern-table-leg" />
      </div>
      <div className="seat seat--n"><Patron variant={1} /><Mug className="seat-mug" /></div>
      <div className="seat seat--e"><Patron variant={2} /><Mug className="seat-mug" /></div>
      <div className="seat seat--s"><Patron variant={3} /><Mug className="seat-mug" /></div>
      <div className="seat seat--w"><Patron variant={4} /><Mug className="seat-mug" /></div>
      <div className="tavern-fx" ref={fxLayerRef} />
    </div>
  );
}
