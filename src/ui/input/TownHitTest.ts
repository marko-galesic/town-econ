import type { SelectionStore } from './SelectionStore';

/**
 * Binds pointer event handlers to an SVG element to enable town selection via click/tap.
 * Expects SVG structure with <g data-town-id="..."> elements representing towns.
 */
export function bindTownHitTest(svg: SVGSVGElement, store: SelectionStore): () => void {
  let previousSelectedElement: SVGElement | null = null;

  // Subscribe to selection changes to update visual state
  const unsubscribe = store.subscribe(state => {
    // Remove previous selection styling
    if (previousSelectedElement) {
      previousSelectedElement.classList.remove('is-selected');
      previousSelectedElement.setAttribute('aria-selected', 'false');
      previousSelectedElement = null;
    }

    // Apply selection styling to new selection
    if (state.selectedTownId) {
      const selectedElement = svg.querySelector(
        `[data-town-id="${state.selectedTownId}"]`,
      ) as SVGElement;
      if (selectedElement) {
        selectedElement.classList.add('is-selected');
        selectedElement.setAttribute('aria-selected', 'true');
        previousSelectedElement = selectedElement;
      }
    }
  });

  // Handle pointer events for town selection
  const handlePointerUp = (event: PointerEvent): void => {
    const target = event.target as Element;

    // Find the closest ancestor with data-town-id
    const townElement = target.closest('[data-town-id]') as SVGElement;

    if (townElement) {
      const townId = townElement.getAttribute('data-town-id');
      if (townId) {
        store.setTown(townId);
      }
    } else {
      // Click outside any town - clear selection
      store.setTown(null);
    }
  };

  // Add pointer event listener
  svg.addEventListener('pointerup', handlePointerUp);

  // Cleanup function
  return () => {
    svg.removeEventListener('pointerup', handlePointerUp);
    unsubscribe();
  };
}
