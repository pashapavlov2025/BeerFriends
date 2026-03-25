import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GameActions } from '../types';
import { GAME_CONSTANTS } from '../data/constants';
import { getBeerById } from '../data/beers';
import { UPGRADES, getUpgradeCost, getUpgradeById } from '../data/upgrades';
import { calculateIdleEarnings } from '../utils/idleEarnings';

const STORAGE_KEY = 'beerfriends_game_state';

const initialState: GameState = {
  coins: 0,
  totalCoins: 0,
  tapPower: GAME_CONSTANTS.BASE_TAP_POWER,
  autoBrewRate: GAME_CONSTANTS.BASE_AUTO_BREW_RATE,
  beersBrewed: 0,
  upgrades: {},
  unlockedBeers: ['lager'],
  currentBeer: 'lager',
  prestigeLevel: 0,
  prestigeMultiplier: 1,
  lastOnlineAt: Date.now(),
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  tap: () => {
    const state = get();
    const beer = getBeerById(state.currentBeer);
    const earned = state.tapPower * beer.tapBonus * state.prestigeMultiplier;
    set({
      coins: state.coins + earned,
      totalCoins: state.totalCoins + earned,
      beersBrewed: state.beersBrewed + 1,
    });
  },

  tick: () => {
    const state = get();
    if (state.autoBrewRate <= 0) return;
    const beer = getBeerById(state.currentBeer);
    const earned = state.autoBrewRate * beer.autoBonus * state.prestigeMultiplier;
    set({
      coins: state.coins + earned,
      totalCoins: state.totalCoins + earned,
    });
  },

  buyUpgrade: (id: string) => {
    const state = get();
    const upgrade = getUpgradeById(id);
    const currentLevel = state.upgrades[id] ?? 0;

    if (currentLevel >= upgrade.maxLevel) return;

    const cost = getUpgradeCost(upgrade, currentLevel);
    if (state.coins < cost) return;

    const newLevel = currentLevel + 1;
    const newUpgrades = { ...state.upgrades, [id]: newLevel };

    // Recalculate tapPower and autoBrewRate from all upgrades
    let tapPower = GAME_CONSTANTS.BASE_TAP_POWER;
    let autoBrewRate = GAME_CONSTANTS.BASE_AUTO_BREW_RATE;

    for (const u of UPGRADES) {
      const level = newUpgrades[u.id] ?? 0;
      if (u.effect === 'tapPower') {
        tapPower += u.baseEffect * level;
      } else {
        autoBrewRate += u.baseEffect * level;
      }
    }

    set({
      coins: state.coins - cost,
      upgrades: newUpgrades,
      tapPower,
      autoBrewRate,
    });
  },

  unlockBeer: (id: string) => {
    const state = get();
    if (state.unlockedBeers.includes(id)) return;
    const beer = getBeerById(id);
    if (state.coins < beer.unlockCost) return;

    set({
      coins: state.coins - beer.unlockCost,
      unlockedBeers: [...state.unlockedBeers, id],
    });
  },

  selectBeer: (id: string) => {
    const state = get();
    if (!state.unlockedBeers.includes(id)) return;
    set({ currentBeer: id });
  },

  prestige: () => {
    const state = get();
    if (state.totalCoins < GAME_CONSTANTS.PRESTIGE_COST) return;

    const newPrestigeLevel = state.prestigeLevel + 1;
    set({
      ...initialState,
      prestigeLevel: newPrestigeLevel,
      prestigeMultiplier: 1 + GAME_CONSTANTS.PRESTIGE_BONUS * newPrestigeLevel,
      lastOnlineAt: Date.now(),
    });
  },

  addAutoBrewEarnings: (seconds: number) => {
    const state = get();
    const beer = getBeerById(state.currentBeer);
    const earned = state.autoBrewRate * beer.autoBonus * state.prestigeMultiplier * seconds * GAME_CONSTANTS.IDLE_EFFICIENCY;
    if (earned <= 0) return;
    set({
      coins: state.coins + earned,
      totalCoins: state.totalCoins + earned,
    });
  },

  calculateIdleEarnings: () => {
    const state = get();
    const beer = getBeerById(state.currentBeer);
    return calculateIdleEarnings(
      state.autoBrewRate,
      state.lastOnlineAt,
      state.prestigeMultiplier,
      beer.autoBonus
    );
  },

  saveGame: async () => {
    const state = get();
    const saveData: GameState = {
      coins: state.coins,
      totalCoins: state.totalCoins,
      tapPower: state.tapPower,
      autoBrewRate: state.autoBrewRate,
      beersBrewed: state.beersBrewed,
      upgrades: state.upgrades,
      unlockedBeers: state.unlockedBeers,
      currentBeer: state.currentBeer,
      prestigeLevel: state.prestigeLevel,
      prestigeMultiplier: state.prestigeMultiplier,
      lastOnlineAt: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  },

  loadGame: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: GameState = JSON.parse(data);
        set({ ...parsed });
      }
    } catch {
      // If load fails, keep initial state
    }
  },

  resetGame: () => {
    set({ ...initialState, lastOnlineAt: Date.now() });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
