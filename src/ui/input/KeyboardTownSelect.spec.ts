import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { bindTownKeyboardShortcuts } from './KeyboardTownSelect';
import { SelectionStore } from './SelectionStore';

describe('KeyboardTownSelect', () => {
  let store: SelectionStore;
  let cleanup: (() => void) | undefined;
  const townOrder = ['riverdale', 'forestburg', 'ironforge'];

  beforeEach(() => {
    store = new SelectionStore();
    cleanup = bindTownKeyboardShortcuts(store, townOrder);
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
    }
  });

  describe('number key shortcuts', () => {
    it('should select town when pressing number key 1', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBe('riverdale');
    });

    it('should select town when pressing number key 2', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: '2',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBe('forestburg');
    });

    it('should select town when pressing number key 3', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: '3',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBe('ironforge');
    });

    it('should not select town when pressing number key beyond available towns', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: '4',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });

    it('should not select town when pressing number key 0', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: '0',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });

    it('should update selection when pressing different number keys', () => {
      // First select town 1
      const keyEvent1 = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(keyEvent1);

      expect(store.get().selectedTownId).toBe('riverdale');

      // Then select town 3
      const keyEvent3 = new KeyboardEvent('keydown', {
        key: '3',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(keyEvent3);

      expect(store.get().selectedTownId).toBe('ironforge');
    });
  });

  describe('escape key', () => {
    it('should clear selection when pressing escape', () => {
      // First select a town
      store.setTown('riverdale');
      expect(store.get().selectedTownId).toBe('riverdale');

      // Press escape
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });

    it('should clear selection when pressing escape with no selection', () => {
      expect(store.get().selectedTownId).toBeNull();

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });
  });

  describe('event prevention', () => {
    it('should prevent default behavior for number keys', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');
      document.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default behavior for escape key', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');
      document.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('input field handling', () => {
    it('should not handle shortcuts when typing in input field', () => {
      // Create a mock input field
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const keyEvent = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();

      // Cleanup
      document.body.removeChild(input);
    });

    it('should not handle shortcuts when typing in textarea', () => {
      // Create a mock textarea
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const keyEvent = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();

      // Cleanup
      document.body.removeChild(textarea);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners when cleanup is called', () => {
      if (cleanup) {
        cleanup();
      }

      // Try to use shortcuts - should not work
      const keyEvent = new KeyboardEvent('keydown', {
        key: '1',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(keyEvent);

      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });
  });
});
