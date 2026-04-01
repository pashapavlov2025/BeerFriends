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

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: string;
  target: number;
  reward: number;
  gemReward: number;
}

export interface CraftedRecipe {
  id: string;
  name: string;
  emoji: string;
  parent1: string;
  parent2: string;
  tapBonus: number;
  autoBonus: number;
}

export interface BreweryRoom {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  effect: 'tapMultiplier' | 'autoMultiplier' | 'allMultiplier';
  effectValue: number;
}
