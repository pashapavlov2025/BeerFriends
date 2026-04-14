import type { PlatformAdapter } from './types';
import { loadScript } from './types';

// CrazyGames SDK v2 adapter. Only tries to load the SDK when we think the
// game is running on CrazyGames (via referrer/hostname or ?platform=crazy).

declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        init: () => Promise<void>;
        game: {
          sdkGameLoadingStart: () => void;
          sdkGameLoadingStop: () => void;
          gameplayStart: () => void;
          gameplayStop: () => void;
        };
        ad: {
          requestAd: (
            type: 'midgame' | 'rewarded',
            callbacks: { adStarted?: () => void; adFinished?: () => void; adError?: (e: string) => void },
          ) => void;
        };
      };
    };
  }
}

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v2.js';

function sdk() { return window.CrazyGames?.SDK ?? null; }

export const crazyAdapter: PlatformAdapter = {
  name: 'crazygames',

  async tryInit() {
    if (sdk()) {
      try { await sdk()!.init(); sdk()!.game.sdkGameLoadingStop(); return true; }
      catch { return false; }
    }
    try {
      await loadScript(SDK_URL);
      if (!sdk()) return false;
      await sdk()!.init();
      sdk()!.game.sdkGameLoadingStop();
      return true;
    } catch { return false; }
  },

  gameplayStart() { sdk()?.game.gameplayStart(); },
  gameplayStop() { sdk()?.game.gameplayStop(); },

  showMidgameAd() {
    return new Promise((resolve) => {
      const s = sdk();
      if (!s) { resolve(false); return; }
      s.ad.requestAd('midgame', {
        adFinished: () => resolve(true),
        adError: () => resolve(false),
      });
    });
  },

  showRewardedAd() {
    return new Promise((resolve) => {
      const s = sdk();
      if (!s) { resolve(false); return; }
      s.ad.requestAd('rewarded', {
        adFinished: () => resolve(true),
        adError: () => resolve(false),
      });
    });
  },
};
