import type { BeerType } from '../types';

export const BEERS: BeerType[] = [
  { id: 'lager', name: 'Lager', emoji: '🍺', description: 'Classic light beer.', unlockCost: 0, tapBonus: 1, autoBonus: 1 },
  { id: 'ale', name: 'Ale', emoji: '🍻', description: 'Rich amber ale.', unlockCost: 500, tapBonus: 1.5, autoBonus: 1.2 },
  { id: 'stout', name: 'Stout', emoji: '🥃', description: 'Dark and robust.', unlockCost: 5_000, tapBonus: 2, autoBonus: 1.5 },
  { id: 'ipa', name: 'IPA', emoji: '🌿', description: 'Hoppy and bold.', unlockCost: 25_000, tapBonus: 3, autoBonus: 2 },
  { id: 'porter', name: 'Porter', emoji: '🫗', description: 'Smooth and chocolatey.', unlockCost: 100_000, tapBonus: 5, autoBonus: 3 },
  { id: 'imperial', name: 'Imperial', emoji: '👑', description: 'The king of beers.', unlockCost: 500_000, tapBonus: 10, autoBonus: 5 },
];

export const getBeerById = (id: string): BeerType => BEERS.find((b) => b.id === id) ?? BEERS[0];
