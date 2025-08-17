import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { mountGoodsPicker } from './GoodsPicker';

describe('GoodsPicker', () => {
  let container: HTMLElement;
  // eslint-disable-next-line no-unused-vars
  let onChange: (good: 'fish' | 'wood' | 'ore') => void;
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

  it('renders the correct number of goods', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const buttons = container.querySelectorAll('.good-button');
    expect(buttons).toHaveLength(3);

    expect(buttons[0]?.textContent).toBe('Fish');
    expect(buttons[1]?.textContent).toBe('Wood');
    expect(buttons[2]?.textContent).toBe('Ore');
  });

  it('sets first good as active by default', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const buttons = container.querySelectorAll('.good-button');
    expect(buttons[0]?.classList.contains('is-active')).toBe(true);
    expect(buttons[1]?.classList.contains('is-active')).toBe(false);
    expect(buttons[2]?.classList.contains('is-active')).toBe(false);
  });

  it('calls onChange when clicking a good', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const woodButton = container.querySelector('[data-good="wood"]') as HTMLButtonElement;
    woodButton.click();

    expect(onChange).toHaveBeenCalledWith('wood');
  });

  it('updates active state when selecting a good', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const woodButton = container.querySelector('[data-good="wood"]') as HTMLButtonElement;
    woodButton.click();

    const buttons = container.querySelectorAll('.good-button');
    expect(buttons[0]?.classList.contains('is-active')).toBe(false);
    expect(buttons[1]?.classList.contains('is-active')).toBe(true);
    expect(buttons[2]?.classList.contains('is-active')).toBe(false);
  });

  it('navigates with arrow keys', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const firstButton = container.querySelector('.good-button') as HTMLButtonElement;
    firstButton.focus();

    // Test right arrow
    firstButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    const secondButton = container.querySelectorAll('.good-button')[1] as HTMLButtonElement;
    expect(document.activeElement).toBe(secondButton);

    // Test left arrow
    secondButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(document.activeElement).toBe(firstButton);
  });

  it('wraps around at boundaries', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const firstButton = container.querySelector('.good-button') as HTMLButtonElement;
    firstButton.focus();

    // Test left arrow from first button (should wrap to last)
    firstButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    const lastButton = container.querySelectorAll('.good-button')[2] as HTMLButtonElement;
    expect(document.activeElement).toBe(lastButton);
  });

  it('selects good with Enter key', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const woodButton = container.querySelector('[data-good="wood"]') as HTMLButtonElement;
    woodButton.focus();
    woodButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onChange).toHaveBeenCalledWith('wood');
  });

  it('selects good with Space key', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const oreButton = container.querySelector('[data-good="ore"]') as HTMLButtonElement;
    oreButton.focus();
    oreButton.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

    expect(onChange).toHaveBeenCalledWith('ore');
  });

  it('has proper ARIA attributes', () => {
    const goods: ('fish' | 'wood' | 'ore')[] = ['fish', 'wood', 'ore'];
    destroy = mountGoodsPicker({ container, goods, onChange });

    const picker = container.querySelector('.goods-picker');
    expect(picker?.getAttribute('role')).toBe('radiogroup');
    expect(picker?.getAttribute('aria-label')).toBe('Select a good to trade');

    const buttons = container.querySelectorAll('.good-button');
    buttons.forEach((button, index) => {
      expect(button.getAttribute('role')).toBe('radio');
      expect(button.getAttribute('data-good')).toBeTruthy();
      expect(button.getAttribute('aria-checked')).toBe(index === 0 ? 'true' : 'false');
    });
  });
});
