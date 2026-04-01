// Crafting cost to combine two beers into a recipe
export const CRAFT_COST_BASE = 10_000;
export const CRAFT_COST_MULTIPLIER = 3; // each recipe costs 3x more
export const MAX_RECIPES = 5;

export function getCraftCost(recipesOwned: number): number {
  return Math.floor(CRAFT_COST_BASE * Math.pow(CRAFT_COST_MULTIPLIER, recipesOwned));
}

export function calculateRecipeBonus(tapBonus1: number, tapBonus2: number, autoBonus1: number, autoBonus2: number) {
  // Average of parents + 20% synergy bonus
  const tapBonus = ((tapBonus1 + tapBonus2) / 2) * 1.2;
  const autoBonus = ((autoBonus1 + autoBonus2) / 2) * 1.2;
  return {
    tapBonus: Math.round(tapBonus * 100) / 100,
    autoBonus: Math.round(autoBonus * 100) / 100,
  };
}
