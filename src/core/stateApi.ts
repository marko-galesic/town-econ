import type { GameState } from '../types/GameState';
import type { GoodId } from '../types/Goods';
import type { Town } from '../types/Town';

/**
 * Safely retrieves a town by its ID from the game state.
 *
 * @param state - The current game state
 * @param townId - The unique identifier of the town to find
 * @returns The town object if found
 * @throws Error with descriptive message including the town ID if not found
 */
export function getTown(state: GameState, townId: string): Town {
  const town = state.towns.find(t => t.id === townId);

  if (!town) {
    throw new Error(`Town with ID '${townId}' not found`);
  }

  return town;
}

/**
 * Validates that a good ID exists in the game configuration.
 *
 * @param goodId - The good ID to validate
 * @throws Error if the good ID is not recognized
 */
function validateGoodId(goodId: string): asserts goodId is GoodId {
  const validGoodIds: GoodId[] = ['fish', 'wood', 'ore'];
  if (!validGoodIds.includes(goodId as GoodId)) {
    throw new Error(`Unknown good ID: '${goodId}'`);
  }
}

/**
 * Sets a resource amount for a specific good in a town.
 * Enforces invariants: amount must be integer ≥0, goodId must be valid.
 * Returns a new Town object with updated resources (immutable update).
 *
 * @param town - The town to update
 * @param goodId - The good ID to set resource for
 * @param amount - The amount to set (will be clamped to ≥0 if negative)
 * @returns A new Town object with updated resources
 * @throws Error if goodId is not recognized
 */
export function setResource(town: Town, goodId: string, amount: number): Town {
  // Validate goodId exists
  validateGoodId(goodId);

  // Validate amount is an integer
  if (!Number.isInteger(amount)) {
    throw new Error(`Amount must be an integer, got: ${amount}`);
  }

  // Clamp amount to ≥0
  const clampedAmount = Math.max(0, amount);

  // Create new resources object with updated value
  const updatedResources = {
    ...town.resources,
    [goodId]: clampedAmount,
  };

  // Return new Town object with updated resources
  return {
    ...town,
    resources: updatedResources,
  };
}

/**
 * Increments or decrements a resource amount for a specific good in a town.
 * Enforces invariants: delta must be integer, goodId must be valid.
 * Floors the result at 0 (never allows negative resources).
 * Returns a new Town object with updated resources (immutable update).
 *
 * @param town - The town to update
 * @param goodId - The good ID to increment resource for
 * @param delta - The amount to add/subtract (will be floored at 0 if result would be negative)
 * @returns A new Town object with updated resources
 * @throws Error if goodId is not recognized or delta is not an integer
 */
export function incResource(town: Town, goodId: string, delta: number): Town {
  // Validate goodId exists
  validateGoodId(goodId);

  // Validate delta is an integer
  if (!Number.isInteger(delta)) {
    throw new Error(`Delta must be an integer, got: ${delta}`);
  }

  // Get current amount (default to 0 if not present)
  const currentAmount = town.resources[goodId] || 0;

  // Calculate new amount and floor at 0
  const newAmount = Math.max(0, currentAmount + delta);

  // Create new resources object with updated value
  const updatedResources = {
    ...town.resources,
    [goodId]: newAmount,
  };

  // Return new Town object with updated resources
  return {
    ...town,
    resources: updatedResources,
  };
}

/**
 * Sets a price for a specific good in a town.
 * Enforces invariants: price must be integer ≥0, goodId must be valid.
 * Returns a new Town object with updated prices (immutable update).
 *
 * @param town - The town to update
 * @param goodId - The good ID to set price for
 * @param price - The price to set (will be clamped to ≥0 if negative)
 * @returns A new Town object with updated prices
 * @throws Error if goodId is not recognized or price is not an integer
 */
export function setPrice(town: Town, goodId: string, price: number): Town {
  // Validate goodId exists
  validateGoodId(goodId);

  // Validate price is an integer
  if (!Number.isInteger(price)) {
    throw new Error(`Price must be an integer, got: ${price}`);
  }

  // Clamp price to ≥0
  const clampedPrice = Math.max(0, price);

  // Create new prices object with updated value
  const updatedPrices = {
    ...town.prices,
    [goodId]: clampedPrice,
  };

  // Return new Town object with updated prices
  return {
    ...town,
    prices: updatedPrices,
  };
}

/**
 * Increments or decrements a price for a specific good in a town.
 * Enforces invariants: delta must be integer, goodId must be valid.
 * Floors the result at 0 (never allows negative prices).
 * Returns a new Town object with updated prices (immutable update).
 *
 * @param town - The town to update
 * @param goodId - The good ID to increment price for
 * @param delta - The amount to add/subtract (will be floored at 0 if result would be negative)
 * @returns A new Town object with updated prices
 * @throws Error if goodId is not recognized or delta is not an integer
 */
export function incPrice(town: Town, goodId: string, delta: number): Town {
  // Validate goodId exists
  validateGoodId(goodId);

  // Validate delta is an integer
  if (!Number.isInteger(delta)) {
    throw new Error(`Delta must be an integer, got: ${delta}`);
  }

  // Get current price (default to 0 if not present)
  const currentPrice = town.prices[goodId] || 0;

  // Calculate new price and floor at 0
  const newPrice = Math.max(0, currentPrice + delta);

  // Create new prices object with updated value
  const updatedPrices = {
    ...town.prices,
    [goodId]: newPrice,
  };

  // Return new Town object with updated prices
  return {
    ...town,
    prices: updatedPrices,
  };
}

/**
 * Adds or subtracts from a town's raw prosperity value.
 * Only updates prosperityRaw, does not modify revealed tier information.
 * Enforces invariants: delta must be integer.
 * Returns a new Town object with updated prosperityRaw (immutable update).
 *
 * @param town - The town to update
 * @param delta - The amount to add/subtract to prosperityRaw
 * @returns A new Town object with updated prosperityRaw
 * @throws Error if delta is not an integer
 */
export function addProsperity(town: Town, delta: number): Town {
  // Validate delta is an integer
  if (!Number.isInteger(delta)) {
    throw new Error(`Delta must be an integer, got: ${delta}`);
  }

  // Calculate new prosperity value
  const newProsperityRaw = town.prosperityRaw + delta;

  // Return new Town object with updated prosperityRaw only
  return {
    ...town,
    prosperityRaw: newProsperityRaw,
  };
}

/**
 * Adds or subtracts from a town's raw military value.
 * Only updates militaryRaw, does not modify revealed tier information.
 * Enforces invariants: delta must be integer.
 * Returns a new Town object with updated militaryRaw (immutable update).
 *
 * @param town - The town to update
 * @param delta - The amount to add/subtract to militaryRaw
 * @returns A new Town object with updated militaryRaw
 * @throws Error if delta is not an integer
 */
export function addMilitary(town: Town, delta: number): Town {
  // Validate delta is an integer
  if (!Number.isInteger(delta)) {
    throw new Error(`Delta must be an integer, got: ${delta}`);
  }

  // Calculate new military value
  const newMilitaryRaw = town.militaryRaw + delta;

  // Return new Town object with updated militaryRaw only
  return {
    ...town,
    militaryRaw: newMilitaryRaw,
  };
}

/**
 * Advances the game to the next turn.
 * Increments the turn number by 1, preserves all other state properties.
 * Returns a new GameState object with updated turn (immutable update).
 *
 * @param state - The current game state
 * @returns A new GameState object with turn incremented by 1
 */
export function advanceTurn(state: GameState): GameState {
  // Return new GameState with turn incremented by 1
  return {
    ...state,
    turn: state.turn + 1,
  };
}
