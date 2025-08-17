import type { GameState } from '../../types/GameState';

import { ariaTownSummary } from './format';
import { getTownLayout } from './layout';
import { selectTownVM } from './selectors';

/**
 * Options for configuring the town renderer.
 */
export interface TownRendererOptions {
  /** The SVG element to render towns into */
  svg: SVGSVGElement;
  /** Function to get the current game state */
  getState: () => GameState;
}

/**
 * Represents a rendered town group with all its visual elements.
 */
interface RenderedTown {
  /** The main group element containing all town visuals */
  group: SVGGElement;
  /** The town node (circle) */
  node: SVGCircleElement;
  /** The town name text */
  name: SVGTextElement;
  /** Price pill groups for each good */
  pricePills: SVGGElement[];
  /** Price pill text elements */
  priceTexts: SVGTextElement[];
  /** Prosperity tier badge */
  prosperityBadge: SVGRectElement;
  /** Prosperity tier text */
  prosperityText: SVGTextElement;
  /** Military tier badge */
  militaryBadge: SVGRectElement;
  /** Military tier text */
  militaryText: SVGTextElement;
}

/**
 * Renders all towns on the SVG canvas.
 *
 * @param opts - Configuration options for the renderer
 * @returns Object with update and destroy methods
 */
export function renderTowns(opts: TownRendererOptions): { update(): void; destroy(): void } {
  const { svg, getState } = opts;
  const renderedTowns = new Map<string, RenderedTown>();

  /**
   * Creates the visual elements for a single town.
   */
  function createTownElements(townId: string, layout: { x: number; y: number }): RenderedTown {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-town-id', townId);
    group.setAttribute('role', 'group');
    group.setAttribute('tabindex', '0');
    group.classList.add('town-group');

    // Town node (circle)
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    node.setAttribute('cx', layout.x.toString());
    node.setAttribute('cy', layout.y.toString());
    node.setAttribute('r', '35');
    node.classList.add('town-node');

    // Town name
    const name = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    name.setAttribute('x', layout.x.toString());
    name.setAttribute('y', (layout.y + 55).toString());
    name.classList.add('town-name');

    // Price pills container
    const pricePills: SVGGElement[] = [];
    const priceTexts: SVGTextElement[] = [];

    // Create price pills for each good (fish, wood, ore)
    const pillPositions = [
      { x: layout.x - 60, y: layout.y - 20 }, // fish
      { x: layout.x, y: layout.y - 20 }, // wood
      { x: layout.x + 60, y: layout.y - 20 }, // ore
    ];

    pillPositions.forEach((pos, _index) => {
      const pillGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const pill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      pill.setAttribute('x', (pos.x - 25).toString());
      pill.setAttribute('y', (pos.y - 15).toString());
      pill.setAttribute('width', '50');
      pill.setAttribute('height', '30');
      pill.classList.add('price-pill');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x.toString());
      text.setAttribute('y', (pos.y + 5).toString());
      text.classList.add('price-pill-text');
      text.textContent = '₲0';

      pillGroup.appendChild(pill);
      pillGroup.appendChild(text);
      group.appendChild(pillGroup);

      pricePills.push(pillGroup);
      priceTexts.push(text);
    });

    // Tier badges
    const prosperityBadge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    prosperityBadge.setAttribute('x', (layout.x - 80).toString());
    prosperityBadge.setAttribute('y', (layout.y + 20).toString());
    prosperityBadge.setAttribute('width', '80');
    prosperityBadge.setAttribute('height', '20');
    prosperityBadge.classList.add('badge', 'badge-prosperity');

    const prosperityText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    prosperityText.setAttribute('x', (layout.x - 40).toString());
    prosperityText.setAttribute('y', (layout.y + 33).toString());
    prosperityText.classList.add('badge-text');
    prosperityText.textContent = 'Modest';

    const militaryBadge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    militaryBadge.setAttribute('x', layout.x.toString());
    militaryBadge.setAttribute('y', (layout.y + 20).toString());
    militaryBadge.setAttribute('width', '80');
    militaryBadge.setAttribute('height', '20');
    militaryBadge.classList.add('badge', 'badge-military');

    const militaryText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    militaryText.setAttribute('x', (layout.x + 40).toString());
    militaryText.setAttribute('y', (layout.y + 33).toString());
    militaryText.classList.add('badge-text');
    militaryText.textContent = 'Garrison';

    // Assemble the town group
    group.appendChild(node);
    group.appendChild(name);
    group.appendChild(prosperityBadge);
    group.appendChild(prosperityText);
    group.appendChild(militaryBadge);
    group.appendChild(militaryText);

    return {
      group,
      node,
      name,
      pricePills,
      priceTexts,
      prosperityBadge,
      prosperityText,
      militaryBadge,
      militaryText,
    };
  }

  /**
   * Updates the visual representation of a town based on current state.
   */
  function updateTown(townId: string, rendered: RenderedTown): void {
    try {
      const state = getState();
      const townVM = selectTownVM(state, townId);

      // Update town name
      rendered.name.textContent = townVM.name;

      // Update ARIA label
      const town = state.towns.find(t => t.id === townId);
      if (town) {
        const ariaLabel = ariaTownSummary(town);
        rendered.group.setAttribute('aria-label', ariaLabel);
      }

      // Update price pills
      townVM.prices.forEach((price, index) => {
        if (rendered.priceTexts[index]) {
          rendered.priceTexts[index].textContent = price.text;
        }
      });

      // Update tier badges
      rendered.prosperityText.textContent = townVM.prosperity.text;
      rendered.militaryText.textContent = townVM.military.text;
    } catch (error) {
      console.warn(`Failed to update town ${townId}:`, error);
    }
  }

  /**
   * Initial render - creates all town elements.
   */
  function initialRender(): void {
    const state = getState();

    state.towns.forEach(town => {
      const layout = getTownLayout(town.id);
      if (!layout) {
        console.warn(`No layout found for town ${town.id}`);
        return;
      }

      const rendered = createTownElements(town.id, layout);
      renderedTowns.set(town.id, rendered);
      svg.appendChild(rendered.group);

      // Initial update with current state
      updateTown(town.id, rendered);
    });
  }

  /**
   * Updates all rendered towns with current state.
   */
  function update(): void {
    renderedTowns.forEach((rendered, townId) => {
      updateTown(townId, rendered);
    });
  }

  /**
   * Cleans up all rendered towns and removes them from the SVG.
   */
  function destroy(): void {
    renderedTowns.forEach(rendered => {
      if (rendered.group.parentNode) {
        rendered.group.parentNode.removeChild(rendered.group);
      }
    });
    renderedTowns.clear();
  }

  // Perform initial render
  initialRender();

  return { update, destroy };
}
