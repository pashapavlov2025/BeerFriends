import { UPGRADES, getUpgradeCost, getUpgradeById } from '../src/data/upgrades';

describe('Upgrade definitions', () => {
  it('has 6 upgrades', () => {
    expect(UPGRADES).toHaveLength(6);
  });

  it('all have required fields', () => {
    for (const u of UPGRADES) {
      expect(u.id).toBeTruthy();
      expect(u.name).toBeTruthy();
      expect(u.emoji).toBeTruthy();
      expect(u.baseCost).toBeGreaterThan(0);
      expect(u.costMultiplier).toBeGreaterThan(1);
      expect(u.maxLevel).toBeGreaterThan(0);
      expect(['tapPower', 'autoBrewRate']).toContain(u.effect);
    }
  });
});

describe('getUpgradeCost', () => {
  const upgrade = UPGRADES[0]; // Better Tap: baseCost=10, mult=1.15

  it('returns baseCost at level 0', () => {
    expect(getUpgradeCost(upgrade, 0)).toBe(10);
  });

  it('scales exponentially', () => {
    const costLv1 = getUpgradeCost(upgrade, 1);
    expect(costLv1).toBe(Math.floor(10 * 1.15));

    const costLv10 = getUpgradeCost(upgrade, 10);
    expect(costLv10).toBe(Math.floor(10 * Math.pow(1.15, 10)));
  });

  it('gets expensive at high levels', () => {
    const costLv50 = getUpgradeCost(upgrade, 50);
    expect(costLv50).toBeGreaterThan(1000);
  });
});

describe('getUpgradeById', () => {
  it('finds upgrade by id', () => {
    const u = getUpgradeById('auto_brewer');
    expect(u.name).toBe('Auto Brewer');
  });

  it('returns first upgrade for unknown id', () => {
    const u = getUpgradeById('nonexistent');
    expect(u.id).toBe('better_tap');
  });
});
