export function mountQuantityInput(
  container: HTMLElement,
  onChange: (qty: number) => void,
): { get(): number; set(qty: number): void; destroy(): void } {
  // State
  let currentQuantity = 1;

  // Create the quantity input container
  const wrapper = document.createElement('div');
  wrapper.className = 'quantity-input';

  // Call onChange with initial value
  onChange(currentQuantity);

  // Create minus button
  const minusButton = document.createElement('button');
  minusButton.className = 'quantity-btn minus-btn';
  minusButton.textContent = '-';
  minusButton.setAttribute('aria-label', 'Decrease quantity');

  // Create quantity display
  const quantityDisplay = document.createElement('span');
  quantityDisplay.className = 'quantity-display';
  quantityDisplay.textContent = '1';

  // Create plus button
  const plusButton = document.createElement('button');
  plusButton.className = 'quantity-btn plus-btn';
  plusButton.textContent = '+';
  plusButton.setAttribute('aria-label', 'Increase quantity');

  // Helper function to update quantity
  function updateQuantity(newQty: number) {
    // Clamp to integers ≥1
    const clampedQty = Math.max(1, Math.floor(newQty));

    if (clampedQty !== currentQuantity) {
      currentQuantity = clampedQty;
      quantityDisplay.textContent = clampedQty.toString();
      onChange(clampedQty);
    }
  }

  // Button click handlers
  minusButton.addEventListener('click', () => {
    updateQuantity(currentQuantity - 1);
    minusButton.focus();
  });

  plusButton.addEventListener('click', () => {
    updateQuantity(currentQuantity + 1);
    plusButton.focus();
  });

  // Keyboard handlers for the wrapper
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        updateQuantity(currentQuantity + 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        updateQuantity(currentQuantity - 1);
        break;
      case 'Home':
        event.preventDefault();
        updateQuantity(1);
        break;
      case 'End':
        event.preventDefault();
        updateQuantity(999); // Reasonable upper limit
        break;
    }
  }

  wrapper.addEventListener('keydown', handleKeydown);

  // Assemble the component
  wrapper.appendChild(minusButton);
  wrapper.appendChild(quantityDisplay);
  wrapper.appendChild(plusButton);
  container.appendChild(wrapper);

  // Return the public API
  return {
    get() {
      return currentQuantity;
    },
    set(qty: number) {
      updateQuantity(qty);
    },
    destroy() {
      minusButton.removeEventListener('click', () => updateQuantity(currentQuantity - 1));
      plusButton.removeEventListener('click', () => updateQuantity(currentQuantity + 1));
      wrapper.removeEventListener('keydown', handleKeydown);
      container.removeChild(wrapper);
    },
  };
}
