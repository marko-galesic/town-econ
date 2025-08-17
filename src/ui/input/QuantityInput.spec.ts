import { describe, it, expect, beforeEach, vi } from 'vitest';

import { mountQuantityInput } from './QuantityInput';

describe('QuantityInput', () => {
  let container: HTMLElement;
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    onChange = vi.fn();
  });

  it('should mount with initial quantity of 1', () => {
    const input = mountQuantityInput(container, onChange);

    expect(input.get()).toBe(1);
    expect(container.querySelector('.quantity-display')?.textContent).toBe('1');
    expect(container.querySelectorAll('.quantity-btn')).toHaveLength(2);
  });

  it('should clamp quantity to integers ≥1', () => {
    const input = mountQuantityInput(container, onChange);

    // Test setting negative numbers
    input.set(-5);
    expect(input.get()).toBe(1);

    // Test setting zero
    input.set(0);
    expect(input.get()).toBe(1);

    // Test setting decimal numbers
    input.set(3.7);
    expect(input.get()).toBe(3);

    // Test setting valid integers
    input.set(10);
    expect(input.get()).toBe(10);
  });

  it('should handle plus button clicks', () => {
    const input = mountQuantityInput(container, onChange);
    const plusBtn = container.querySelector('.plus-btn') as HTMLButtonElement;

    plusBtn.click();
    expect(input.get()).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);

    plusBtn.click();
    expect(input.get()).toBe(3);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('should handle minus button clicks', () => {
    const input = mountQuantityInput(container, onChange);
    const minusBtn = container.querySelector('.minus-btn') as HTMLButtonElement;

    // Set initial quantity to 3
    input.set(3);
    onChange.mockClear();

    minusBtn.click();
    expect(input.get()).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);

    minusBtn.click();
    expect(input.get()).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);

    // Should not go below 1
    minusBtn.click();
    expect(input.get()).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should handle keyboard navigation', () => {
    const input = mountQuantityInput(container, onChange);
    const wrapper = container.querySelector('.quantity-input') as HTMLElement;

    // Arrow up should increase quantity
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(input.get()).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);

    // Arrow down should decrease quantity
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(input.get()).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);

    // Home should set to 1
    input.set(5);
    onChange.mockClear();
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(input.get()).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);

    // End should set to reasonable upper limit
    onChange.mockClear();
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(input.get()).toBe(999);
    expect(onChange).toHaveBeenCalledWith(999);
  });

  it('should prevent default on keyboard events', () => {
    mountQuantityInput(container, onChange);
    const wrapper = container.querySelector('.quantity-input') as HTMLElement;

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    wrapper.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not call onChange when quantity is unchanged', () => {
    const input = mountQuantityInput(container, onChange);

    // Initial mount should call onChange once
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(1);

    onChange.mockClear();

    // Setting to same value should not call onChange
    input.set(1);
    expect(onChange).not.toHaveBeenCalled();

    // Setting to different value should call onChange
    input.set(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should focus plus button after click', () => {
    mountQuantityInput(container, onChange);
    const plusBtn = container.querySelector('.plus-btn') as HTMLButtonElement;
    const focusSpy = vi.spyOn(plusBtn, 'focus');

    plusBtn.click();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should focus minus button after click', () => {
    mountQuantityInput(container, onChange);
    const minusBtn = container.querySelector('.minus-btn') as HTMLButtonElement;
    const focusSpy = vi.spyOn(minusBtn, 'focus');

    minusBtn.click();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should destroy cleanly', () => {
    const input = mountQuantityInput(container, onChange);

    expect(container.querySelector('.quantity-input')).toBeTruthy();

    input.destroy();

    expect(container.querySelector('.quantity-input')).toBeFalsy();
  });

  it('should have proper ARIA labels', () => {
    mountQuantityInput(container, onChange);

    const minusBtn = container.querySelector('.minus-btn') as HTMLButtonElement;
    const plusBtn = container.querySelector('.plus-btn') as HTMLButtonElement;

    expect(minusBtn.getAttribute('aria-label')).toBe('Decrease quantity');
    expect(plusBtn.getAttribute('aria-label')).toBe('Increase quantity');
  });
});
