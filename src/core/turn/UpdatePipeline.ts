import type { GameState } from '../../types/GameState';

/**
 * A system that can update game state during the UpdateStats phase
 */

export type UpdateSystem = (s: GameState) => GameState;

/**
 * Pipeline for executing update systems in order during the UpdateStats phase.
 * Systems are registered and then executed sequentially, with each system
 * receiving the result of the previous system.
 */
export class UpdatePipeline {
  private systems: UpdateSystem[] = [];

  /**
   * Register a new update system to be executed during the UpdateStats phase
   * @param sys - The update system to register
   */
  register(sys: UpdateSystem): void {
    this.systems.push(sys);
  }

  /**
   * Execute all registered update systems in order
   * @param s - The current game state
   * @returns The updated game state after all systems have been applied
   */
  run(s: GameState): GameState {
    return this.systems.reduce((acc, f) => f(acc), s);
  }

  /**
   * Get the number of registered systems
   * @returns The count of registered update systems
   */
  get systemCount(): number {
    return this.systems.length;
  }
}
