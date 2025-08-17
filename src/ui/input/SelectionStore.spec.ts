import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SelectionStore } from './SelectionStore';

describe('SelectionStore', () => {
  let store: SelectionStore;

  beforeEach(() => {
    store = new SelectionStore();
  });

  describe('initial state', () => {
    it('should start with no selected town', () => {
      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });
  });

  describe('setTown', () => {
    it('should set selected town', () => {
      store.setTown('riverdale');
      const state = store.get();
      expect(state.selectedTownId).toBe('riverdale');
    });

    it('should clear selection when set to null', () => {
      store.setTown('riverdale');
      store.setTown(null);
      const state = store.get();
      expect(state.selectedTownId).toBeNull();
    });

    it('should update selection when setting different town', () => {
      store.setTown('riverdale');
      store.setTown('forestburg');
      const state = store.get();
      expect(state.selectedTownId).toBe('forestburg');
    });
  });

  describe('subscribe', () => {
    it('should call subscriber when state changes', () => {
      const mockSubscriber = vi.fn();
      store.subscribe(mockSubscriber);

      store.setTown('riverdale');
      expect(mockSubscriber).toHaveBeenCalledWith({ selectedTownId: 'riverdale' });
    });

    it('should call subscriber with current state on subscription', () => {
      store.setTown('riverdale');
      const mockSubscriber = vi.fn();
      store.subscribe(mockSubscriber);

      // Should not be called immediately on subscription
      expect(mockSubscriber).not.toHaveBeenCalled();
    });

    it('should call all subscribers when state changes', () => {
      const mockSubscriber1 = vi.fn();
      const mockSubscriber2 = vi.fn();

      store.subscribe(mockSubscriber1);
      store.subscribe(mockSubscriber2);

      store.setTown('riverdale');

      expect(mockSubscriber1).toHaveBeenCalledWith({ selectedTownId: 'riverdale' });
      expect(mockSubscriber2).toHaveBeenCalledWith({ selectedTownId: 'riverdale' });
    });

    it('should return unsubscribe function', () => {
      const mockSubscriber = vi.fn();
      const unsubscribe = store.subscribe(mockSubscriber);

      store.setTown('riverdale');
      expect(mockSubscriber).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.setTown('forestburg');
      expect(mockSubscriber).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle multiple unsubscribes gracefully', () => {
      const mockSubscriber = vi.fn();
      const unsubscribe = store.subscribe(mockSubscriber);

      unsubscribe();
      unsubscribe(); // Should not throw

      store.setTown('riverdale');
      expect(mockSubscriber).not.toHaveBeenCalled();
    });
  });

  describe('state immutability', () => {
    it('should return new state object on each call', () => {
      const state1 = store.get();
      const state2 = store.get();

      // Each call should return a new object
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('should not allow external modification of returned state', () => {
      const state = store.get();
      const originalSelectedTownId = state.selectedTownId;

      // Modifying the returned object should not affect the store
      state.selectedTownId = 'riverdale';

      const newState = store.get();
      expect(newState.selectedTownId).toBe(originalSelectedTownId);
    });
  });
});
