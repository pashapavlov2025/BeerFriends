import type { BreweryRoom } from '../types';

export const BREWERY_ROOMS: BreweryRoom[] = [
  { id: 'malt_mill', name: 'Malt Mill', emoji: '🌾', description: '+20% tap power', cost: 50_000, effect: 'tapMultiplier', effectValue: 0.2 },
  { id: 'ferm_tank', name: 'Fermentation Tank', emoji: '🧪', description: '+20% auto brew rate', cost: 150_000, effect: 'autoMultiplier', effectValue: 0.2 },
  { id: 'tasting_room', name: 'Tasting Room', emoji: '🍷', description: '+15% all earnings', cost: 500_000, effect: 'allMultiplier', effectValue: 0.15 },
  { id: 'bottling_line', name: 'Bottling Line', emoji: '🏭', description: '+25% auto brew rate', cost: 2_000_000, effect: 'autoMultiplier', effectValue: 0.25 },
  { id: 'beer_garden', name: 'Beer Garden', emoji: '🌳', description: '+20% all earnings', cost: 10_000_000, effect: 'allMultiplier', effectValue: 0.2 },
];

export const getRoomById = (id: string): BreweryRoom =>
  BREWERY_ROOMS.find((r) => r.id === id) ?? BREWERY_ROOMS[0];
