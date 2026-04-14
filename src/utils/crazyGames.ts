// CrazyGames SDK v2 wrapper (+ Brewery Lore fallback for other platforms)
// SDK is loaded via <script> in index.html, available as window.CrazyGames
import { requestLoreBreak } from '../components/BreweryLore';

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
            callbacks: {
              adStarted?: () => void;
              adFinished?: () => void;
              adError?: (error: string) => void;
            }
          ) => void;
        };
        user: {
          isUserAccountAvailable: boolean;
        };
      };
    };
  }
}

function getSDK() {
  return window.CrazyGames?.SDK ?? null;
}

export function initSDK() {
  const sdk = getSDK();
  if (sdk) {
    sdk.init().catch(() => {});
    sdk.game.sdkGameLoadingStop();
  }
}

export function gameplayStart() {
  getSDK()?.game.gameplayStart();
}

export function gameplayStop() {
  getSDK()?.game.gameplayStop();
}

/** Show a midgame (interstitial) ad. Falls back to Brewery Lore overlay. */
export function showMidgameAd(): Promise<boolean> {
  const sdk = getSDK();
  if (sdk) {
    return new Promise((resolve) => {
      sdk.ad.requestAd('midgame', {
        adStarted: () => {},
        adFinished: () => resolve(true),
        adError: () => resolve(false),
      });
    });
  }
  return requestLoreBreak('midgame', 'Continue playing');
}

/** Show a rewarded ad. Falls back to Brewery Lore overlay (5s fact screen). */
export function showRewardedAd(reward = '2× Boost 60s'): Promise<boolean> {
  const sdk = getSDK();
  if (sdk) {
    return new Promise((resolve) => {
      sdk.ad.requestAd('rewarded', {
        adStarted: () => {},
        adFinished: () => resolve(true),
        adError: () => resolve(false),
      });
    });
  }
  return requestLoreBreak('rewarded', reward);
}

/** Check if running inside CrazyGames */
export function isCrazyGames(): boolean {
  return !!getSDK();
}
