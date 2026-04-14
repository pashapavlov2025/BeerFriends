import confetti from 'canvas-confetti';

// Brewery-themed palette (gold, amber, foam) for all confetti bursts.
const BEER_COLORS = ['#fcd34d', '#f59e0b', '#d97706', '#fef3c7', '#fbbf24'];

export function burstConfetti(intensity: 'small' | 'medium' | 'large' = 'medium') {
  const particleCount = intensity === 'small' ? 40 : intensity === 'large' ? 180 : 90;
  confetti({
    particleCount,
    spread: intensity === 'large' ? 100 : 70,
    startVelocity: intensity === 'large' ? 55 : 40,
    origin: { y: 0.6 },
    colors: BEER_COLORS,
    ticks: 150,
    gravity: 0.9,
    scalar: 0.9,
    disableForReducedMotion: true,
  });
}

export function prestigeConfetti() {
  // Two bursts from bottom corners for a celebratory fireworks effect.
  const common = {
    particleCount: 120,
    spread: 70,
    startVelocity: 55,
    colors: BEER_COLORS,
    disableForReducedMotion: true,
  };
  confetti({ ...common, angle: 60, origin: { x: 0, y: 0.8 } });
  confetti({ ...common, angle: 120, origin: { x: 1, y: 0.8 } });
  setTimeout(() => {
    confetti({ ...common, particleCount: 60, angle: 90, origin: { x: 0.5, y: 0.6 } });
  }, 300);
}

// Trigger a temporary CSS class on the app container for a screen-shake.
export function screenShake(durationMs = 350) {
  const el = document.querySelector('.app');
  if (!el) return;
  el.classList.remove('shake');
  // Force reflow so removing+adding restarts the animation reliably.
  void (el as HTMLElement).offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), durationMs);
}
