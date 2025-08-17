/**
 * Defines the layout positions for towns in the SVG canvas.
 * Uses a 1000x1000 viewBox coordinate system for simplicity and scalability.
 */

export interface TownLayout {
  /** X coordinate in the SVG viewBox (0-1000) */
  x: number;
  /** Y coordinate in the SVG viewBox (0-1000) */
  y: number;
}

/**
 * Hardcoded layout positions for the three towns.
 * - Player town: center (500, 580)
 * - AI town 1: top-left (250, 250)
 * - AI town 2: bottom-right (750, 750)
 */
const TOWN_LAYOUTS: Record<string, TownLayout> = {
  riverdale: { x: 500, y: 580 }, // Player town - center
  forestburg: { x: 250, y: 250 }, // AI town 1 - top-left
  ironforge: { x: 750, y: 750 }, // AI town 2 - bottom-right
};

/**
 * Gets the layout position for a town by ID.
 *
 * @param townId - The unique identifier for the town
 * @returns The TownLayout with x,y coordinates, or undefined if not found
 */
export function getTownLayout(townId: string): TownLayout | undefined {
  return TOWN_LAYOUTS[townId];
}

/**
 * Gets all available town layout positions.
 *
 * @returns Record mapping town IDs to their layout positions
 */
export function getAllTownLayouts(): Record<string, TownLayout> {
  return { ...TOWN_LAYOUTS };
}
