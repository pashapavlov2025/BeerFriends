export type Platform = 'crazygames' | 'poki' | 'gamedistribution' | 'none';

// Decide which platform SDK (if any) to try loading. We avoid loading an SDK
// unless we're reasonably sure the game is running on that platform, because
// third-party ad scripts on an unrelated host (e.g. Vercel preview, itch.io)
// can trigger CSP warnings or get rejected by the platform's QA.
//
// Precedence (highest first):
// 1. `?platform=...` URL query param — explicit override, handy for testing.
// 2. `document.referrer` hostname contains a known platform domain.
// 3. The window hostname itself matches a known platform (rare — only when
//    the platform proxies through their own domain).
export function detectPlatform(): Platform {
  try {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('platform');
    if (forced === 'crazy' || forced === 'crazygames') return 'crazygames';
    if (forced === 'poki') return 'poki';
    if (forced === 'gd' || forced === 'gamedistribution') return 'gamedistribution';

    const refHost = (() => {
      try { return new URL(document.referrer).hostname; } catch { return ''; }
    })();
    const host = window.location.hostname;
    const anyHost = `${refHost} ${host}`.toLowerCase();

    if (anyHost.includes('crazygames')) return 'crazygames';
    if (anyHost.includes('poki.com') || anyHost.includes('poki-gdn.com')) return 'poki';
    if (anyHost.includes('gamedistribution') || anyHost.includes('gamemonetize')) return 'gamedistribution';
  } catch {
    // no-op — fall through to 'none'
  }
  return 'none';
}
