// Shared types for platform SDK adapters. Each platform (CrazyGames, Poki,
// GameDistribution, etc.) exposes a slightly different API; adapters wrap
// them into this uniform shape so the rest of the game is platform-agnostic.

export interface PlatformAdapter {
  /** Human-readable platform name, used for analytics + logs. */
  name: string;
  /** Attempt to load + initialize the SDK. Resolves true on success. */
  tryInit: () => Promise<boolean>;
  /** Notify the SDK the player is actively playing (most platforms track this). */
  gameplayStart: () => void;
  /** Notify the SDK that active gameplay paused. */
  gameplayStop: () => void;
  /** Show an interstitial ad. Resolves true if shown, false on error/skip. */
  showMidgameAd: () => Promise<boolean>;
  /** Show a rewarded ad. Resolves true if the reward should be granted. */
  showRewardedAd: () => Promise<boolean>;
}

/** Inject a <script> tag and resolve when it loads (or reject on error). */
export function loadScript(src: string, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    const to = setTimeout(() => reject(new Error(`SDK load timeout: ${src}`)), timeoutMs);
    s.onload = () => { clearTimeout(to); resolve(); };
    s.onerror = () => { clearTimeout(to); reject(new Error(`SDK load failed: ${src}`)); };
    document.head.appendChild(s);
  });
}
