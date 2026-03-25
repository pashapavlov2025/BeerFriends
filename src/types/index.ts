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

export interface GameState {
  coins: number;
  totalCoins: number;
  tapPower: number;
  autoBrewRate: number;
  beersBrewed: number;
  upgrades: Record<string, number>;
  unlockedBeers: string[];
  currentBeer: string;
  prestigeLevel: number;
  prestigeMultiplier: number;
  lastOnlineAt: number;
}

export interface GameActions {
  tap: () => void;
  buyUpgrade: (id: string) => void;
  unlockBeer: (id: string) => void;
  selectBeer: (id: string) => void;
  prestige: () => void;
  addAutoBrewEarnings: (seconds: number) => void;
  calculateIdleEarnings: () => number;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  resetGame: () => void;
  tick: () => void;
}
