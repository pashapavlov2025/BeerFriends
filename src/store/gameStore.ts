import { create } from 'zustand';
import { getBeerById } from '../data/beers';
import { UPGRADES, getUpgradeCost, getUpgradeById } from '../data/upgrades';
import { ACHIEVEMENTS } from '../data/achievements';
import { BREWERY_ROOMS } from '../data/breweryRooms';
import { getCraftCost, calculateRecipeBonus, MAX_RECIPES } from '../data/recipes';
import type { CraftedRecipe } from '../types';

const STORAGE_KEY = 'beerfriends_save';
const PRESTIGE_COST = 10_000_000;
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
  boostMultiplier: number;
  lastOnlineAt: number;
  // Achievements
  claimedAchievements: string[];
  // Crafting
  recipes: CraftedRecipe[];
  // Brewery rooms
  builtRooms: string[];
  // Premium
  gems: number;
  adsRemoved: boolean;
  goldenSkin: boolean;
  autoTapEnabled: boolean;
}

interface GameActions {
  tap: () => void;
  tick: () => void;
  buyUpgrade: (id: string) => void;
  unlockBeer: (id: string) => void;
  selectBeer: (id: string) => void;
  prestige: () => void;
  addCoins: (amount: number) => void;
  setBoostMultiplier: (mult: number) => void;
  saveGame: () => void;
  loadGame: () => void;
  resetGame: () => void;
  // Achievements
  claimAchievement: (id: string) => void;
  getAchievementProgress: (condition: string) => number;
  // Crafting
  craftRecipe: (beer1Id: string, beer2Id: string) => boolean;
  // Brewery rooms
  buildRoom: (id: string) => void;
  // Premium
  addGems: (amount: number) => void;
  buyRemoveAds: () => void;
  buyGoldenSkin: () => void;
  buyAutoTap: () => void;
  // Room multipliers
  getRoomTapMultiplier: () => number;
  getRoomAutoMultiplier: () => number;
  getRoomAllMultiplier: () => number;
}

