import { describe, it, expect } from 'vitest';
import { hello } from './hello';

describe('hello', () => {
  it('should return greeting with name', () => {
    const result = hello('Town');
    expect(result).toBe('Hello, Town');
  });
});
