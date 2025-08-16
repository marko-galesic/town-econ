/* eslint-disable no-unused-vars */
import type { GameState } from '../../types/GameState';
import type { ValidatedTrade } from '../trade/TradeValidator';

import * as config from './Config';
import { createLogRatioPriceMath } from './Curves';
import { applyPassiveDrift } from './PassiveDrift';
import { applyPostTradeCurve } from './PostTradeAdjust';
import type { PriceChangeTracer } from './Telemetry';

export interface PricingOptions {
  /** Optional callback for price change telemetry */
  onTrace?: PriceChangeTracer;
}

export function createPricingService(): {
  afterTrade: (state: GameState, vt: ValidatedTrade, options?: PricingOptions) => GameState;
  perTurnDrift: (state: GameState, options?: PricingOptions) => GameState;
} {
  const tables = config.loadPriceCurves();
  const math = createLogRatioPriceMath();

  return {
    afterTrade: (state: GameState, vt: ValidatedTrade, options?: PricingOptions): GameState => {
      return applyPostTradeCurve(state, vt, tables, math, options?.onTrace);
    },

    perTurnDrift: (state: GameState, options?: PricingOptions): GameState => {
      return applyPassiveDrift(state, tables, math, undefined, options?.onTrace);
    },
  };
}
