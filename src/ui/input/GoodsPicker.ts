export type GoodId = 'fish' | 'wood' | 'ore';

export interface GoodsPickerOptions {
  container: HTMLElement;
  goods: GoodId[];

  onChange: (good: GoodId) => void;
}

export function mountGoodsPicker(opts: GoodsPickerOptions): { destroy(): void } {
  const { container, goods, onChange } = opts;

  // State
  let focusedIndex = 0;

  // Create the goods picker element
  const picker = document.createElement('div');
  picker.className = 'goods-picker';
  picker.setAttribute('role', 'radiogroup');
  picker.setAttribute('aria-label', 'Select a good to trade');

  // Create good buttons
  const buttons: HTMLButtonElement[] = [];

  goods.forEach((good, index) => {
    const button = document.createElement('button');
    button.className = 'good-button';
    button.setAttribute('data-good', good);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', index === 0 ? 'true' : 'false');
    button.textContent = good.charAt(0).toUpperCase() + good.slice(1);

    if (index === 0) {
      button.classList.add('is-active');
    }

    button.addEventListener('click', () => {
      selectGood(good, index);
    });

    buttons.push(button);
    picker.appendChild(button);
  });

  // Selection logic
  function selectGood(good: GoodId, index: number) {
    focusedIndex = index;

    // Update button states
    buttons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === index);
      btn.setAttribute('aria-checked', i === index ? 'true' : 'false');
    });

    onChange(good);
  }

  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft': {
        event.preventDefault();
        const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : buttons.length - 1;
        focusedIndex = prevIndex;
        buttons[prevIndex]!.focus();
        break;
      }

      case 'ArrowRight': {
        event.preventDefault();
        const nextIndex = focusedIndex < buttons.length - 1 ? focusedIndex + 1 : 0;
        focusedIndex = nextIndex;
        buttons[nextIndex]!.focus();
        break;
      }

      case 'Enter':
      case ' ':
        event.preventDefault();
        selectGood(goods[focusedIndex]!, focusedIndex);
        break;
    }
  }

  // Event listeners
  picker.addEventListener('keydown', handleKeydown);

  // Add focus listeners to each button
  const focusHandlers: (() => void)[] = [];
  buttons.forEach((button, index) => {
    const focusHandler = () => {
      focusedIndex = index;
    };
    focusHandlers.push(focusHandler);
    button.addEventListener('focus', focusHandler);

    // Also handle keyboard events on individual buttons
    button.addEventListener('keydown', handleKeydown);
  });

  // Set initial focus to first button
  buttons[0]!.focus();

  // Mount to container
  container.appendChild(picker);

  // Return destroy function
  return {
    destroy() {
      picker.removeEventListener('keydown', handleKeydown);

      // Remove focus listeners from buttons
      buttons.forEach((button, index) => {
        button.removeEventListener('focus', focusHandlers[index]!);
        button.removeEventListener('keydown', handleKeydown);
      });

      container.removeChild(picker);
    },
  };
}
