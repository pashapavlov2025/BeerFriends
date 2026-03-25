export interface BeerType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockCost: number;
  tapBonus: number;
  autoBonus: number;
}

export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  effect: 'tapPower' | 'autoBrewRate';
  baseEffect: number;
  maxLevel: number;
}
