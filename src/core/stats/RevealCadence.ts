/**
 * Policy for when to reveal updated tier information
 */
export interface RevealPolicy {
  /** Number of turns between reveals (e.g., 2 means every 2 turns) */
  interval: number;
}

/**
 * Default reveal policy - update every 2 turns
 */
export const DEFAULT_REVEAL_POLICY: RevealPolicy = { interval: 2 };

/**
 * Check if it's time to reveal updated tier information
 * @param currentTurn - The current turn number
 * @param lastUpdatedTurn - The last turn when tiers were revealed
 * @param policy - The reveal policy to follow
 * @returns true if tiers should be revealed this turn
 */
export function isRevealDue(
  currentTurn: number,
  lastUpdatedTurn: number,
  policy: RevealPolicy,
): boolean {
  console.log('isRevealDue called with:', { currentTurn, lastUpdatedTurn, policy });

  // If we've never revealed before, always reveal on the first turn when updateStats is called
  if (lastUpdatedTurn === -1) {
    console.log('isRevealDue: lastUpdatedTurn === -1, returning true');
    return true; // Always reveal on first call
  }

  // Check if current turn is a multiple of the interval since last update
  const turnsSinceLastUpdate = currentTurn - lastUpdatedTurn;
  const result = turnsSinceLastUpdate > 0 && turnsSinceLastUpdate % policy.interval === 0;
  console.log('isRevealDue: turnsSinceLastUpdate =', turnsSinceLastUpdate, 'result =', result);
  return result;
}

/**
 * Mark the current turn as when tiers were last revealed
 * @param now - The current turn number
 * @returns The current turn number (for clarity in assignments)
 */
export function markRevealed(now: number): number {
  return now;
}
