# Trade UI Components

This directory contains UI components for the town economy game's trade interface.

## Components

### QuantityInput

A numeric quantity input component with +/- buttons and keyboard support.

**Features:**

- Clamps to integers ≥1
- +/- buttons for increment/decrement
- Keyboard support: arrow keys, home/end
- onChange callback when quantity changes
- ARIA labels for accessibility

**Usage:**

```typescript
import { mountQuantityInput } from './QuantityInput';

const quantityInput = mountQuantityInput(container, qty => {
  console.log('Quantity changed to:', qty);
});

// Get current quantity
const currentQty = quantityInput.get();

// Set quantity programmatically
quantityInput.set(5);

// Clean up
quantityInput.destroy();
```

**API:**

- `get(): number` - Returns current quantity
- `set(n: number): void` - Sets quantity (clamped to ≥1)
- `destroy(): void` - Removes component and cleans up

### TradePreview

A trade validation and preview component that shows total cost and validates trade feasibility.

**Features:**

- Computes total cost (quantity × unit price)
- Validates stock and treasury availability
- Shows success preview or error messages
- Updates automatically when dependencies change
- Supports buy/sell modes

**Usage:**

```typescript
import { mountTradePreview } from './TradePreview';
import { SelectionStore } from './SelectionStore';

const store = new SelectionStore();
const preview = mountTradePreview(container, store, {
  getState: () => gameState,
  getGood: () => selectedGood,
  getMode: () => tradeMode,
  getQty: () => quantity,
});

// Clean up
preview.destroy();
```

**Dependencies Interface:**

```typescript
interface PreviewDeps {
  getState: () => GameState;
  getGood: () => GoodId;
  getMode: () => TradeMode;
  getQty: () => number;
}
```

**Validation Rules:**

- **Buy Mode**: Player needs sufficient treasury, town needs sufficient stock
- **Sell Mode**: Player needs sufficient stock, town needs sufficient treasury
- Shows specific error messages for insufficient resources

**API:**

- `destroy(): void` - Removes component and cleans up
- `update(): void` - Force refresh (for testing)

## Styling

Components use CSS classes for styling:

- `.quantity-input` - Container for quantity input
- `.quantity-btn` - Plus/minus buttons
- `.quantity-display` - Quantity value display
- `.trade-preview` - Trade preview container
- `.preview-content` - Preview content area
- `.preview-success` - Success state styling
- `.preview-error` - Error state styling

## Testing

Both components have comprehensive test suites:

```bash
# Test QuantityInput
pnpm test src/ui/input/QuantityInput.spec.ts

# Test TradePreview
pnpm test src/ui/input/TradePreview.spec.ts
```

## Demo

See `demo.html` for a working example of both components integrated together.

## Integration Notes

- Components are designed to work with the existing `SelectionStore` for town selection
- Trade validation mirrors the logic in `TradeValidator` but is lightweight for UI purposes
- Components automatically clean up event listeners and DOM elements on destroy
- All components are keyboard accessible and follow ARIA best practices
