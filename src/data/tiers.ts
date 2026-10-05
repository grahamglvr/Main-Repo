import type { TierDef } from '../game/types';

// Ordered lowest to highest. Order matters: luck scales by position.
// Base rates from GAME_DESIGN.md section 5. Must add up to 100.
export const TIERS: TierDef[] = [
  {
    id: 'old',
    name: 'Old Tech',
    colour: '#C4925C',
    baseRate: 50,
    flash: null,
  },
  {
    id: 'basic',
    name: 'Basic Tech',
    colour: '#A9B8C2',
    baseRate: 25,
    flash: null,
  },
  {
    id: 'commercial',
    name: 'Commercial Tech',
    colour: '#19E3C8',
    baseRate: 13,
    flash: { opacity: 0.18, durationMs: 300 },
  },
  {
    id: 'industrial',
    name: 'Industrial Tech',
    colour: '#7C8CFF',
    baseRate: 7,
    flash: { opacity: 0.3, durationMs: 450 },
  },
  {
    id: 'military',
    name: 'Military Tech',
    colour: '#FF4F8B',
    baseRate: 3.5,
    flash: { opacity: 0.45, durationMs: 650 },
  },
  {
    id: 'ai',
    name: 'AI Tech',
    colour: '#F2B705',
    baseRate: 1.2,
    flash: { opacity: 0.6, durationMs: 900 },
  },
  {
    id: 'celestial',
    name: 'Celestial Tech',
    colour: '#E8F7FF',
    baseRate: 0.3,
    flash: { opacity: 0.85, durationMs: 1600 },
    shimmer: true,
  },
];
