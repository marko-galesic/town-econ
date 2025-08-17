import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { PlayerActionQueue } from '@/core/turn/PlayerActionQueue';
import type { GameState } from '@/types/GameState';

import { bindConfirmTrade } from './ConfirmTrade';
import type { SelectionStore, SelectionState } from './SelectionStore';

// Mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
Object.defineProperty(globalThis, 'document', {
  value: dom.window.document,
  writable: true,
});
Object.defineProperty(globalThis, 'window', {
  value: dom.window,
  writable: true,
});

describe('ConfirmTrade', () => {
  let button: HTMLButtonElement;
  let mockStore: SelectionStore;
  let mockQueue: PlayerActionQueue;
  let mockGetState: () => GameState;
  let mockGetGood: () => 'fish' | 'wood' | 'ore' | null;
  let mockGetMode: () => 'buy' | 'sell' | null;
  let mockGetQty: () => number;
  let cleanup: { destroy(): void };
  let capturedSubscribeCallback: ((state: SelectionState) => void) | null = null;

  const mockGameState: GameState = {
    turn: 0,
    version: 1,
    rngSeed: 'test',
    towns: [
      {
        id: 'riverdale',
        name: 'Riverdale',
        resources: { fish: 100, wood: 50, ore: 25 },
        treasury: 1000,
        prices: { fish: 10, wood: 20, ore: 40 },
        militaryRaw: 30,
        prosperityRaw: 50,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 0,
        },
      },
      {
        id: 'forestburg',
        name: 'Forestburg',
        resources: { fish: 30, wood: 200, ore: 15 },
        treasury: 800,
        prices: { fish: 15, wood: 15, ore: 35 },
        militaryRaw: 40,
        prosperityRaw: 60,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 0,
        },
      },
    ],
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: -1, militaryDelta: 2 } },
    },
  };

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Mock setTimeout
    vi.useFakeTimers();

    // Create button
    button = document.createElement('button');
    button.className = 'confirm-trade-button';
    document.body.appendChild(button);

    // Create mock store with captured subscribe callback
    mockStore = {
      get: vi.fn(() => ({ selectedTownId: 'forestburg' })),
      setTown: vi.fn(),
      subscribe: vi.fn((callback: (state: SelectionState) => void) => {
        capturedSubscribeCallback = callback;
        return () => {};
      }),
    } as unknown as SelectionStore;

    // Create mock queue
    mockQueue = new PlayerActionQueue();

    // Create mock functions
    mockGetState = vi.fn(() => mockGameState);
    mockGetGood = vi.fn(() => 'fish' as const);
    mockGetMode = vi.fn(() => 'buy' as const);
    mockGetQty = vi.fn(() => 5);

    // Bind confirm trade
    cleanup = bindConfirmTrade({
      button,
      store: mockStore,
      getState: mockGetState,
      getGood: mockGetGood,
      getMode: mockGetMode,
      getQty: mockGetQty,
      playerTownId: 'riverdale',
      queue: mockQueue,
    });
  });

  afterEach(() => {
    cleanup.destroy();
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  describe('Button state management', () => {
    it('should enable button when trade is valid', () => {
      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('Confirm Trade');
    });

    it('should disable button when no town is selected', () => {
      mockStore.get = vi.fn(() => ({ selectedTownId: null }));

      // Trigger update by calling subscribe callback
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: null });
      }

      expect(button.disabled).toBe(true);
      expect(button.title).toContain('No town selected');
    });

    it('should disable button when no good is selected', () => {
      vi.mocked(mockGetGood).mockReturnValue(null);

      // Trigger update
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: 'forestburg' });
      }

      expect(button.disabled).toBe(true);
      expect(button.title).toContain('No good selected');
    });

    it('should disable button when no mode is selected', () => {
      vi.mocked(mockGetMode).mockReturnValue(null);

      // Trigger update
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: 'forestburg' });
      }

      expect(button.disabled).toBe(true);
      expect(button.title).toContain('No trade mode selected');
    });

    it('should disable button when quantity is invalid', () => {
      vi.mocked(mockGetQty).mockReturnValue(0);

      // Trigger update
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: 'forestburg' });
      }

      expect(button.disabled).toBe(true);
      expect(button.title).toContain('Invalid quantity');
    });

    it('should disable button when player lacks treasury for buy', () => {
      vi.mocked(mockGetQty).mockReturnValue(100); // Will cost 1500 (100 * 15) but player only has 1000

      // Trigger update
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: 'forestburg' });
      }

      expect(button.disabled).toBe(true);
      expect(button.title).toContain('Not enough treasury');
    });

    it('should disable button when town lacks stock for buy', () => {
      vi.mocked(mockGetQty).mockReturnValue(300); // Town only has 200 wood
      vi.mocked(mockGetGood).mockReturnValue('wood');
      // Give player enough treasury to pass that check
      if (mockGameState.towns[0]) {
        mockGameState.towns[0].treasury = 10000;
      }

      // Trigger update
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: 'forestburg' });
      }

      expect(button.disabled).toBe(true);
      expect(button.title).toContain('Not enough stock');
    });

    it('should disable button when player lacks stock for sell', () => {
      vi.mocked(mockGetMode).mockReturnValue('sell');
      vi.mocked(mockGetQty).mockReturnValue(200); // Player only has 100 fish
      vi.mocked(mockGetGood).mockReturnValue('fish');

      // Trigger update
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: 'forestburg' });
      }

      expect(button.disabled).toBe(true);
      expect(button.title).toContain('Not enough stock');
    });

    it('should disable button when town lacks treasury for sell', () => {
      vi.mocked(mockGetMode).mockReturnValue('sell');
      vi.mocked(mockGetQty).mockReturnValue(100); // Will cost 1500 (100 * 15) but town only has 800
      vi.mocked(mockGetGood).mockReturnValue('fish');

      // Trigger update
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: 'forestburg' });
      }

      expect(button.disabled).toBe(true);
      expect(button.title).toContain('Town not enough treasury');
    });
  });

  describe('Trade request building', () => {
    it('should build correct buy TradeRequest', () => {
      vi.mocked(mockGetMode).mockReturnValue('buy');
      vi.mocked(mockGetGood).mockReturnValue('wood');
      vi.mocked(mockGetQty).mockReturnValue(10);

      // Click the button
      button.click();

      expect(mockQueue.length).toBe(1);
      const action = mockQueue.dequeue();
      expect(action).toEqual({
        type: 'trade',
        payload: {
          fromTownId: 'riverdale',
          toTownId: 'forestburg',
          side: 'buy',
          goodId: 'wood',
          quantity: 10,
          pricePerUnit: 15, // forestburg's wood price
        },
      });
    });

    it('should build correct sell TradeRequest', () => {
      vi.mocked(mockGetMode).mockReturnValue('sell');
      vi.mocked(mockGetGood).mockReturnValue('fish');
      vi.mocked(mockGetQty).mockReturnValue(20);

      // Click the button
      button.click();

      expect(mockQueue.length).toBe(1);
      const action = mockQueue.dequeue();
      expect(action).toEqual({
        type: 'trade',
        payload: {
          fromTownId: 'riverdale',
          toTownId: 'forestburg',
          side: 'sell',
          goodId: 'fish',
          quantity: 20,
          pricePerUnit: 15, // forestburg's fish price
        },
      });
    });

    it('should not enqueue action when trade is invalid', () => {
      mockStore.get = vi.fn(() => ({ selectedTownId: null }));

      // Trigger update to disable button
      if (capturedSubscribeCallback) {
        capturedSubscribeCallback({ selectedTownId: null });
      }

      // Click the button
      button.click();

      expect(mockQueue.length).toBe(0);
    });
  });

  describe('Visual feedback', () => {
    it('should add pulse class on successful trade', () => {
      // Click the button
      button.click();

      expect(button.classList.contains('pulse')).toBe(true);

      // Advance timers to complete animation
      vi.advanceTimersByTime(350);

      expect(button.classList.contains('pulse')).toBe(false);
    });

    it('should log trade to console', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      // Click the button
      button.click();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Trade enqueued:',
        expect.objectContaining({
          fromTownId: 'riverdale',
          toTownId: 'forestburg',
          side: 'buy',
          goodId: 'fish',
          quantity: 5,
          pricePerUnit: 15,
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners and classes on destroy', () => {
      // Add pulse class
      button.classList.add('pulse');
      expect(button.classList.contains('pulse')).toBe(true);

      // Destroy
      cleanup.destroy();

      // Should remove pulse class
      expect(button.classList.contains('pulse')).toBe(false);

      // Should unsubscribe from store
      expect(mockStore.subscribe).toHaveBeenCalled();
    });
  });
});
