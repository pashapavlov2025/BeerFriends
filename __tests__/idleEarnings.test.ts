import { calculateIdleEarnings } from '../src/utils/idleEarnings';

describe('calculateIdleEarnings', () => {
  it('returns 0 when autoBrewRate is 0', () => {
    const result = calculateIdleEarnings(0, Date.now() - 60000, 1, 1);
    expect(result).toBe(0);
  });

  it('returns 0 when lastOnlineAt is 0', () => {
    const result = calculateIdleEarnings(10, 0, 1, 1);
    expect(result).toBe(0);
  });

  it('calculates earnings for 1 minute offline', () => {
    const oneMinuteAgo = Date.now() - 60_000;
    const result = calculateIdleEarnings(10, oneMinuteAgo, 1, 1);
    // 60 seconds * 10 rate * 1 autoBonus * 1 prestige * 0.5 efficiency = 300
    expect(result).toBeCloseTo(300, 0);
  });

  it('applies prestige multiplier', () => {
    const oneMinuteAgo = Date.now() - 60_000;
    const result = calculateIdleEarnings(10, oneMinuteAgo, 2, 1);
    // 60 * 10 * 1 * 2 * 0.5 = 600
    expect(result).toBeCloseTo(600, 0);
  });

  it('applies beer auto bonus', () => {
    const oneMinuteAgo = Date.now() - 60_000;
    const result = calculateIdleEarnings(10, oneMinuteAgo, 1, 3);
    // 60 * 10 * 3 * 1 * 0.5 = 900
    expect(result).toBeCloseTo(900, 0);
  });

  it('caps at 8 hours', () => {
    const twentyHoursAgo = Date.now() - 20 * 3600 * 1000;
    const result = calculateIdleEarnings(10, twentyHoursAgo, 1, 1);
    // capped at 8*3600 = 28800 sec * 10 * 1 * 1 * 0.5 = 144000
    const eightHourResult = 28800 * 10 * 1 * 1 * 0.5;
    expect(result).toBeCloseTo(eightHourResult, 0);
  });
});
