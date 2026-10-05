import type { EnemyDef } from '../game/types';

// Zone 1 values. Health, damage and rewards scale per zone (see BATTLE in config.ts).
// art = sprite key in src/battle/art/sprites.ts.
export const ENEMIES: EnemyDef[] = [
  { id: 'rat', name: 'Sewer Rat', art: 'rat',
    health: 22, damage: 3, attackSpeed: 0.9, speed: 75, width: 32, scrap: 1, tokens: 1, xp: 2 },
  { id: 'dog', name: 'Feral Dog', art: 'dog',
    health: 36, damage: 5, attackSpeed: 0.9, speed: 95, width: 40, scrap: 2, tokens: 1, xp: 3 },
  { id: 'scrapper', name: 'Rival Scrapper', art: 'scrapper',
    health: 55, damage: 7, attackSpeed: 0.7, speed: 55, width: 26, scrap: 3, tokens: 3, xp: 5 },
  { id: 'servicebot', name: 'Broken Service Bot', art: 'servicebot',
    health: 75, damage: 6, attackSpeed: 0.6, speed: 45, width: 28, scrap: 4, tokens: 2, xp: 6 },
];

// Bosses: roughly 8× a normal enemy's health. Base stats are kept close together so that
// difficulty rises smoothly with zone scaling, even when a boss appears in more than one zone.
// Each has a line for when it shows up.
export const BOSSES: (EnemyDef & { intro: string })[] = [
  { id: 'rat-king', name: 'The Rat King', art: 'ratking',
    health: 280, damage: 8, attackSpeed: 0.8, speed: 50, width: 60, scrap: 10, tokens: 10, xp: 20,
    intro: 'The Rat King. Of course rats have a monarchy. Everyone has a monarchy except me.' },
  { id: 'pack-leader', name: 'Pack Leader', art: 'packleader',
    health: 300, damage: 9, attackSpeed: 0.9, speed: 80, width: 64, scrap: 12, tokens: 12, xp: 24,
    intro: "That's not a dog. That's a dog's bigger, angrier manager." },
  { id: 'scrap-baron', name: 'Scrap Baron', art: 'scrapbaron',
    health: 320, damage: 10, attackSpeed: 0.7, speed: 45, width: 40, scrap: 15, tokens: 18, xp: 30,
    intro: 'The Scrap Baron. Owns this alley. And that one. And my debts.' },
  { id: 'haywire-bot', name: 'Haywire Unit 9', art: 'haywirebot',
    health: 330, damage: 10, attackSpeed: 0.8, speed: 40, width: 46, scrap: 18, tokens: 16, xp: 32,
    intro: '"HAVE A NICE DAY," it says, while trying to murder me.' },
  { id: 'scrapyard-hound', name: 'Scrapyard Hound', art: 'hound',
    health: 340, damage: 10, attackSpeed: 0.85, speed: 85, width: 72, scrap: 20, tokens: 20, xp: 38,
    intro: 'A robot dog with a laser eye. Who approved this? Who signs off on this?' },
  { id: 'cleanup-truck', name: 'Spire Clean-up Truck', art: 'truck',
    health: 380, damage: 12, attackSpeed: 0.5, speed: 35, width: 96, scrap: 30, tokens: 30, xp: 50,
    intro: '"Keeping the Groves tidy!" says the truck that dumps everything here.' },
];
