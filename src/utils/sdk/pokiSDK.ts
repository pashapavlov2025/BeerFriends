import type { PlatformAdapter } from './types';
import { loadScript } from './types';

// Poki SDK v2 adapter. Docs: https://sdk.poki.com/
// When Poki approves the game, they issue a production PokiSDK init
// which is handled the same way — the dev/test SDK URL works for
// pre-submission testing.

declare global {
  interface Window {
    PokiSDK?: {
      init: () => Promise<void>;
      gameLoadingStart: () => void;
      gameLoadingFinished: () => void;
      gameplayStart: () => void;
      gameplayStop: () => void;
      commercialBreak: (beforeAd?: () => void) => Promise<void>;
      rewardedBreak: (beforeAd?: () => void) => Promise<boolean>;
      setDebug?: (on: boolean) => void;
    };
  }
}

const SDK_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

function sdk() { return window.PokiSDK ?? null; }

export const pokiAdapter: PlatformAdapter = {
  name: 'poki',

  async tryInit() {
    try {
      await loadScript(SDK_URL);
      if (!sdk()) return false;
      await sdk()!.init();
      sdk()!.gameLoadingFinished();
      return true;
    } catch { return false; }
  },

  gameplayStart() { sdk()?.gameplayStart(); },
  gameplayStop() { sdk()?.gameplayStop(); },

  async showMidgameAd() {
    const s = sdk();
    if (!s) return false;
    try { await s.commercialBreak(); return true; }
    catch { return false; }
  },

  async showRewardedAd() {
    const s = sdk();
    if (!s) return false;
    try { return await s.rewardedBreak(); }
    catch { return false; }
  },
};
