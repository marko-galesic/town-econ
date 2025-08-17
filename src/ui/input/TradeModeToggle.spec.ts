import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { mountTradeModeToggle } from './TradeModeToggle';

describe('TradeModeToggle', () => {
  let container: HTMLElement;
  // eslint-disable-next-line no-unused-vars
  let onChange: (mode: 'buy' | 'sell') => void;
  let destroy: { destroy(): void } | undefined;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onChange = vi.fn();
    destroy = undefined;
  });

  afterEach(() => {
    if (destroy) {
      destroy.destroy();
    }
    document.body.removeChild(container);
  });

  it('renders buy and sell buttons', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const buttons = container.querySelectorAll('.mode-button');
    expect(buttons).toHaveLength(2);

    expect(buttons[0]?.textContent).toBe('Buy');
    expect(buttons[1]?.textContent).toBe('Sell');
  });

  it('sets buy as active by default', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const buttons = container.querySelectorAll('.mode-button');
    expect(buttons[0]?.classList.contains('is-active')).toBe(true);
    expect(buttons[1]?.classList.contains('is-active')).toBe(false);
  });

  it('calls onChange when clicking buy button', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const buyButton = container.querySelector('[data-mode="buy"]') as HTMLButtonElement;
    buyButton.click();

    expect(onChange).toHaveBeenCalledWith('buy');
  });

  it('calls onChange when clicking sell button', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const sellButton = container.querySelector('[data-mode="sell"]') as HTMLButtonElement;
    sellButton.click();

    expect(onChange).toHaveBeenCalledWith('sell');
  });

  it('updates active state when switching modes', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const buyButton = container.querySelector('[data-mode="buy"]') as HTMLButtonElement;
    const sellButton = container.querySelector('[data-mode="sell"]') as HTMLButtonElement;

    // Initially buy is active
    expect(buyButton.classList.contains('is-active')).toBe(true);
    expect(sellButton.classList.contains('is-active')).toBe(false);

    // Click sell
    sellButton.click();
    expect(buyButton.classList.contains('is-active')).toBe(false);
    expect(sellButton.classList.contains('is-active')).toBe(true);

    // Click buy
    buyButton.click();
    expect(buyButton.classList.contains('is-active')).toBe(true);
    expect(sellButton.classList.contains('is-active')).toBe(false);
  });

  it('selects mode with Enter key', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const sellButton = container.querySelector('[data-mode="sell"]') as HTMLButtonElement;
    sellButton.focus();
    sellButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onChange).toHaveBeenCalledWith('sell');
  });

  it('selects mode with Space key', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const sellButton = container.querySelector('[data-mode="sell"]') as HTMLButtonElement;
    sellButton.focus();
    sellButton.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

    expect(onChange).toHaveBeenCalledWith('sell');
  });

  it('has proper ARIA attributes', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const toggle = container.querySelector('.trade-mode-toggle');
    expect(toggle?.getAttribute('role')).toBe('radiogroup');
    expect(toggle?.getAttribute('aria-label')).toBe('Select trade mode');

    const buttons = container.querySelectorAll('.mode-button');
    buttons.forEach((button, index) => {
      expect(button.getAttribute('role')).toBe('radio');
      expect(button.getAttribute('data-mode')).toBeTruthy();
      expect(button.getAttribute('aria-checked')).toBe(index === 0 ? 'true' : 'false');
    });
  });

  it('maintains state between mode switches', () => {
    destroy = mountTradeModeToggle(container, onChange);

    const buyButton = container.querySelector('[data-mode="buy"]') as HTMLButtonElement;
    const sellButton = container.querySelector('[data-mode="sell"]') as HTMLButtonElement;

    // Switch to sell
    sellButton.click();
    expect(onChange).toHaveBeenLastCalledWith('sell');

    // Switch back to buy
    buyButton.click();
    expect(onChange).toHaveBeenLastCalledWith('buy');
  });
});
