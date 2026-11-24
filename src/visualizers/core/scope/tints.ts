export type RoomTint = 'global' | 'mint' | 'violet' | 'pink' | 'amber';

/** The usual room tints by depth: Global, then function rooms, then deeper ones. */
export const tintForDepth = (depth: number): RoomTint =>
  (['global', 'mint', 'violet', 'pink'] as const)[Math.min(depth, 3)];
