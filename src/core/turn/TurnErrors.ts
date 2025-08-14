import type { TurnPhase } from './TurnPhase';

/**
 * Error thrown when a turn fails during a specific phase.
 * Contains information about which phase failed and the original cause.
 */
export class TurnPhaseError extends Error {
  constructor(
    public readonly phase: TurnPhase,
    public override readonly cause: unknown,
  ) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(`Turn failed during ${phase}: ${causeMessage}`);

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TurnPhaseError.prototype);

    // Preserve the original error name
    this.name = 'TurnPhaseError';
  }
}
