// Unified ad / gameplay-lifecycle adapter.
//
// Detects which platform the game is running on, lazy-loads that SDK, and
// routes showRewardedAd/showMidgameAd through it. If no platform SDK is
// detected (e.g. Vercel preview, itch.io, direct web), falls back to the
// in-house Brewery Lore 5-second overlay so the "rewarded UX" still works.
//
// The game code only needs the public API below — it never interacts with
// a specific platform's SDK directly.

import { detectPlatform, type Platform } from './sdk/detect';
import type { PlatformAdapter } from './sdk/types';
import { crazyAdapter } from './sdk/crazySDK';
import { pokiAdapter } from './sdk/pokiSDK';
import { gdAdapter } from './sdk/gdSDK';
import { requestLoreBreak } from '../components/BreweryLore';
import { track } from './analytics';

let active: PlatformAdapter | null = null;
let detected: Platform = 'none';
let initPromise: Promise<void> | null = null;

function adapterFor(platform: Platform): PlatformAdapter | null {
  switch (platform) {
    case 'crazygames': return crazyAdapter;
    case 'poki': return pokiAdapter;
    case 'gamedistribution': return gdAdapter;
    default: return null;
  }
}

/** Initialise the platform SDK (idempotent). */
export function initSDK(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    detected = detectPlatform();
    track('platform_detected', { platform: detected });
    const candidate = adapterFor(detected);
    if (!candidate) return;
    const ok = await candidate.tryInit();
    if (ok) {
      active = candidate;
      track('sdk_ready', { platform: candidate.name });
    } else {
      track('sdk_init_failed', { platform: detected });
    }
  })();
  return initPromise;
}

export function getActivePlatform(): Platform { return detected; }
export function getActiveAdapter(): PlatformAdapter | null { return active; }

export function gameplayStart() { active?.gameplayStart(); }
export function gameplayStop() { active?.gameplayStop(); }

/** Midgame (interstitial) ad. Falls back to the Lore overlay. */
export function showMidgameAd(): Promise<boolean> {
  if (active) return active.showMidgameAd().then(ok => {
    if (ok) track('ad_midgame_shown', { platform: active!.name });
    return ok;
  });
  return requestLoreBreak('midgame', 'Continue playing');
}

/** Rewarded ad. Falls back to the Lore overlay (5-second brewery fact). */
export function showRewardedAd(reward = '2× Boost 60s'): Promise<boolean> {
  if (active) return active.showRewardedAd().then(ok => {
    if (ok) track('ad_rewarded_shown', { platform: active!.name, reward });
    return ok;
  });
  return requestLoreBreak('rewarded', reward);
}

/** True when running inside any detected platform (not on Vercel/itch.io). */
export function isOnPlatform(): boolean { return !!active; }
