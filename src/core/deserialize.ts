import { validateGameState } from './validation';
import type { GameState } from '../types/GameState';

/**
 * Deserializes a JSON string into a validated GameState object.
 *
 * This function provides safe loading by:
 * 1. Parsing the JSON string
 * 2. Validating the parsed object structure
 * 3. Returning a properly typed GameState
 *
 * @param json - The JSON string to deserialize
 * @returns A validated GameState object
 * @throws Error if JSON parsing fails, or ValidationError if validation fails
 */
export function deserializeGameState(json: string): GameState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    // JSON.parse failed - provide helpful error with the original cause
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON: ${cause}`);
  }

  // JSON parsing succeeded, now validate the structure
  try {
    validateGameState(parsed);
  } catch (error) {
    // Validation failed - re-throw the ValidationError as-is
    throw error;
  }

  // Both parsing and validation succeeded, return the typed object
  return parsed as GameState;
}
