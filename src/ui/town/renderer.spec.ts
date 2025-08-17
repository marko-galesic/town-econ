import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type { GameState } from '../../types/GameState';

import { renderTowns } from './renderer';

// Mock DOM environment for testing
const createMockSVG = (): SVGSVGElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1000 1000');
  return svg;
};

const createMockGameState = (): GameState => ({
  turn: 0,
  version: 1,
  rngSeed: 'test-seed',
  towns: [
    {
      id: 'riverdale',
      name: 'Riverdale',
      resources: { fish: 100, wood: 50, ore: 25 },
      prices: { fish: 15, wood: 20, ore: 30 },
      militaryRaw: 5,
      prosperityRaw: 3,
      treasury: 1000,
      revealed: {
        militaryTier: 'garrison',
        prosperityTier: 'modest',
        lastUpdatedTurn: 0,
      },
    },
    {
      id: 'forestburg',
      name: 'Forestburg',
      resources: { fish: 75, wood: 150, ore: 10 },
      prices: { fish: 18, wood: 12, ore: 35 },
      militaryRaw: 2,
      prosperityRaw: 1,
      treasury: 800,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 0,
      },
    },
    {
      id: 'ironforge',
      name: 'Ironforge',
      resources: { fish: 25, wood: 30, ore: 200 },
      prices: { fish: 20, wood: 25, ore: 15 },
      militaryRaw: 8,
      prosperityRaw: 6,
      treasury: 1200,
      revealed: {
        militaryTier: 'formidable',
        prosperityTier: 'prosperous',
        lastUpdatedTurn: 0,
      },
    },
  ],
  goods: {
    fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
    wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
    ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: -1, militaryDelta: 2 } },
  },
});

