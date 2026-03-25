// CrazyGames SDK v2 wrapper
// SDK is loaded via <script> in index.html, available as window.CrazyGames

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

/** Show a midgame (interstitial) ad. Returns a promise that resolves when done. */
export function showMidgameAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const sdk = getSDK();
    if (!sdk) { resolve(false); return; }
    sdk.ad.requestAd('midgame', {
      adStarted: () => {},
      adFinished: () => resolve(true),
      adError: () => resolve(false),
    });
  });
}

/** Show a rewarded ad. Returns true if user watched the full ad. */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const sdk = getSDK();
    if (!sdk) { resolve(false); return; }
    sdk.ad.requestAd('rewarded', {
      adStarted: () => {},
      adFinished: () => resolve(true),
      adError: () => resolve(false),
    });
  });
}

/** Check if running inside CrazyGames */
export function isCrazyGames(): boolean {
  return !!getSDK();
}
