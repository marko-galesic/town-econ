import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SelectionStore } from './SelectionStore';
import { bindTownHitTest } from './TownHitTest';

describe('TownHitTest', () => {
  let store: SelectionStore;
  let svg: SVGSVGElement;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    store = new SelectionStore();

    // Create test SVG with towns
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '400');
    svg.setAttribute('height', '300');

    // Create town groups
    const town1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    town1.setAttribute('data-town-id', 'riverdale');
    town1.setAttribute('role', 'group');
    town1.setAttribute('aria-selected', 'false');

    const town2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    town2.setAttribute('data-town-id', 'forestburg');
    town2.setAttribute('role', 'group');
    town2.setAttribute('aria-selected', 'false');

    // Add some content to make them clickable
    const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle1.setAttribute('cx', '100');
    circle1.setAttribute('cy', '100');
    circle1.setAttribute('r', '30');

    const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle2.setAttribute('cx', '200');
    circle2.setAttribute('cy', '150');
    circle2.setAttribute('r', '30');

    town1.appendChild(circle1);
    town2.appendChild(circle2);
    svg.appendChild(town1);
    svg.appendChild(town2);

    // Bind hit testing
    cleanup = bindTownHitTest(svg, store);
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
    }
  });

  describe('pointer events', () => {
    it('should select town when clicking on town element', () => {
      const town1 = svg.querySelector('[data-town-id="riverdale"]') as SVGElement;

      // Simulate pointerup event
      const pointerEvent = new MouseEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });

      town1.dispatchEvent(pointerEvent);

      const state = store.get();
      expect(state.selectedTownId).toBe('riverdale');
    });

    it('should select town when clicking on child element', () => {
      const circle = svg.querySelector('[data-town-id="riverdale"] circle') as SVGElement;

      const pointerEvent = new MouseEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });

      circle.dispatchEvent(pointerEvent);

      const state = store.get();
      expect(state.selectedTownId).toBe('riverdale');
    });

    it('should clear selection when clicking outside towns', () => {
      // First select a town
      store.setTown('riverdale');

      // Click on SVG background (not on a town)
      const pointerEvent = new MouseEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 50,
      });

      svg.dispatchEvent(pointerEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });

    it('should update selection when clicking different town', () => {
      // First select a town
      store.setTown('riverdale');

      // Click on different town
      const town2 = svg.querySelector('[data-town-id="forestburg"]') as SVGElement;
      const pointerEvent = new MouseEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: 200,
        clientY: 150,
      });

      town2.dispatchEvent(pointerEvent);

      const state = store.get();
      expect(state.selectedTownId).toBe('forestburg');
    });
  });

  describe('visual state management', () => {
    it('should add is-selected class to selected town', () => {
      const town1 = svg.querySelector('[data-town-id="riverdale"]') as SVGElement;

      store.setTown('riverdale');

      expect(town1.classList.contains('is-selected')).toBe(true);
      expect(town1.getAttribute('aria-selected')).toBe('true');
    });

    it('should remove is-selected class from previously selected town', () => {
      const town1 = svg.querySelector('[data-town-id="riverdale"]') as SVGElement;
      const town2 = svg.querySelector('[data-town-id="forestburg"]') as SVGElement;

      // Select first town
      store.setTown('riverdale');
      expect(town1.classList.contains('is-selected')).toBe(true);

      // Select second town
      store.setTown('forestburg');
      expect(town1.classList.contains('is-selected')).toBe(false);
      expect(town2.classList.contains('is-selected')).toBe(true);
    });

    it('should clear aria-selected attributes when selection is cleared', () => {
      const town1 = svg.querySelector('[data-town-id="riverdale"]') as SVGElement;

      // Select town
      store.setTown('riverdale');
      expect(town1.getAttribute('aria-selected')).toBe('true');

      // Clear selection
      store.setTown(null);
      expect(town1.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners when cleanup is called', () => {
      if (cleanup) {
        cleanup();
      }

      // Try to select a town - should not work
      const town1 = svg.querySelector('[data-town-id="riverdale"]') as SVGElement;
      const pointerEvent = new MouseEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });

      town1.dispatchEvent(pointerEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });
  });
});
