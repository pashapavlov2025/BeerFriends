import { BEERS, getBeerById } from '../src/data/beers';

describe('Beer definitions', () => {
  it('has 6 beer types', () => {
    expect(BEERS).toHaveLength(6);
  });

  it('lager is free', () => {
    const lager = getBeerById('lager');
    expect(lager.unlockCost).toBe(0);
    expect(lager.tapBonus).toBe(1);
    expect(lager.autoBonus).toBe(1);
  });

  it('beers increase in cost and bonus', () => {
    for (let i = 1; i < BEERS.length; i++) {
      expect(BEERS[i].unlockCost).toBeGreaterThan(BEERS[i - 1].unlockCost);
      expect(BEERS[i].tapBonus).toBeGreaterThanOrEqual(BEERS[i - 1].tapBonus);
    }
  });

  it('imperial has highest bonuses', () => {
    const imperial = getBeerById('imperial');
    expect(imperial.tapBonus).toBe(10);
    expect(imperial.autoBonus).toBe(5);
    expect(imperial.unlockCost).toBe(500_000);
  });
});
