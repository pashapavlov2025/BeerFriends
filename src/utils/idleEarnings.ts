import { GAME_CONSTANTS } from '../data/constants';

export const calculateIdleEarnings = (
  autoBrewRate: number,
  lastOnlineAt: number,
  prestigeMultiplier: number,
  autoBonus: number
): number => {
  if (autoBrewRate <= 0 || lastOnlineAt <= 0) return 0;

  const now = Date.now();
  const secondsOffline = (now - lastOnlineAt) / 1000;
  const maxSeconds = GAME_CONSTANTS.MAX_IDLE_HOURS * 3600;
  const cappedSeconds = Math.min(secondsOffline, maxSeconds);

  return cappedSeconds * autoBrewRate * autoBonus * prestigeMultiplier * GAME_CONSTANTS.IDLE_EFFICIENCY;
};
