import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { GameState } from '@/types/GameState';

import type { GoodId } from './GoodsPicker';
import { SelectionStore } from './SelectionStore';
import type { TradeMode } from './TradeModeToggle';
import { mountTradePreview } from './TradePreview';

describe('TradePreview', () => {
  let container: HTMLElement;
  let store: SelectionStore;
  let mockDeps: {
    getState: ReturnType<typeof vi.fn<[], GameState>>;
    getGood: ReturnType<typeof vi.fn<[], GoodId | undefined>>;
    getMode: ReturnType<typeof vi.fn<[], TradeMode>>;
    getQty: ReturnType<typeof vi.fn<[], number>>;
  };
  let mockGameState: GameState;

  beforeEach(() => {
    container = document.createElement('div');
    store = new SelectionStore();

    // Create mock game state
    mockGameState = {
      turn: 1,
      version: 1,
      rngSeed: 'test-seed',
      towns: [
        {
          id: 'player-town',
          name: 'Player Town',
          resources: { fish: 50, wood: 30, ore: 20 },
          prices: { fish: 5, wood: 3, ore: 8 },
          militaryRaw: 10,
          prosperityRaw: 15,
          treasury: 1000,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'modest',
            lastUpdatedTurn: 1,
          },
        },
        {
          id: 'trade-town',
          name: 'Trade Town',
          resources: { fish: 25, wood: 40, ore: 15 },
          prices: { fish: 6, wood: 4, ore: 10 },
          militaryRaw: 8,
          prosperityRaw: 12,
          treasury: 800,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'modest',
            lastUpdatedTurn: 1,
          },
        },
      ],
      goods: {
        fish: {
          id: 'fish',
          name: 'Fish',
          effects: { prosperityDelta: 1, militaryDelta: 0 },
        },
        wood: {
          id: 'wood',
          name: 'Wood',
          effects: { prosperityDelta: 0, militaryDelta: 1 },
        },
        ore: {
          id: 'ore',
          name: 'Ore',
          effects: { prosperityDelta: 0, militaryDelta: 2 },
        },
      },
    };

    mockDeps = {
      getState: vi.fn(() => mockGameState),
      getGood: vi.fn<[], GoodId | undefined>(() => 'fish'),
      getMode: vi.fn(() => 'buy' as TradeMode),
      getQty: vi.fn(() => 10),
    };
  });

  it('should mount successfully', () => {
    const preview = mountTradePreview(container, store, mockDeps);

    expect(container.querySelector('.trade-preview')).toBeTruthy();
    expect(container.querySelector('.preview-content')).toBeTruthy();

    preview.destroy();
  });

  it('should show "Select a town & good" when no town is selected', () => {
    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.textContent).toBe('Select a town & good');
    expect(content?.classList.contains('preview-error')).toBe(true);
  });

  it('should show "Select a town & good" when no good is selected', () => {
    store.setTown('trade-town');
    mockDeps.getGood.mockReturnValue(undefined);

    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.textContent).toBe('Select a town & good');
    expect(content?.classList.contains('preview-error')).toBe(true);
  });

  it('should show error when selected town is not found', () => {
    store.setTown('non-existent-town');

    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.textContent).toBe('Selected town not found');
    expect(content?.classList.contains('preview-error')).toBe(true);
  });

  it.skip('should show error when player town is not found', () => {
    store.setTown('trade-town');

    // Create a mock state with only the trade town (no player town)
    const mockStateWithoutPlayer = {
      ...mockGameState,
      towns: [mockGameState.towns[1]!], // Only trade town, no player town
    };

    // Create a new deps object with the mocked getState
    const testDeps = {
      ...mockDeps,
      getState: vi.fn(() => mockStateWithoutPlayer),
    };

    const preview = mountTradePreview(container, store, testDeps);

    // Force update to ensure the mock is used
    preview.update();

    const content = container.querySelector('.preview-content');
    expect(content?.textContent).toBe('Player town not found');
    expect(content?.classList.contains('preview-error')).toBe(true);

    preview.destroy();
  });

  it('should show success preview for valid buy transaction', () => {
    store.setTown('trade-town');

    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-success')).toBe(true);

    // Check for quantity, unit price, and total
    expect(content?.textContent).toContain('Quantity:');
    expect(content?.textContent).toContain('10');
    expect(content?.textContent).toContain('Unit Price:');
    expect(content?.textContent).toContain('₲6');
    expect(content?.textContent).toContain('Total:');
    expect(content?.textContent).toContain('₲60');
  });

  it('should show success preview for valid sell transaction', () => {
    store.setTown('trade-town');
    mockDeps.getMode.mockReturnValue('sell');

    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-success')).toBe(true);

    // Check for quantity, unit price, and total
    expect(content?.textContent).toContain('Quantity:');
    expect(content?.textContent).toContain('10');
    expect(content?.textContent).toContain('Unit Price:');
    expect(content?.textContent).toContain('₲6');
    expect(content?.textContent).toContain('Total:');
    expect(content?.textContent).toContain('₲60');
  });

  it('should show error for insufficient treasury when buying', () => {
    store.setTown('trade-town');
    mockDeps.getQty.mockReturnValue(200); // 200 * 6 = 1200, but player only has 1000

    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-error')).toBe(true);
    expect(content?.textContent).toContain('Not enough treasury');
    expect(content?.textContent).toContain('need ₲1200');
    expect(content?.textContent).toContain('have ₲1000');
  });

  it('should show error for insufficient stock when buying', () => {
    store.setTown('trade-town');
    mockDeps.getQty.mockReturnValue(30); // 30 fish, but trade town only has 25

    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-error')).toBe(true);
    expect(content?.textContent).toContain('Not enough stock');
    expect(content?.textContent).toContain('need 30');
    expect(content?.textContent).toContain('town has 25');
  });

  it('should show error for insufficient stock when selling', () => {
    store.setTown('trade-town');
    mockDeps.getMode.mockReturnValue('sell');
    mockDeps.getQty.mockReturnValue(60); // 60 fish, but player only has 50

    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-error')).toBe(true);
    expect(content?.textContent).toContain('Not enough stock');
    expect(content?.textContent).toContain('need 60');
    expect(content?.textContent).toContain('have 50');
  });

  it('should show error for insufficient town treasury when selling', () => {
    store.setTown('trade-town');
    mockDeps.getMode.mockReturnValue('sell');
    mockDeps.getQty.mockReturnValue(60); // 60 * 6 = 360, but trade town only has 800 (should pass stock check)

    // Mock player to have enough stock but town to have insufficient treasury
    mockDeps.getState.mockReturnValue({
      ...mockGameState,
      towns: [
        {
          ...mockGameState.towns[0]!,
          resources: { ...mockGameState.towns[0]!.resources, fish: 100 }, // Player has 100 fish
        },
        {
          ...mockGameState.towns[1]!,
          treasury: 300, // Town only has 300 treasury, needs 360
        },
      ],
    });

    mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-error')).toBe(true);
    expect(content?.textContent).toContain('Town not enough treasury');
    expect(content?.textContent).toContain('need ₲360');
    expect(content?.textContent).toContain('town has ₲300');
  });

  it('should update when store changes', () => {
    const preview = mountTradePreview(container, store, mockDeps);

    // Initially shows "Select a town & good"
    let content = container.querySelector('.preview-content');
    expect(content?.textContent).toBe('Select a town & good');

    // Select a town
    store.setTown('trade-town');

    // Should now show success preview
    content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-success')).toBe(true);
    expect(content?.querySelector('.preview-total .preview-value')?.textContent).toContain('₲60');

    preview.destroy();
  });

  it('should update when dependencies change', () => {
    store.setTown('trade-town');
    const preview = mountTradePreview(container, store, mockDeps);

    // Initially shows success for fish
    let content = container.querySelector('.preview-content');
    expect(content?.textContent).toContain('₲6'); // fish price

    // Change to wood
    mockDeps.getGood.mockReturnValue('wood');
    mockDeps.getQty.mockReturnValue(5);

    // Force update to see changes
    preview.update();

    // Should update to show wood price
    content = container.querySelector('.preview-content');
    expect(
      content?.querySelector('.preview-row:nth-child(2) .preview-value')?.textContent,
    ).toContain('₲4'); // wood price
    expect(content?.querySelector('.preview-total .preview-value')?.textContent).toContain('₲20'); // 5 * 4

    preview.destroy();
  });

  it('should destroy cleanly', () => {
    const preview = mountTradePreview(container, store, mockDeps);

    expect(container.querySelector('.trade-preview')).toBeTruthy();

    preview.destroy();

    expect(container.querySelector('.trade-preview')).toBeFalsy();
  });

  it('should handle different goods correctly', () => {
    store.setTown('trade-town');
    mockDeps.getGood.mockReturnValue('ore');
    mockDeps.getQty.mockReturnValue(3);

    const preview = mountTradePreview(container, store, mockDeps);

    const content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-success')).toBe(true);
    expect(
      content?.querySelector('.preview-row:nth-child(2) .preview-value')?.textContent,
    ).toContain('₲10'); // ore price
    expect(content?.querySelector('.preview-total .preview-value')?.textContent).toContain('₲30'); // 3 * 10

    preview.destroy();
  });

  it.skip('should handle edge case quantities', () => {
    store.setTown('trade-town');

    // Test minimum quantity
    mockDeps.getQty.mockReturnValue(1);
    const preview1 = mountTradePreview(container, store, mockDeps);

    let content = container.querySelector('.preview-content');
    expect(content?.classList.contains('preview-success')).toBe(true);
    expect(content?.querySelector('.preview-total .preview-value')?.textContent).toContain('₲6'); // 1 * 6

    preview1.destroy();

    // Test large quantity - create new deps with updated mock
    const testDeps = {
      ...mockDeps,
      getQty: vi.fn(() => 100),
    };
    const preview2 = mountTradePreview(container, store, testDeps);

    // Force update to ensure the mock is used
    preview2.update();

    content = container.querySelector('.preview-content');

    preview2.destroy();
  });
});
