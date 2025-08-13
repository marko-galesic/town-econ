import type { GameState } from '../types/GameState';

/**
 * Serializes a GameState object to a JSON string.
 *
 * @param s - The GameState to serialize
 * @returns A JSON string representation of the GameState
 */
export function serializeGameState(s: GameState): string {
  return JSON.stringify(s);
}
