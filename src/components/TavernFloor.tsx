import { useEffect, useRef } from 'react';
import { playSfx } from '../utils/audio';

// Decorative "tavern floor" scene anchored at the bottom of the Brewery tab.
// A round wooden table in the centre with four emoji friends seated around
// it — north/east/south/west. The friends bob gently and their mugs tilt
// (sip) on staggered CSS animations so it reads as a living scene with no
// JS cost at rest.
//
// Three event types can be triggered imperatively:
//  - spillBeer(intensity): an amber puddle blooms on the floor with foam
//  - breakMug(): a mug falls from the tap area, shatters into shards + SFX
//  - cheers(): all four mugs tilt at once with a ✨ over the table
//
// Events are fired via a module-scoped ref set on mount. We also expose a
// named CustomEvent on window so unrelated modules could dispatch without
// an import cycle — handy for testing from the console.

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
      const size = intensity === 'large' ? 160 : intensity === 'medium' ? 110 : 72;
      const puddle = document.createElement('div');
      puddle.className = `puddle puddle--${intensity}`;
      puddle.style.width = `${size}px`;
      puddle.style.height = `${size * 0.38}px`;
      puddle.style.left = `calc(50% - ${size / 2}px)`;
      puddle.style.bottom = `2px`;
      spawn(puddle, 1500);

      // Scatter a few foam dots that rise and fade.
      const foamCount = intensity === 'large' ? 10 : intensity === 'medium' ? 6 : 3;
      for (let i = 0; i < foamCount; i++) {
        const f = document.createElement('div');
        f.className = 'foam';
        const xOffset = rand(-size / 2 + 10, size / 2 - 10);
        f.style.left = `calc(50% + ${xOffset}px)`;
        f.style.bottom = `${6 + rand(0, 8)}px`;
        f.style.animationDelay = `${i * 40}ms`;
        spawn(f, 1400);
      }
    };

    const breakMugFn: FxHandlers['breakMug'] = () => {
      // Falling mug — absolute-positioned emoji that animates from the top
      // of the floor scene down to the ground, then spawns shards.
      const mug = document.createElement('div');
      mug.className = 'falling-mug';
      mug.textContent = '🍺';
      spawn(mug, 700);
      window.setTimeout(() => {
        // Shatter burst
        for (let i = 0; i < 4; i++) {
          const s = document.createElement('div');
          s.className = 'shard';
          s.textContent = i === 0 ? '💥' : '🍺';
          const angle = rand(-1, 1);
          s.style.setProperty('--dx', `${angle * 60}px`);
          s.style.setProperty('--dy', `${-rand(14, 30)}px`);
          s.style.setProperty('--rot', `${angle * 180}deg`);
          s.style.left = `calc(50% - 10px)`;
          s.style.bottom = `8px`;
          s.style.animationDelay = `${i * 20}ms`;
          spawn(s, 700);
        }
        // Puddle forms from the smashed mug.
        spill('small');
        playSfx('break');
      }, 520);
    };

    const cheersFn: FxHandlers['cheers'] = () => {
      const root = rootRef.current;
      if (!root) return;
      root.classList.add('tavern-cheers');
      // Floating ✨ above the table.
      const sparkle = document.createElement('div');
      sparkle.className = 'cheers-sparkle';
      sparkle.textContent = '🎉';
      spawn(sparkle, 800);
      if (cheersTimeoutRef.current) clearTimeout(cheersTimeoutRef.current);
      cheersTimeoutRef.current = window.setTimeout(() => {
        root.classList.remove('tavern-cheers');
      }, 800);
    };

    handlers = { spill, breakMug: breakMugFn, cheers: cheersFn };

    // Optional: console-level debug hook.
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
      <div className="tavern-table" />
      <div className="friend friend--n">🧔</div>
      <div className="friend friend--e">🧑</div>
      <div className="friend friend--s">👩</div>
      <div className="friend friend--w">🧓</div>
      <div className="friend-mug mug--n">🍺</div>
      <div className="friend-mug mug--e">🍺</div>
      <div className="friend-mug mug--s">🍺</div>
      <div className="friend-mug mug--w">🍺</div>
      <div className="tavern-fx" ref={fxLayerRef} />
    </div>
  );
}
