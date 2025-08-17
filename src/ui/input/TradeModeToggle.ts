export type TradeMode = 'buy' | 'sell';

export function mountTradeModeToggle(
  container: HTMLElement,

  onChange: (mode: TradeMode) => void,
): { destroy(): void } {
  // Create the toggle container
  const toggle = document.createElement('div');
  toggle.className = 'trade-mode-toggle';
  toggle.setAttribute('role', 'radiogroup');
  toggle.setAttribute('aria-label', 'Select trade mode');

  // Create buy button
  const buyButton = document.createElement('button');
  buyButton.className = 'mode-button is-active';
  buyButton.setAttribute('data-mode', 'buy');
  buyButton.setAttribute('role', 'radio');
  buyButton.setAttribute('aria-checked', 'true');
  buyButton.textContent = 'Buy';

  // Create sell button
  const sellButton = document.createElement('button');
  sellButton.className = 'mode-button';
  sellButton.setAttribute('data-mode', 'sell');
  sellButton.setAttribute('role', 'radio');
  sellButton.setAttribute('aria-checked', 'false');
  sellButton.textContent = 'Sell';

  // Selection logic
  function selectMode(mode: TradeMode) {
    // Update button states
    buyButton.classList.toggle('is-active', mode === 'buy');
    buyButton.setAttribute('aria-checked', mode === 'buy' ? 'true' : 'false');

    sellButton.classList.toggle('is-active', mode === 'sell');
    sellButton.setAttribute('aria-checked', mode === 'sell' ? 'true' : 'false');

    onChange(mode);
  }

  // Click handlers
  buyButton.addEventListener('click', () => selectMode('buy'));
  sellButton.addEventListener('click', () => selectMode('sell'));

  // Keyboard handlers
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = event.target as HTMLButtonElement;
      const mode = target.getAttribute('data-mode') as TradeMode;
      selectMode(mode);
    }
  }

  // Add event listeners
  buyButton.addEventListener('keydown', handleKeydown);
  sellButton.addEventListener('keydown', handleKeydown);

  // Mount buttons
  toggle.appendChild(buyButton);
  toggle.appendChild(sellButton);
  container.appendChild(toggle);

  // Return destroy function
  return {
    destroy() {
      buyButton.removeEventListener('click', () => selectMode('buy'));
      sellButton.removeEventListener('click', () => selectMode('sell'));
      buyButton.removeEventListener('keydown', handleKeydown);
      sellButton.removeEventListener('keydown', handleKeydown);
      container.removeChild(toggle);
    },
  };
}
