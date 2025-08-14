import type { GameState } from '../../types/GameState';
import type { GoodId } from '../../types/Goods';
import type { Town } from '../../types/Town';

import { TradeValidationError } from './TradeErrors';
import type { TradeRequest, TradeSide } from './TradeTypes';

/**
 * Represents a validated and normalized trade plan.
 * All fields are guaranteed to be safe and consistent.
 */
export interface ValidatedTrade {
  /** The town initiating the trade */
  from: Town;
  /** The town receiving the trade */
  to: Town;
  /** The ID of the good being traded */
  goodId: GoodId;
  /** The quantity of goods to trade (positive integer) */
  qty: number;
  /** The price per unit for the trade */
  unitPrice: number;
  /** Whether this is a buy or sell transaction */
  side: TradeSide;
}

/**
 * Validates a trade request and returns a normalized, safe trade plan.
 * Throws TradeValidationError with a precise path if validation fails.
 *
 * @param state - Current game state
 * @param req - Trade request to validate
 * @returns ValidatedTrade with resolved Town objects and normalized values
 * @throws TradeValidationError if validation fails
 */
export function validateTrade(state: GameState, req: TradeRequest): ValidatedTrade {
  // Check if fromTownId exists
  const fromTown = state.towns.find(town => town.id === req.fromTownId);
  if (!fromTown) {
    throw new TradeValidationError('fromTownId', `Town with ID '${req.fromTownId}' not found`);
  }

  // Check if toTownId exists
  const toTown = state.towns.find(town => town.id === req.toTownId);
  if (!toTown) {
    throw new TradeValidationError('toTownId', `Town with ID '${req.toTownId}' not found`);
  }

  // Check if good exists in both towns' resources
  if (!(req.goodId in fromTown.resources)) {
    throw new TradeValidationError(
      `towns[${state.towns.findIndex(t => t.id === req.fromTownId)}].resources.${req.goodId}`,
      `Good '${req.goodId}' not available in town '${fromTown.name}'`,
    );
  }

  if (!(req.goodId in toTown.resources)) {
    throw new TradeValidationError(
      `towns[${state.towns.findIndex(t => t.id === req.toTownId)}].resources.${req.goodId}`,
      `Good '${req.goodId}' not available in town '${toTown.name}'`,
    );
  }

  // Validate quantity: must be positive integer
  if (!Number.isInteger(req.quantity) || req.quantity <= 0) {
    throw new TradeValidationError(
      'quantity',
      `Quantity must be a positive integer, got ${req.quantity}`,
    );
  }

  // Validate price per unit: must be nonnegative
  if (req.pricePerUnit < 0) {
    throw new TradeValidationError(
      'pricePerUnit',
      `Price per unit must be nonnegative, got ${req.pricePerUnit}`,
    );
  }

  // Validate side-specific requirements
  if (req.side === 'sell') {
    // For sell: fromTown must have sufficient stock, toTown must have sufficient treasury
    if (fromTown.resources[req.goodId] < req.quantity) {
      throw new TradeValidationError(
        `towns[${state.towns.findIndex(t => t.id === req.fromTownId)}].resources.${req.goodId}`,
        `Insufficient stock: town '${fromTown.name}' has ${fromTown.resources[req.goodId]} ${req.goodId}, but ${req.quantity} requested`,
      );
    }

    const totalCost = req.quantity * req.pricePerUnit;
    if (toTown.treasury < totalCost) {
      throw new TradeValidationError(
        `towns[${state.towns.findIndex(t => t.id === req.toTownId)}].treasury`,
        `Insufficient treasury: town '${toTown.name}' has ${toTown.treasury} currency, but ${totalCost} needed`,
      );
    }

    // Price sanity check: unitPrice must equal toTown's quoted price for the good
    if (req.pricePerUnit !== toTown.prices[req.goodId]) {
      throw new TradeValidationError(
        'pricePerUnit',
        `Price mismatch: requested ${req.pricePerUnit} but town '${toTown.name}' quotes ${toTown.prices[req.goodId]} for ${req.goodId}`,
      );
    }
  } else if (req.side === 'buy') {
    // For buy: toTown must have sufficient stock, fromTown must have sufficient treasury
    if (toTown.resources[req.goodId] < req.quantity) {
      throw new TradeValidationError(
        `towns[${state.towns.findIndex(t => t.id === req.toTownId)}].resources.${req.goodId}`,
        `Insufficient stock: town '${toTown.name}' has ${toTown.resources[req.goodId]} ${req.goodId}, but ${req.quantity} requested`,
      );
    }

    const totalCost = req.quantity * req.pricePerUnit;
    if (fromTown.treasury < totalCost) {
      throw new TradeValidationError(
        `towns[${state.towns.findIndex(t => t.id === req.fromTownId)}].treasury`,
        `Insufficient treasury: town '${fromTown.name}' has ${fromTown.treasury} currency, but ${totalCost} needed`,
      );
    }

    // Price sanity check: unitPrice must equal toTown's quoted price for the good
    if (req.pricePerUnit !== toTown.prices[req.goodId]) {
      throw new TradeValidationError(
        'pricePerUnit',
        `Price mismatch: requested ${req.pricePerUnit} but town '${toTown.name}' quotes ${toTown.prices[req.goodId]} for ${req.goodId}`,
      );
    }
  } else {
    throw new TradeValidationError(
      'side',
      `Invalid trade side: ${req.side}. Must be 'buy' or 'sell'`,
    );
  }

  // Return validated trade with resolved Town objects and normalized values
  return {
    from: fromTown,
    to: toTown,
    goodId: req.goodId,
    qty: req.quantity,
    unitPrice: req.pricePerUnit,
    side: req.side,
  };
}
