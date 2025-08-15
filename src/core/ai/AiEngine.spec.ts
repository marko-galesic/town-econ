import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { GoodId, GoodConfig } from '../../types/Goods';

import { quoteToTradeRequest, decideAiTrade } from './AiEngine';
import type { AiProfile } from './AiTypes';
import * as Candidates from './Candidates';
import type { MarketSnapshot } from './Market';
import * as Market from './Market';
import * as Policy from './Policy';
import type { Quote } from './Valuation';

// Mock the imported modules
vi.mock('./Market');
vi.mock('./Candidates');
vi.mock('./Policy');

describe('AiEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('quoteToTradeRequest', () => {
    it('builds correct TradeRequest fields from Quote', () => {
      const mockQuote: Quote = {
        buyerId: 'town-a',
        sellerId: 'town-b',
        goodId: 'fish',
        quantity: 100,
        unitSellPrice: 5.5,
        unitBuyPrice: 6.0,
      };

      const result = quoteToTradeRequest(mockQuote);

      expect(result).toEqual({
        fromTownId: 'town-a', // buyer initiates the buy
        toTownId: 'town-b',
        side: 'buy',
        goodId: 'fish',
        quantity: 100,
        pricePerUnit: 5.5, // buyer pays seller's price
      });
    });
  });

  describe('decideAiTrade', () => {
    const mockState: GameState = {} as GameState;
    const mockProfile: AiProfile = {
      id: 'test-ai',
      mode: 'greedy',
      weights: {
        priceSpread: 0.7,
        prosperity: 0.2,
        military: 0.1,
      },
      maxTradesPerTurn: 3,
      maxQuantityPerTrade: 50,
    };
    const mockGoods: Record<GoodId, GoodConfig> = {
      fish: {
        id: 'fish',
        name: 'Fish',
        effects: {
          prosperityDelta: 1,
          militaryDelta: 0,
        },
      },
      wood: {
        id: 'wood',
        name: 'Wood',
        effects: {
          prosperityDelta: 1,
          militaryDelta: 2,
        },
      },
      ore: {
        id: 'ore',
        name: 'Ore',
        effects: {
          prosperityDelta: 2,
          militaryDelta: 1,
        },
      },
    };
    const mockSeed = 'test-seed-123';
    const aiTownId = 'ai-town';

    it('returns skipped if no candidates', () => {
      const mockMarket: MarketSnapshot = {
        towns: [],
      };
      const mockCandidates: Quote[] = [];

      vi.mocked(Market.snapshotMarket).mockReturnValue(mockMarket);
      vi.mocked(Candidates.generateCandidates).mockReturnValue(mockCandidates);

      const result = decideAiTrade(mockState, aiTownId, mockProfile, mockGoods, mockSeed);

      expect(result).toEqual({
        skipped: true,
        reason: 'no-candidate',
      });
    });

    it('returns request when candidates exist', () => {
      const mockMarket: MarketSnapshot = {
        towns: [],
      };
      const mockCandidates: Quote[] = [
        {
          buyerId: 'ai-town',
          sellerId: 'other-town',
          goodId: 'fish',
          quantity: 25,
          unitSellPrice: 4.0,
          unitBuyPrice: 5.0,
        },
      ];
      const mockChosenQuote: Quote = mockCandidates[0]!;

      vi.mocked(Market.snapshotMarket).mockReturnValue(mockMarket);
      vi.mocked(Candidates.generateCandidates).mockReturnValue(mockCandidates);
      vi.mocked(Policy.chooseTrade).mockReturnValue(mockChosenQuote);

      const result = decideAiTrade(mockState, aiTownId, mockProfile, mockGoods, mockSeed);

      expect(result).toEqual({
        request: {
          fromTownId: 'ai-town',
          toTownId: 'other-town',
          side: 'buy',
          goodId: 'fish',
          quantity: 25,
          pricePerUnit: 4.0,
        },
        reason: 'greedy',
      });
    });

    it('filters candidates to only include AI town actions', () => {
      const mockMarket: MarketSnapshot = {
        towns: [],
      };
      const mockCandidates: Quote[] = [
        {
          buyerId: 'ai-town',
          sellerId: 'other-town',
          goodId: 'fish',
          quantity: 25,
          unitSellPrice: 4.0,
          unitBuyPrice: 5.0,
        },
        {
          buyerId: 'other-town',
          sellerId: 'ai-town',
          goodId: 'wood',
          quantity: 30,
          unitSellPrice: 3.0,
          unitBuyPrice: 4.0,
        },
        {
          buyerId: 'town-c',
          sellerId: 'town-d',
          goodId: 'ore',
          quantity: 40,
          unitSellPrice: 6.0,
          unitBuyPrice: 7.0,
        },
      ];

      vi.mocked(Market.snapshotMarket).mockReturnValue(mockMarket);
      vi.mocked(Candidates.generateCandidates).mockReturnValue(mockCandidates);
      vi.mocked(Policy.chooseTrade).mockReturnValue(mockCandidates[0]);

      decideAiTrade(mockState, aiTownId, mockProfile, mockGoods, mockSeed);

      // Verify that chooseTrade was called with filtered candidates
      expect(Policy.chooseTrade).toHaveBeenCalledWith(
        mockProfile,
        expect.arrayContaining([
          expect.objectContaining({ buyerId: 'ai-town' }),
          expect.objectContaining({ sellerId: 'ai-town' }),
        ]),
        mockGoods,
        mockSeed,
        aiTownId,
      );
    });

    it('is deterministic with fixed seed', () => {
      const mockMarket: MarketSnapshot = {
        towns: [],
      };
      const mockCandidates: Quote[] = [
        {
          buyerId: 'ai-town',
          sellerId: 'other-town',
          goodId: 'fish',
          quantity: 25,
          unitSellPrice: 4.0,
          unitBuyPrice: 5.0,
        },
      ];

      vi.mocked(Market.snapshotMarket).mockReturnValue(mockMarket);
      vi.mocked(Candidates.generateCandidates).mockReturnValue(mockCandidates);
      vi.mocked(Policy.chooseTrade).mockReturnValue(mockCandidates[0]);

      // Call multiple times with same seed
      const result1 = decideAiTrade(mockState, aiTownId, mockProfile, mockGoods, mockSeed);
      const result2 = decideAiTrade(mockState, aiTownId, mockProfile, mockGoods, mockSeed);

      expect(result1).toEqual(result2);
      expect(Market.snapshotMarket).toHaveBeenCalledTimes(2);
      expect(Candidates.generateCandidates).toHaveBeenCalledTimes(2);
      expect(Policy.chooseTrade).toHaveBeenCalledTimes(2);
    });
  });
});
