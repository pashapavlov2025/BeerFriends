import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // Brewing milestones
  { id: 'brew_100', name: 'Novice Brewer', emoji: '🍺', description: 'Brew 100 beers', condition: 'beersBrewed', target: 100, reward: 500, gemReward: 5 },
  { id: 'brew_1k', name: 'Apprentice Brewer', emoji: '🍺', description: 'Brew 1,000 beers', condition: 'beersBrewed', target: 1_000, reward: 5_000, gemReward: 10 },
  { id: 'brew_10k', name: 'Master Brewer', emoji: '🍺', description: 'Brew 10,000 beers', condition: 'beersBrewed', target: 10_000, reward: 50_000, gemReward: 25 },
  { id: 'brew_100k', name: 'Legendary Brewer', emoji: '🍺', description: 'Brew 100,000 beers', condition: 'beersBrewed', target: 100_000, reward: 500_000, gemReward: 50 },

  // Earnings milestones
  { id: 'earn_1k', name: 'First Profits', emoji: '🪙', description: 'Earn 1K lifetime coins', condition: 'totalCoins', target: 1_000, reward: 200, gemReward: 5 },
  { id: 'earn_100k', name: 'Beer Mogul', emoji: '🪙', description: 'Earn 100K lifetime coins', condition: 'totalCoins', target: 100_000, reward: 10_000, gemReward: 15 },
  { id: 'earn_1m', name: 'Millionaire', emoji: '💰', description: 'Earn 1M lifetime coins', condition: 'totalCoins', target: 1_000_000, reward: 100_000, gemReward: 30 },
  { id: 'earn_100m', name: 'Beer Empire', emoji: '💎', description: 'Earn 100M lifetime coins', condition: 'totalCoins', target: 100_000_000, reward: 5_000_000, gemReward: 75 },
  { id: 'earn_1b', name: 'Billionaire Brewer', emoji: '👑', description: 'Earn 1B lifetime coins', condition: 'totalCoins', target: 1_000_000_000, reward: 50_000_000, gemReward: 150 },

  // Upgrade milestones
  { id: 'upgrades_10', name: 'Getting Started', emoji: '⬆️', description: 'Buy 10 total upgrades', condition: 'totalUpgrades', target: 10, reward: 1_000, gemReward: 5 },
  { id: 'upgrades_50', name: 'Dedicated', emoji: '⬆️', description: 'Buy 50 total upgrades', condition: 'totalUpgrades', target: 50, reward: 25_000, gemReward: 20 },
  { id: 'upgrades_100', name: 'Fully Loaded', emoji: '⬆️', description: 'Buy 100 total upgrades', condition: 'totalUpgrades', target: 100, reward: 200_000, gemReward: 40 },

  // Collection milestones
  { id: 'collect_all', name: 'Beer Connoisseur', emoji: '📖', description: 'Unlock all 6 beer types', condition: 'unlockedBeersCount', target: 6, reward: 100_000, gemReward: 50 },

  // Prestige milestones
  { id: 'prestige_1', name: 'Reborn', emoji: '⭐', description: 'Prestige for the first time', condition: 'prestigeLevel', target: 1, reward: 0, gemReward: 25 },
  { id: 'prestige_5', name: 'Veteran', emoji: '⭐', description: 'Reach prestige level 5', condition: 'prestigeLevel', target: 5, reward: 0, gemReward: 75 },
  { id: 'prestige_10', name: 'Legend', emoji: '⭐', description: 'Reach prestige level 10', condition: 'prestigeLevel', target: 10, reward: 0, gemReward: 150 },

  // Crafting milestones
  { id: 'craft_1', name: 'First Recipe', emoji: '🧪', description: 'Craft your first recipe', condition: 'recipesCount', target: 1, reward: 10_000, gemReward: 15 },
  { id: 'craft_3', name: 'Mixologist', emoji: '🧪', description: 'Craft 3 recipes', condition: 'recipesCount', target: 3, reward: 50_000, gemReward: 30 },
  { id: 'craft_5', name: 'Recipe Master', emoji: '🧪', description: 'Craft 5 recipes', condition: 'recipesCount', target: 5, reward: 250_000, gemReward: 60 },

  // Brewery rooms
  { id: 'rooms_1', name: 'Expanding', emoji: '🏗️', description: 'Build your first room', condition: 'roomsCount', target: 1, reward: 5_000, gemReward: 10 },
  { id: 'rooms_all', name: 'Full Brewery', emoji: '🏭', description: 'Build all brewery rooms', condition: 'roomsCount', target: 5, reward: 500_000, gemReward: 100 },
];

export const getAchievementById = (id: string): Achievement =>
  ACHIEVEMENTS.find((a) => a.id === id) ?? ACHIEVEMENTS[0];
