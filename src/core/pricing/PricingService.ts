/* eslint-disable no-unused-vars */
import type { GameState } from '../../types/GameState';
import type { ValidatedTrade } from '../trade/TradeValidator';

import * as config from './Config';
import { createLogRatioPriceMath } from './Curves';
import { applyPassiveDrift } from './PassiveDrift';
import { applyPostTradeCurve } from './PostTradeAdjust';

export interface PricingOptions {
  // Options can be added here in the future if needed
}

export function createPricingService(): {
  afterTrade: (state: GameState, vt: ValidatedTrade) => GameState;
  perTurnDrift: (state: GameState) => GameState;
} {
  const tables = config.loadPriceCurves();
  const math = createLogRatioPriceMath();

  return {
    afterTrade: (state: GameState, vt: ValidatedTrade): GameState => {
      return applyPostTradeCurve(state, vt, tables, math);
    },

    perTurnDrift: (state: GameState): GameState => {
      return applyPassiveDrift(state, tables, math);
    },
  };
}
