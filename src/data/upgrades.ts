import { Upgrade } from '../types';

export const UPGRADES: Upgrade[] = [
  {
    id: 'better_tap',
    name: 'Better Tap',
    emoji: '👆',
    description: '+1 coins per tap',
    baseCost: 10,
    costMultiplier: 1.15,
    effect: 'tapPower',
    baseEffect: 1,
    maxLevel: 100,
  },
  {
    id: 'auto_brewer',
    name: 'Auto Brewer',
    emoji: '🤖',
    description: '+0.5 coins/sec auto-brew',
    baseCost: 50,
    costMultiplier: 1.2,
    effect: 'autoBrewRate',
    baseEffect: 0.5,
    maxLevel: 100,
  },
  {
    id: 'brew_master',
    name: 'Brew Master',
    emoji: '🎓',
    description: '+5 coins per tap',
    baseCost: 200,
    costMultiplier: 1.25,
    effect: 'tapPower',
    baseEffect: 5,
    maxLevel: 50,
  },
  {
    id: 'fermentor',
    name: 'Fermentor',
    emoji: '🧪',
    description: '+3 coins/sec auto-brew',
    baseCost: 1_000,
    costMultiplier: 1.3,
    effect: 'autoBrewRate',
    baseEffect: 3,
    maxLevel: 50,
  },
  {
    id: 'brewery_line',
    name: 'Brewery Line',
    emoji: '🏭',
    description: '+20 coins/sec auto-brew',
    baseCost: 10_000,
    costMultiplier: 1.35,
    effect: 'autoBrewRate',
    baseEffect: 20,
    maxLevel: 30,
  },
  {
    id: 'golden_tap',
    name: 'Golden Tap',
    emoji: '✨',
    description: '+50 coins per tap',
    baseCost: 50_000,
    costMultiplier: 1.4,
    effect: 'tapPower',
    baseEffect: 50,
    maxLevel: 20,
  },
];

export const getUpgradeCost = (upgrade: Upgrade, level: number): number =>
  Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));

export const getUpgradeById = (id: string): Upgrade =>
  UPGRADES.find((u) => u.id === id) ?? UPGRADES[0];
