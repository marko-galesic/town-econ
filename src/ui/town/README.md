# Town Renderer System

A clean, testable SVG renderer for displaying towns on a canvas with price information, tier badges, and accessibility features.

## Overview

The town renderer system provides a pure, functional approach to rendering towns on an SVG canvas. It takes a game state and SVG element as input, creates visual representations of towns, and provides efficient update mechanisms without recreating DOM elements.

## Architecture

### Core Components

1. **`layout.ts`** - Defines fixed positioning for towns
2. **`renderer.ts`** - Main rendering logic and state management
3. **`town.css`** - Styling for all town visual elements
4. **`renderer.spec.ts`** - Comprehensive test suite

### Key Principles

- **Pure-ish renderer**: Takes `(svg, state)` and draws towns
- **Fixed layout**: Hardcoded positions for MVP (3 towns)
- **Efficient updates**: Patches existing nodes without recreation
- **Accessibility first**: ARIA attributes, focusable groups, semantic structure

## Usage

### Basic Setup

```typescript
import { renderTowns } from './ui/town/renderer';

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('viewBox', '0 0 1000 1000');

const townRenderer = renderTowns({
  svg,
  getState: () => currentGameState,
});

// Later, update the display
townRenderer.update();

// Cleanup when done
townRenderer.destroy();
```

### Integration with Main App

The renderer is integrated into `src/main.ts` and automatically renders the three towns:

- **Riverdale** (Player town) - Center position (500, 580)
- **Forestburg** (AI town 1) - Top-left (250, 250)
- **Ironforge** (AI town 2) - Bottom-right (750, 750)

## Visual Elements

### Town Node

- Circular representation with hover effects
- Positioned according to layout configuration
- Accessible with ARIA labels

### Price Capsules

- Three rounded rectangles showing ₲ prices
- Positioned above each town (fish, wood, ore)
- Updates dynamically with state changes

### Tier Badges

- Prosperity badge (green) - left side
- Military badge (red) - right side
- Small pill-shaped indicators with text labels

### Town Name

- Centered below the town node
- Bold, readable typography
- Updates with state changes

## Styling

### CSS Classes

- `.town-node` - Main town circle
- `.town-name` - Town name text
- `.price-pill` - Price capsule rectangles
- `.price-pill-text` - Price text within capsules
- `.badge` - Base badge styling
- `.badge-prosperity` - Prosperity tier badge
- `.badge-military` - Military tier badge
- `.badge-text` - Text within badges
- `.town-group` - Container for all town elements

### Theme Support

The CSS uses semantic class names and supports:

- Light/dark theme detection via `prefers-color-scheme`
- High contrast for accessibility
- Hover and focus states
- Smooth transitions

## State Management

### Update Pattern

```typescript
// The renderer maintains internal state
const renderer = renderTowns({ svg, getState });

// Updates are triggered by calling update()
renderer.update();

// The renderer reads fresh state via getState()
function getState() {
  return currentGameState; // Fresh state each time
}
```

### Efficient Updates

- **No DOM recreation**: Existing elements are updated in place
- **Text patching**: Only text content changes, not structure
- **State validation**: Graceful handling of invalid states
- **Error boundaries**: Console warnings for debugging

## Accessibility Features

### ARIA Support

- `role="group"` for town containers
- `tabindex="0"` for keyboard navigation
- `aria-label` with comprehensive town summaries
- Semantic structure for screen readers

### Keyboard Navigation

- Focusable town groups
- Tab order follows town layout
- Visual focus indicators

### Screen Reader Support

- Descriptive ARIA labels include:
  - Town name
  - Prosperity tier
  - Military tier
- Logical reading order
- Meaningful text alternatives

## Testing

### Test Coverage

The renderer includes comprehensive tests covering:

- **Initial Rendering**: Element creation and positioning
- **Update Functionality**: State change handling
- **Destroy Functionality**: Cleanup and memory management
- **Error Handling**: Graceful failure modes
- **Layout Positioning**: Coordinate accuracy
- **Accessibility**: ARIA attributes and structure

### Running Tests

```bash
# Run all tests
pnpm test

# Run just the renderer tests
pnpm test src/ui/town/renderer.spec.ts
```

### Test Environment

- Uses jsdom for DOM simulation
- Vitest for test runner
- Comprehensive mocking of game state
- DOM node identity preservation verification

## Performance Considerations

### Rendering Efficiency

- **Single pass creation**: All elements created in initial render
- **Minimal DOM queries**: Cached references to rendered elements
- **Batch updates**: Single update() call handles all towns
- **Memory management**: Proper cleanup on destroy

### Scalability

- **Fixed layout**: Current implementation supports exactly 3 towns
- **Coordinate system**: 1000x1000 viewBox for crisp scaling
- **CSS-based styling**: Efficient styling without JavaScript calculations

## Future Enhancements

### Potential Improvements

1. **Dynamic Layout**: Support for variable numbers of towns
2. **Animation**: Smooth transitions for state changes
3. **Interactive Elements**: Click handlers for town selection
4. **Responsive Design**: Adaptive positioning for different screen sizes
5. **Custom Themes**: User-configurable color schemes

### Extension Points

- **Layout System**: Modular positioning algorithms
- **Visual Elements**: Pluggable town representations
- **State Binding**: Custom update triggers
- **Event Handling**: Integration with game interaction systems

## Troubleshooting

### Common Issues

1. **Towns not rendering**: Check that `getState()` returns valid GameState
2. **Layout misalignment**: Verify viewBox is set to "0 0 1000 1000"
3. **Styling issues**: Ensure `town.css` is imported
4. **Update not working**: Verify `update()` is called after state changes

### Debug Mode

Enable console logging by setting:

```typescript
// In renderer.ts, uncomment console.log statements
console.log('Rendering town:', townId, layout);
```

## API Reference

### `renderTowns(options: TownRendererOptions)`

Creates and returns a town renderer instance.

**Parameters:**

- `options.svg`: SVGSVGElement to render into
- `options.getState`: Function returning current GameState

**Returns:**

- `update()`: Updates all towns with current state
- `destroy()`: Removes all rendered towns and cleans up

### `getTownLayout(townId: string): TownLayout | undefined`

Returns the layout position for a given town ID.

**Parameters:**

- `townId`: String identifier for the town

**Returns:**

- `TownLayout` object with x, y coordinates, or undefined if not found