describe('Town Renderer', () => {
  let svg: SVGSVGElement;
  let mockGetState: ReturnType<typeof vi.fn<[], GameState>>;
  let renderer: ReturnType<typeof renderTowns>;

  beforeEach(() => {
    svg = createMockSVG();
    mockGetState = vi.fn<[], GameState>(() => createMockGameState());
    renderer = renderTowns({ svg, getState: mockGetState });
  });

  afterEach(() => {
    renderer.destroy();
  });

  describe('Initial Rendering', () => {
    it('creates exactly 3 town groups with correct data attributes', () => {
      const townGroups = svg.querySelectorAll('[data-town-id]');
      expect(townGroups).toHaveLength(3);

      const townIds = Array.from(townGroups).map(g => g.getAttribute('data-town-id'));
      expect(townIds).toEqual(['riverdale', 'forestburg', 'ironforge']);
    });

    it('creates town groups with correct accessibility attributes', () => {
      const townGroups = svg.querySelectorAll('[data-town-id]');

      townGroups.forEach(group => {
        expect(group.getAttribute('role')).toBe('group');
        expect(group.getAttribute('tabindex')).toBe('0');
        expect(group.classList.contains('town-group')).toBe(true);
      });
    });

    it('renders town names correctly', () => {
      const riverdaleName = svg.querySelector('[data-town-id="riverdale"] .town-name');
      const forestburgName = svg.querySelector('[data-town-id="forestburg"] .town-name');
      const ironforgeName = svg.querySelector('[data-town-id="ironforge"] .town-name');

      expect(riverdaleName?.textContent).toBe('Riverdale');
      expect(forestburgName?.textContent).toBe('Forestburg');
      expect(ironforgeName?.textContent).toBe('Ironforge');
    });

    it('renders price pills with correct currency format', () => {
      const riverdalePrices = svg.querySelectorAll('[data-town-id="riverdale"] .price-pill-text');
      expect(riverdalePrices).toHaveLength(3);

      const priceTexts = Array.from(riverdalePrices).map(el => el.textContent);
      expect(priceTexts).toEqual(['₲15', '₲20', '₲30']);
    });

    it('renders tier badges with correct labels', () => {
      const riverdaleProsperity = svg.querySelector(
        '[data-town-id="riverdale"] .badge-prosperity + .badge-text',
      );
      const riverdaleMilitary = svg.querySelector(
        '[data-town-id="riverdale"] .badge-military + .badge-text',
      );

      expect(riverdaleProsperity?.textContent).toBe('Modest');
      expect(riverdaleMilitary?.textContent).toBe('Garrison');
    });

    it('includes ARIA labels with town summary information', () => {
      const riverdaleGroup = svg.querySelector('[data-town-id="riverdale"]');
      const ariaLabel = riverdaleGroup?.getAttribute('aria-label');

      expect(ariaLabel).toContain('Riverdale');
      expect(ariaLabel).toContain('Prosperity: Modest');
      expect(ariaLabel).toContain('Military: Garrison');
    });
  });

  describe('Update Functionality', () => {
    it('updates price displays when state changes', () => {
      // Change prices in the mock state
      const newState = createMockGameState();
      if (newState.towns[0]) {
        newState.towns[0].prices.fish = 25;
        newState.towns[0].prices.wood = 30;
      }

      mockGetState.mockReturnValue(newState);

      // Update the renderer
      renderer.update();

      // Check that prices were updated
      const fishPrice = svg.querySelector('[data-town-id="riverdale"] .price-pill-text');
      expect(fishPrice?.textContent).toBe('₲25');
    });

    it('updates tier badges when state changes', () => {
      // Change tiers in the mock state
      const newState = createMockGameState();
      if (newState.towns[0]) {
        newState.towns[0].revealed.prosperityTier = 'opulent';
        newState.towns[0].revealed.militaryTier = 'host';
      }

      mockGetState.mockReturnValue(newState);

      // Update the renderer
      renderer.update();

      // Check that badges were updated
      const prosperityBadge = svg.querySelector(
        '[data-town-id="riverdale"] .badge-prosperity + .badge-text',
      );
      const militaryBadge = svg.querySelector(
        '[data-town-id="riverdale"] .badge-military + .badge-text',
      );

      expect(prosperityBadge?.textContent).toBe('Opulent');
      expect(militaryBadge?.textContent).toBe('Host');
    });

    it('updates ARIA labels when state changes', () => {
      // Change town name in the mock state
      const newState = createMockGameState();
      if (newState.towns[0]) {
        newState.towns[0].name = 'New Riverdale';
      }

      mockGetState.mockReturnValue(newState);

      // Update the renderer
      renderer.update();

      // Check that ARIA label was updated
      const riverdaleGroup = svg.querySelector('[data-town-id="riverdale"]');
      const ariaLabel = riverdaleGroup?.getAttribute('aria-label');

      expect(ariaLabel).toContain('New Riverdale');
    });

    it('maintains same DOM nodes during updates', () => {
      const initialGroups = Array.from(svg.querySelectorAll('[data-town-id]'));
      const initialPriceTexts = Array.from(svg.querySelectorAll('.price-pill-text'));

      // Update the renderer
      renderer.update();

      const updatedGroups = Array.from(svg.querySelectorAll('[data-town-id]'));
      const updatedPriceTexts = Array.from(svg.querySelectorAll('.price-pill-text'));

      // Check that the same nodes are preserved
      expect(updatedGroups).toEqual(initialGroups);
      expect(updatedPriceTexts).toEqual(initialPriceTexts);
    });
  });

  describe('Destroy Functionality', () => {
    it('removes all town groups when destroyed', () => {
      expect(svg.querySelectorAll('[data-town-id]')).toHaveLength(3);

      renderer.destroy();

      expect(svg.querySelectorAll('[data-town-id]')).toHaveLength(0);
    });

    it('cleans up internal state when destroyed', () => {
      renderer.destroy();

      // Calling update after destroy should not cause errors
      expect(() => renderer.update()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles missing town layouts gracefully', () => {
      const invalidState = createMockGameState();
      if (invalidState.towns[0]) {
        invalidState.towns[0].id = 'nonexistent-town';
      }

      mockGetState.mockReturnValue(invalidState);

      // Should not throw, just log warning
      expect(() => renderer.update()).not.toThrow();
    });

    it('handles invalid state gracefully', () => {
      mockGetState.mockReturnValue({} as GameState);

      // Should not throw, just log warning
      expect(() => renderer.update()).not.toThrow();
    });
  });

  describe('Layout Positioning', () => {
    it('positions towns at correct coordinates', () => {
      const riverdaleGroup = svg.querySelector('[data-town-id="riverdale"]');
      const riverdaleNode = riverdaleGroup?.querySelector('.town-node') as SVGCircleElement;

      expect(riverdaleNode?.getAttribute('cx')).toBe('500');
      expect(riverdaleNode?.getAttribute('cy')).toBe('580');
    });

    it('positions price pills correctly relative to town center', () => {
      const riverdalePrices = svg.querySelectorAll('[data-town-id="riverdale"] .price-pill');
      const priceRects = Array.from(riverdalePrices) as SVGRectElement[];

      // Fish pill (left)
      expect(priceRects[0]?.getAttribute('x')).toBe('415'); // 500 - 60 - 25
      expect(priceRects[0]?.getAttribute('y')).toBe('545'); // 580 - 20 - 15

      // Wood pill (center)
      expect(priceRects[1]?.getAttribute('x')).toBe('475'); // 500 - 25
      expect(priceRects[1]?.getAttribute('y')).toBe('545'); // 580 - 20 - 15

      // Ore pill (right)
      expect(priceRects[2]?.getAttribute('x')).toBe('535'); // 500 + 60 - 25
      expect(priceRects[2]?.getAttribute('y')).toBe('545'); // 580 - 20 - 15
    });
  });
});
