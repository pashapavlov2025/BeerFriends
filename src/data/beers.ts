import type { BeerType } from '../types';

export const BEERS: BeerType[] = [
  { id: 'lager', name: 'Lager', emoji: '🍺', description: 'Classic light beer.', unlockCost: 0, tapBonus: 1, autoBonus: 1 },
  { id: 'ale', name: 'Ale', emoji: '🍻', description: 'Rich amber ale.', unlockCost: 2_000, tapBonus: 1.3, autoBonus: 1.15 },
  { id: 'stout', name: 'Stout', emoji: '🥃', description: 'Dark and robust.', unlockCost: 20_000, tapBonus: 1.7, autoBonus: 1.35 },
  { id: 'ipa', name: 'IPA', emoji: '🌿', description: 'Hoppy and bold.', unlockCost: 150_000, tapBonus: 2.2, autoBonus: 1.6 },
  { id: 'porter', name: 'Porter', emoji: '🫗', description: 'Smooth and chocolatey.', unlockCost: 750_000, tapBonus: 3, autoBonus: 2 },
  { id: 'imperial', name: 'Imperial', emoji: '👑', description: 'The king of beers.', unlockCost: 5_000_000, tapBonus: 5, autoBonus: 3 },
];

export const getBeerById = (id: string): BeerType => BEERS.find((b) => b.id === id) ?? BEERS[0];
