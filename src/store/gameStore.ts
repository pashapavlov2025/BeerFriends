import { create } from 'zustand';
import { getBeerById } from '../data/beers';
import { UPGRADES, getUpgradeCost, getUpgradeById } from '../data/upgrades';

const STORAGE_KEY = 'beerfriends_save';
const PRESTIGE_COST = 1_000_000;
const PRESTIGE_BONUS = 0.1;

interface GameState {
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

interface GameActions {
  tap: () => void;
  tick: () => void;
  buyUpgrade: (id: string) => void;
  unlockBeer: (id: string) => void;
  selectBeer: (id: string) => void;
  prestige: () => void;
  saveGame: () => void;
  loadGame: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  coins: 0, totalCoins: 0, tapPower: 1, autoBrewRate: 0, beersBrewed: 0,
  upgrades: {}, unlockedBeers: ['lager'], currentBeer: 'lager',
  prestigeLevel: 0, prestigeMultiplier: 1, lastOnlineAt: Date.now(),
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  tap: () => {
    const s = get();
    const beer = getBeerById(s.currentBeer);
    const earned = s.tapPower * beer.tapBonus * s.prestigeMultiplier;
    set({ coins: s.coins + earned, totalCoins: s.totalCoins + earned, beersBrewed: s.beersBrewed + 1 });
  },

  tick: () => {
    const s = get();
    if (s.autoBrewRate <= 0) return;
    const beer = getBeerById(s.currentBeer);
    const earned = s.autoBrewRate * beer.autoBonus * s.prestigeMultiplier;
    set({ coins: s.coins + earned, totalCoins: s.totalCoins + earned });
  },

  buyUpgrade: (id: string) => {
    const s = get();
    const upgrade = getUpgradeById(id);
    const level = s.upgrades[id] ?? 0;
    if (level >= upgrade.maxLevel) return;
    const cost = getUpgradeCost(upgrade, level);
    if (s.coins < cost) return;
    const newUpgrades = { ...s.upgrades, [id]: level + 1 };
    let tapPower = 1, autoBrewRate = 0;
    for (const u of UPGRADES) {
      const lv = newUpgrades[u.id] ?? 0;
      if (u.effect === 'tapPower') tapPower += u.baseEffect * lv;
      else autoBrewRate += u.baseEffect * lv;
    }
    set({ coins: s.coins - cost, upgrades: newUpgrades, tapPower, autoBrewRate });
  },

  unlockBeer: (id: string) => {
    const s = get();
    if (s.unlockedBeers.includes(id)) return;
    const beer = getBeerById(id);
    if (s.coins < beer.unlockCost) return;
    set({ coins: s.coins - beer.unlockCost, unlockedBeers: [...s.unlockedBeers, id] });
  },

  selectBeer: (id: string) => {
    if (!get().unlockedBeers.includes(id)) return;
    set({ currentBeer: id });
  },

  prestige: () => {
    const s = get();
    if (s.totalCoins < PRESTIGE_COST) return;
    const newLevel = s.prestigeLevel + 1;
    set({ ...initialState, prestigeLevel: newLevel, prestigeMultiplier: 1 + PRESTIGE_BONUS * newLevel, lastOnlineAt: Date.now() });
  },

  saveGame: () => {
    const s = get();
    const data: GameState = {
      coins: s.coins, totalCoins: s.totalCoins, tapPower: s.tapPower, autoBrewRate: s.autoBrewRate,
      beersBrewed: s.beersBrewed, upgrades: s.upgrades, unlockedBeers: s.unlockedBeers,
      currentBeer: s.currentBeer, prestigeLevel: s.prestigeLevel, prestigeMultiplier: s.prestigeMultiplier,
      lastOnlineAt: Date.now(),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as GameState;
        const secondsAway = (Date.now() - data.lastOnlineAt) / 1000;
        const beer = getBeerById(data.currentBeer);
        const idleEarnings = Math.min(secondsAway, 8 * 3600) * data.autoBrewRate * beer.autoBonus * data.prestigeMultiplier * 0.5;
        set({ ...data, coins: data.coins + idleEarnings, totalCoins: data.totalCoins + idleEarnings });
        if (idleEarnings > 1) {
          setTimeout(() => alert(`🍺 Welcome back! You earned ${Math.floor(idleEarnings)} coins while away!`), 500);
        }
      }
    } catch {}
  },

  resetGame: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ ...initialState, lastOnlineAt: Date.now() });
  },
}));
