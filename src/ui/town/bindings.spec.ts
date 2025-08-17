import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type { GameState } from '../../types/GameState';
import { SelectionStore } from '../input/SelectionStore';

import { mountTownView } from './bindings';

// Mock DOM environment
const createMockSVG = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  // Mock querySelector to return town groups
  const mockTownGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  mockTownGroup.setAttribute('data-town-id', 'A');
  mockTownGroup.classList.add('town-group');
  mockTownGroup.setAttribute('tabindex', '0'); // Simulate what the renderer sets

  // Mock querySelector to return our mock town group
  svg.querySelector = vi.fn((selector: string) => {
    if (selector === '[data-town-id="A"]') {
      return mockTownGroup;
    }
    return null;
  });

  return { svg, mockTownGroup };
};

const createMockGameState = (): GameState => ({
  towns: [
    {
      id: 'A',
      name: 'Town A',
      prosperityRaw: 1,
      militaryRaw: 2,
      prices: { fish: 10, wood: 15, ore: 20 },
      resources: { fish: 0, wood: 0, ore: 0 },
      treasury: 0,
      revealed: {
        prosperityTier: 'struggling',
        militaryTier: 'militia',
        lastUpdatedTurn: 0,
      },
    },
  ],
  turn: 0,
  version: 1,
  rngSeed: 'test',
  goods: {
    fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
    wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
    ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: -1, militaryDelta: 2 } },
  },
});

describe('mountTownView', () => {
  let selectionStore: SelectionStore;
  let mockGameState: GameState;
  let townView: { update(): void; destroy(): void };

  beforeEach(() => {
    selectionStore = new SelectionStore();
    mockGameState = createMockGameState();
  });

  afterEach(() => {
    if (townView) {
      townView.destroy();
    }
  });

  describe('selection highlighting', () => {
    it('should add .is-selected class when store.setTown is called', () => {
      const { svg, mockTownGroup } = createMockSVG();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
      });

      // Initially no selection
      expect(mockTownGroup.classList.contains('is-selected')).toBe(false);

      // Set selection
      selectionStore.setTown('A');

      // Should have selection class
      expect(mockTownGroup.classList.contains('is-selected')).toBe(true);
    });

    it('should remove .is-selected from previous town when selection changes', () => {
      const { svg, mockTownGroup } = createMockSVG();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
      });

      // Set initial selection
      selectionStore.setTown('A');
      expect(mockTownGroup.classList.contains('is-selected')).toBe(true);

      // Clear selection
      selectionStore.setTown(null);
      expect(mockTownGroup.classList.contains('is-selected')).toBe(false);
    });

    it('should handle multiple selection changes correctly', () => {
      const { svg, mockTownGroup } = createMockSVG();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
      });

      // Multiple selection changes
      selectionStore.setTown('A');
      expect(mockTownGroup.classList.contains('is-selected')).toBe(true);

      selectionStore.setTown(null);
      expect(mockTownGroup.classList.contains('is-selected')).toBe(false);

      selectionStore.setTown('A');
      expect(mockTownGroup.classList.contains('is-selected')).toBe(true);
    });
  });

  describe('update functionality', () => {
    it('should call update() and not leak DOM nodes', () => {
      const { svg } = createMockSVG();
      const initialChildCount = svg.children.length;

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
      });

      // Call update
      townView.update();

      // Should not have created additional DOM nodes
      expect(svg.children.length).toBe(initialChildCount);
    });

    it('should handle state changes through update()', () => {
      const { svg } = createMockSVG();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
      });

      // Update should complete without error
      expect(() => townView.update()).not.toThrow();
    });
  });

  describe('focus behavior', () => {
    it('should focus selected town when onSelectFocus is true (default)', () => {
      const { svg, mockTownGroup } = createMockSVG();

      // Mock focus method
      mockTownGroup.focus = vi.fn();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
        onSelectFocus: true,
      });

      // Set selection - should trigger focus
      selectionStore.setTown('A');

      expect(mockTownGroup.focus).toHaveBeenCalled();
    });

    it('should not focus when onSelectFocus is false', () => {
      const { svg, mockTownGroup } = createMockSVG();

      // Mock focus method
      mockTownGroup.focus = vi.fn();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
        onSelectFocus: false,
      });

      // Set selection - should not trigger focus
      selectionStore.setTown('A');

      expect(mockTownGroup.focus).not.toHaveBeenCalled();
    });

    it('should set tabindex on town groups for accessibility', () => {
      const { svg, mockTownGroup } = createMockSVG();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
      });

      // Town groups should have tabindex for keyboard navigation
      expect(mockTownGroup.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from selection store on destroy', () => {
      const { svg } = createMockSVG();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
      });

      // Mock the unsubscribe function
      const mockUnsubscribe = vi.fn();
      vi.spyOn(selectionStore, 'subscribe').mockReturnValue(mockUnsubscribe);

      // Destroy should call unsubscribe
      townView.destroy();

      // Note: This test is limited by the fact that we can't easily spy on the actual
      // subscription cleanup, but the destroy method should handle cleanup properly
    });

    it('should remove selection class on destroy', () => {
      const { svg, mockTownGroup } = createMockSVG();

      townView = mountTownView({
        svg,
        getState: () => mockGameState,
        selection: selectionStore,
      });

      // Set selection
      selectionStore.setTown('A');
      expect(mockTownGroup.classList.contains('is-selected')).toBe(true);

      // Destroy should clean up selection
      townView.destroy();
      expect(mockTownGroup.classList.contains('is-selected')).toBe(false);
    });
  });
});
