import { describe, it, expect, beforeEach } from 'vitest';

import type { PlayerAction } from './PlayerAction';
import { PlayerActionQueue } from './PlayerActionQueue';

describe('PlayerActionQueue', () => {
  let queue: PlayerActionQueue;

  beforeEach(() => {
    queue = new PlayerActionQueue();
  });

  describe('enqueue/dequeue order', () => {
    it('should process actions in FIFO order', () => {
      const action1: PlayerAction = { type: 'trade' };
      const action2: PlayerAction = { type: 'none' };
      const action3: PlayerAction = { type: 'trade', payload: { good: 'fish' } };

      queue.enqueue(action1);
      queue.enqueue(action2);
      queue.enqueue(action3);

      expect(queue.dequeue()).toBe(action1);
      expect(queue.dequeue()).toBe(action2);
      expect(queue.dequeue()).toBe(action3);
      expect(queue.dequeue()).toBeUndefined();
    });

    it('should return undefined when dequeuing from empty queue', () => {
      expect(queue.dequeue()).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should empty the queue', () => {
      queue.enqueue({ type: 'trade' });
      queue.enqueue({ type: 'none' });

      expect(queue.length).toBe(2);

      queue.clear();

      expect(queue.length).toBe(0);
      expect(queue.dequeue()).toBeUndefined();
    });
  });

  describe('length', () => {
    it('should return correct queue length', () => {
      expect(queue.length).toBe(0);

      queue.enqueue({ type: 'trade' });
      expect(queue.length).toBe(1);

      queue.enqueue({ type: 'none' });
      expect(queue.length).toBe(2);

      queue.dequeue();
      expect(queue.length).toBe(1);

      queue.clear();
      expect(queue.length).toBe(0);
    });
  });
});
