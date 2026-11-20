import type { Level } from '../lib/types';
import { Chip } from './Chip';

const TONE = { beginner: 'mint', intermediate: 'accent', advanced: 'amber' } as const;

export function LevelChip({ level }: { level: Level }) {
  return <Chip tone={TONE[level]}>{level}</Chip>;
}
