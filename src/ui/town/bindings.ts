import type { GameState } from '../../types/GameState';
import type { SelectionStore } from '../input/SelectionStore';

import { renderTowns } from './renderer';

export interface TownViewMountOpts {
  svg: SVGSVGElement;
  getState: () => GameState;
  selection: SelectionStore;
  onSelectFocus?: boolean; // default true
}

export function mountTownView(opts: TownViewMountOpts): { update(): void; destroy(): void } {
  const { svg, getState, selection, onSelectFocus = true } = opts;

  // Initialize the town renderer
  const renderer = renderTowns({ svg, getState });

  // Track the currently selected town group for highlighting
  let currentSelectedGroup: SVGGElement | null = null;

  /**
   * Updates the visual selection state based on the selection store
   */
  function updateSelection(selectedTownId: string | null): void {
    // Remove selection from previous town
    if (currentSelectedGroup) {
      currentSelectedGroup.classList.remove('is-selected');
      currentSelectedGroup = null;
    }

    // Add selection to new town if one is selected
    if (selectedTownId) {
      const townGroup = svg.querySelector(`[data-town-id="${selectedTownId}"]`) as SVGGElement;
      if (townGroup) {
        townGroup.classList.add('is-selected');
        currentSelectedGroup = townGroup;

        // Handle focus if enabled
        if (onSelectFocus) {
          townGroup.focus();
        }
      }
    }
  }

  /**
   * Subscribe to selection changes
   */
  const unsubscribeSelection = selection.subscribe(state => {
    updateSelection(state.selectedTownId);
  });

  /**
   * Updates the town view with current state
   */
  function update(): void {
    renderer.update();
  }

  /**
   * Cleans up all resources and event listeners
   */
  function destroy(): void {
    unsubscribeSelection();
    renderer.destroy();

    // Clean up selection state
    if (currentSelectedGroup) {
      currentSelectedGroup.classList.remove('is-selected');
      currentSelectedGroup = null;
    }
  }

  // Initialize selection state
  const initialState = selection.get();
  updateSelection(initialState.selectedTownId);

  return { update, destroy };
}
