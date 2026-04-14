import type { PlatformAdapter } from './types';
import { loadScript } from './types';

// GameDistribution (Azerion) SDK adapter.
// Docs: https://developers.gamedistribution.com/html5-sdk
// The gameId is issued by GameDistribution once the game is accepted.
// Before that the test UUID lets us verify the integration without a real ID.

const GD_SDK_URL = 'https://html5.api.gamedistribution.com/main.min.js';
const TEST_GAME_ID = '4f3d7d38a7b3b8d1a6c5f1d9e1a3c4b5';

declare global {
  interface Window {
    gdsdk?: {
      showAd: (type?: string) => Promise<void>;
      preloadAd?: (type?: string) => Promise<void>;
    };
    GD_OPTIONS?: Record<string, unknown>;
  }
}

function sdk() { return window.gdsdk ?? null; }

export const gdAdapter: PlatformAdapter = {
  name: 'gamedistribution',

  async tryInit() {
    // GD reads options from window.GD_OPTIONS before the script runs.
    if (!window.GD_OPTIONS) {
      const gameId = (import.meta.env.VITE_GD_GAME_ID as string | undefined) ?? TEST_GAME_ID;
      window.GD_OPTIONS = {
        gameId,
        onEvent: (_event: unknown) => {
          // Reserved for future analytics hooks.
        },
      };
    }
    try {
      await loadScript(GD_SDK_URL);
      // SDK exposes window.gdsdk asynchronously, allow a brief settle tick.
      for (let i = 0; i < 20; i++) {
        if (sdk()) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      return !!sdk();
    } catch { return false; }
  },

  // GD has no gameplay-lifecycle equivalent in the public API.
  gameplayStart() {},
  gameplayStop() {},

  async showMidgameAd() {
    const s = sdk();
    if (!s) return false;
    try { await s.showAd('interstitial'); return true; }
    catch { return false; }
  },

  async showRewardedAd() {
    const s = sdk();
    if (!s) return false;
    try { await s.showAd('rewarded'); return true; }
    catch { return false; }
  },
};