const initialState: GameState = {
  coins: 0, totalCoins: 0, tapPower: 1, autoBrewRate: 0, beersBrewed: 0,
  upgrades: {}, unlockedBeers: ['lager'], currentBeer: 'lager',
  prestigeLevel: 0, prestigeMultiplier: 1, boostMultiplier: 1, lastOnlineAt: Date.now(),
  claimedAchievements: [],
  recipes: [],
  builtRooms: [],
  gems: 0,
  adsRemoved: false,
  goldenSkin: false,
  autoTapEnabled: false,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  getRoomTapMultiplier: () => {
    const s = get();
    let mult = 1;
    for (const roomId of s.builtRooms) {
      const room = BREWERY_ROOMS.find(r => r.id === roomId);
      if (room?.effect === 'tapMultiplier') mult += room.effectValue;
      if (room?.effect === 'allMultiplier') mult += room.effectValue;
    }
    return mult;
  },

  getRoomAutoMultiplier: () => {
    const s = get();
    let mult = 1;
    for (const roomId of s.builtRooms) {
      const room = BREWERY_ROOMS.find(r => r.id === roomId);
      if (room?.effect === 'autoMultiplier') mult += room.effectValue;
      if (room?.effect === 'allMultiplier') mult += room.effectValue;
    }
    return mult;
  },

  getRoomAllMultiplier: () => {
    const s = get();
    let mult = 1;
    for (const roomId of s.builtRooms) {
      const room = BREWERY_ROOMS.find(r => r.id === roomId);
      if (room?.effect === 'allMultiplier') mult += room.effectValue;
    }
    return mult;
  },

  tap: () => {
    const s = get();
    const beer = getBeerById(s.currentBeer);
    const recipe = s.recipes.find(r => r.id === s.currentBeer);
    const tapBonus = recipe ? recipe.tapBonus : beer.tapBonus;
    const roomTapMult = get().getRoomTapMultiplier();
    const earned = s.tapPower * tapBonus * s.prestigeMultiplier * s.boostMultiplier * roomTapMult;
    set({ coins: s.coins + earned, totalCoins: s.totalCoins + earned, beersBrewed: s.beersBrewed + 1 });
  },

  tick: () => {
    const s = get();
    // Auto-tap: 2 taps per second
    if (s.autoTapEnabled) {
      const beer = getBeerById(s.currentBeer);
      const recipe = s.recipes.find(r => r.id === s.currentBeer);
      const tapBonus = recipe ? recipe.tapBonus : beer.tapBonus;
      const roomTapMult = get().getRoomTapMultiplier();
      const autoTapEarned = s.tapPower * tapBonus * s.prestigeMultiplier * s.boostMultiplier * roomTapMult * 2;
      set(prev => ({
        coins: prev.coins + autoTapEarned,
        totalCoins: prev.totalCoins + autoTapEarned,
        beersBrewed: prev.beersBrewed + 2,
      }));
    }
    if (s.autoBrewRate <= 0) return;
    const beer = getBeerById(s.currentBeer);
    const recipe = s.recipes.find(r => r.id === s.currentBeer);
    const autoBonus = recipe ? recipe.autoBonus : beer.autoBonus;
    const roomAutoMult = get().getRoomAutoMultiplier();
    const earned = s.autoBrewRate * autoBonus * s.prestigeMultiplier * s.boostMultiplier * roomAutoMult;
    set(prev => ({ coins: prev.coins + earned, totalCoins: prev.totalCoins + earned }));
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
    const s = get();
    const isUnlockedBeer = s.unlockedBeers.includes(id);
    const isRecipe = s.recipes.some(r => r.id === id);
    if (!isUnlockedBeer && !isRecipe) return;
    set({ currentBeer: id });
  },

  prestige: () => {
    const s = get();
    if (s.totalCoins < PRESTIGE_COST) return;
    const newLevel = s.prestigeLevel + 1;
    set({
      ...initialState,
      prestigeLevel: newLevel,
      prestigeMultiplier: 1 + PRESTIGE_BONUS * newLevel,
      lastOnlineAt: Date.now(),
      // Persist across prestige
      claimedAchievements: s.claimedAchievements,
      recipes: s.recipes,
      builtRooms: s.builtRooms,
      gems: s.gems,
      adsRemoved: s.adsRemoved,
      goldenSkin: s.goldenSkin,
      autoTapEnabled: s.autoTapEnabled,
    });
  },

  addCoins: (amount: number) => {
    const s = get();
    set({ coins: s.coins + amount, totalCoins: s.totalCoins + amount });
  },

  setBoostMultiplier: (mult: number) => {
    set({ boostMultiplier: mult });
  },

  // Achievements
  claimAchievement: (id: string) => {
    const s = get();
    if (s.claimedAchievements.includes(id)) return;
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;
    const progress = get().getAchievementProgress(achievement.condition);
    if (progress < achievement.target) return;
    set({
      coins: s.coins + achievement.reward,
      totalCoins: s.totalCoins + achievement.reward,
      gems: s.gems + achievement.gemReward,
      claimedAchievements: [...s.claimedAchievements, id],
    });
  },

  getAchievementProgress: (condition: string) => {
    const s = get();
    switch (condition) {
      case 'beersBrewed': return s.beersBrewed;
      case 'totalCoins': return s.totalCoins;
      case 'totalUpgrades': return Object.values(s.upgrades).reduce((sum, lv) => sum + lv, 0);
      case 'unlockedBeersCount': return s.unlockedBeers.length;
      case 'prestigeLevel': return s.prestigeLevel;
      case 'recipesCount': return s.recipes.length;
      case 'roomsCount': return s.builtRooms.length;
      default: return 0;
    }
  },

  // Crafting
  craftRecipe: (beer1Id: string, beer2Id: string) => {
    const s = get();
    if (s.recipes.length >= MAX_RECIPES) return false;
    if (!s.unlockedBeers.includes(beer1Id) || !s.unlockedBeers.includes(beer2Id)) return false;
    if (beer1Id === beer2Id) return false;
    // Check if this combo already exists
    const exists = s.recipes.some(r =>
      (r.parent1 === beer1Id && r.parent2 === beer2Id) ||
      (r.parent1 === beer2Id && r.parent2 === beer1Id)
    );
    if (exists) return false;
    const cost = getCraftCost(s.recipes.length);
    if (s.coins < cost) return false;
    const beer1 = getBeerById(beer1Id);
    const beer2 = getBeerById(beer2Id);
    const bonuses = calculateRecipeBonus(beer1.tapBonus, beer2.tapBonus, beer1.autoBonus, beer2.autoBonus);
    const recipe: CraftedRecipe = {
      id: `recipe_${beer1Id}_${beer2Id}`,
      name: `${beer1.name} × ${beer2.name}`,
      emoji: '🧪',
      parent1: beer1Id,
      parent2: beer2Id,
      tapBonus: bonuses.tapBonus,
      autoBonus: bonuses.autoBonus,
    };
    set({ coins: s.coins - cost, recipes: [...s.recipes, recipe] });
    return true;
  },

  // Brewery rooms
  buildRoom: (id: string) => {
    const s = get();
    if (s.builtRooms.includes(id)) return;
    const room = BREWERY_ROOMS.find(r => r.id === id);
    if (!room) return;
    if (s.coins < room.cost) return;
    set({ coins: s.coins - room.cost, builtRooms: [...s.builtRooms, id] });
  },

  // Premium
  addGems: (amount: number) => {
    set(s => ({ gems: s.gems + amount }));
  },

  buyRemoveAds: () => {
    const s = get();
    if (s.gems < 500 || s.adsRemoved) return;
    set({ gems: s.gems - 500, adsRemoved: true });
  },

  buyGoldenSkin: () => {
    const s = get();
    if (s.gems < 200 || s.goldenSkin) return;
    set({ gems: s.gems - 200, goldenSkin: true });
  },

  buyAutoTap: () => {
    const s = get();
    if (s.gems < 300 || s.autoTapEnabled) return;
    set({ gems: s.gems - 300, autoTapEnabled: true });
  },

  saveGame: () => {
    const s = get();
    const data: GameState = {
      coins: s.coins, totalCoins: s.totalCoins, tapPower: s.tapPower, autoBrewRate: s.autoBrewRate,
      beersBrewed: s.beersBrewed, upgrades: s.upgrades, unlockedBeers: s.unlockedBeers,
      currentBeer: s.currentBeer, prestigeLevel: s.prestigeLevel, prestigeMultiplier: s.prestigeMultiplier,
      boostMultiplier: s.boostMultiplier, lastOnlineAt: Date.now(),
      claimedAchievements: s.claimedAchievements,
      recipes: s.recipes,
      builtRooms: s.builtRooms,
      gems: s.gems,
      adsRemoved: s.adsRemoved,
      goldenSkin: s.goldenSkin,
      autoTapEnabled: s.autoTapEnabled,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<GameState>;
        const merged = { ...initialState, ...data };
        const secondsAway = (Date.now() - merged.lastOnlineAt) / 1000;
        const beer = getBeerById(merged.currentBeer);
        const idleEarnings = Math.min(secondsAway, 8 * 3600) * merged.autoBrewRate * beer.autoBonus * merged.prestigeMultiplier * 0.5;
        set({ ...merged, coins: merged.coins + idleEarnings, totalCoins: merged.totalCoins + idleEarnings });
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
