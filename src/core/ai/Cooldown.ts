/**
 * Cooldown system to prevent thrashing trades (A buys from B this turn, then reverses next turn).
 *
 * The cooldown is tracked per (townId, goodId) combination and prevents the same town
 * from trading the same good for a specified number of turns after a trade.
 */

/**
 * Cooldown state mapping keys to turn numbers when the cooldown expires.
 * Key format: `${townId}:${goodId}`
 */
export interface CooldownState {
  [key: string]: number;
}

/**
 * Checks if a trade should be skipped due to cooldown.
 *
 * @param cd - Current cooldown state
 * @param key - Cooldown key in format `${townId}:${goodId}`
 * @param currentTurn - Current game turn number
 * @returns true if trade should be skipped due to cooldown, false otherwise
 */
export function shouldSkipCooldown(cd: CooldownState, key: string, currentTurn: number): boolean {
  const cooldownUntil = cd[key];
  if (cooldownUntil === undefined) {
    return false; // No cooldown active
  }

  return currentTurn <= cooldownUntil;
}

/**
 * Marks a cooldown for a specific (townId, goodId) combination.
 *
 * @param cd - Cooldown state to update
 * @param key - Cooldown key in format `${townId}:${goodId}`
 * @param currentTurn - Current game turn number
 * @param interval - Number of turns to wait before allowing trade again (default: 1)
 */
export function markCooldown(
  cd: CooldownState,
  key: string,
  currentTurn: number,
  interval = 1,
): void {
  cd[key] = currentTurn + interval;
}

/**
 * Creates a cooldown key from town ID and good ID.
 *
 * @param townId - ID of the town
 * @param goodId - ID of the good
 * @returns Cooldown key string
 */
export function createCooldownKey(townId: string, goodId: string): string {
  return `${townId}:${goodId}`;
}

/**
 * Clears expired cooldowns from the state.
 *
 * @param cd - Cooldown state to clean
 * @param currentTurn - Current game turn number
 */
export function clearExpiredCooldowns(cd: CooldownState, currentTurn: number): void {
  for (const key of Object.keys(cd)) {
    const cooldownUntil = cd[key];
    if (cooldownUntil !== undefined && cooldownUntil <= currentTurn) {
      delete cd[key];
    }
  }
}
