import type { SelectionStore } from './SelectionStore';

/**
 * Binds keyboard shortcuts for town selection.
 * Number keys 1..N select towns by index, Escape clears selection.
 */
export function bindTownKeyboardShortcuts(store: SelectionStore, townOrder: string[]): () => void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    // Ignore if user is typing in an input field
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Also check if any input element is currently focused
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const key = event.key;

    // Number keys 1-9 for town selection
    if (/^[1-9]$/.test(key)) {
      const index = parseInt(key) - 1;
      if (index < townOrder.length) {
        const townId = townOrder[index];
        if (townId) {
          store.setTown(townId);
          event.preventDefault();
        }
      }
    }

    // Escape key clears selection
    if (key === 'Escape') {
      store.setTown(null);
      event.preventDefault();
    }
  };

  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}
