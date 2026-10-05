import type { ZoneDef } from '../game/types';

// Scrapper stage. enemies = enemy id → spawn weight. boss = id from BOSSES.
// Mixes are chosen so the average enemy's health rises steadily from zone to zone.
export const ZONES: ZoneDef[] = [
  { id: 1, name: 'Gutter Lane', enemies: { rat: 1 }, boss: 'rat-king' },
  { id: 2, name: 'Drainpipe Row', enemies: { rat: 3, dog: 1 }, boss: 'pack-leader' },
  { id: 3, name: 'Bin Alley', enemies: { rat: 2, dog: 2 }, boss: 'rat-king' },
  { id: 4, name: 'The Soggy Market', enemies: { rat: 2, dog: 2, scrapper: 1 }, boss: 'scrap-baron' },
  { id: 5, name: 'Rust Corner', enemies: { rat: 1, dog: 2, scrapper: 1 }, boss: 'scrapyard-hound' },
  { id: 6, name: 'Shack Town', enemies: { rat: 1, dog: 2, scrapper: 2 }, boss: 'pack-leader' },
  { id: 7, name: 'Dead Arcade', enemies: { rat: 1, dog: 1, scrapper: 2, servicebot: 1 }, boss: 'haywire-bot' },
  { id: 8, name: 'Cable Graveyard', enemies: { rat: 1, dog: 2, scrapper: 2, servicebot: 2 }, boss: 'scrap-baron' },
  { id: 9, name: 'Dump Ridge', enemies: { dog: 2, scrapper: 2, servicebot: 2 }, boss: 'scrapyard-hound' },
  { id: 10, name: 'The Spillway', enemies: { dog: 1, scrapper: 2, servicebot: 3 }, boss: 'cleanup-truck' },
];
