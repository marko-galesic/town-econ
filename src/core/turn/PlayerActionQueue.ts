import type { PlayerAction } from './PlayerAction';

/**
 * A queue for managing player actions during game turns.
 * Actions are processed in FIFO (first-in, first-out) order.
 */
export class PlayerActionQueue {
  private q: PlayerAction[] = [];

  /**
   * Adds an action to the end of the queue.
   * @param a - The player action to enqueue
   */
  enqueue(a: PlayerAction): void {
    this.q.push(a);
  }

  /**
   * Removes and returns the first action from the queue.
   * @returns The next action to process, or undefined if queue is empty
   */
  dequeue(): PlayerAction | undefined {
    return this.q.shift();
  }

  /**
   * Removes all actions from the queue.
   */
  clear(): void {
    this.q = [];
  }

  /**
   * Gets the current number of actions in the queue.
   * @returns The number of queued actions
   */
  get length(): number {
    return this.q.length;
  }
}
