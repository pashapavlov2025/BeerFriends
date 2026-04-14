// Thin analytics wrapper around @vercel/analytics.
// Safe to call from anywhere — falls back to no-op if the Vercel script is
// blocked (e.g. when the game runs inside a platform iframe).
import { track as vercelTrack } from '@vercel/analytics';

type EventProps = Record<string, string | number | boolean | null>;

export function track(event: string, props?: EventProps) {
  try {
    vercelTrack(event, props);
  } catch {
    // swallow — analytics should never break the game
  }
}
