/**
 * Represents the military strength tier of a town.
 * Ordered from weakest to strongest: militia < garrison < formidable < host
 */
export type MilitaryTier = 'militia' | 'garrison' | 'formidable' | 'host';

/**
 * Represents the prosperity tier of a town.
 * Ordered from poorest to richest: struggling < modest < prosperous < opulent
 */
export type ProsperityTier = 'struggling' | 'modest' | 'prosperous' | 'opulent';
