import type { TierId } from '../game/types';

// Nobody's thought bubbles. A list means one is picked at random.
export const LINES = {
  firstFight: 'A rat. My ancient nemesis. Hit it with the pipe. That\'s the whole tutorial.',
  firstSalvage: 'Scrap goes in, mystery junk comes out. Basically the economy.',
  firstUpgrade: 'Workbench upgrade takes time. Real time. Welcome to mobile games.',

  rare: {
    basic: [
      'Basic Tech! It has a battery. I\'m practically a corporation now.',
      'Grey and shiny. My standards are on the floor and I love it.',
    ],
    commercial: [
      'Aqua! Commercial grade! Somebody paid full price for this once.',
      'Branded hardware. I can feel my credit score rising.',
    ],
    industrial: [
      'Purple! Industrial! This was built to lift cars. I lift rats.',
    ],
    military: [
      'Pink! Military grade! I\'d like to thank the Workbench, my Scrap, and the 400 rats who made this possible.',
    ],
    ai: [
      'Gold. It\'s thinking. I don\'t love that it\'s thinking.',
    ],
    celestial: [
      'Okay. That\'s not from here. That\'s not from anywhere. I\'m going to need a minute. Also, please screenshot this.',
    ],
  } satisfies Partial<Record<TierId, string[]>>,

  bossDeath: [
    'Back to wave one. I meant to do that. Farming. It\'s called farming.',
    'That boss needs a nerf. Or I need better gear. Probably the gear.',
  ],
  houndDeath: 'In my defence, it had a laser eye. I had a pipe.',
  death: [
    'Down again. The rats are writing songs about me.',
    'Respawning. One of the perks of not existing.',
  ],
  bossTimeout: [
    'Out of time. It keeps its dignity. For now.',
    'Thirty seconds isn\'t enough. Nobody does their best work in thirty seconds.',
  ],
  zoneCleared: [
    'Zone cleared. Onwards, to slightly worse alleys.',
    'Boss down. Grab the crate. Never ask where crates come from.',
  ],
  stageCleared:
    'That\'s the Scrapper stage done. The rest of the game is still being built. Honestly. Ask the dev.',
  levelUp: [
    'Level up! I can feel numbers going up. That\'s not normal, is it?',
    'Stronger. Not wiser. Just stronger.',
  ],
  workbenchUpgraded: [
    'Workbench upgraded. New level, new disappointments.',
    'The Workbench is better now. Still smells of solder and regret.',
  ],
  newWeapon: [
    'New weapon. The rats have been warned.',
    'Oh, this is much better than hitting things with my feelings.',
  ],
  idle: [
    'The Spires remind you: air is a privilege, not a right. Upgrade to Breathe+ today.',
    'Fun fact: this alley used to be a park. Now it\'s a rat buffet.',
    'Somewhere up in the Spires, someone is having a lovely brunch.',
    'I\'ve hit a lot of rats today. Not sure that\'s a personality.',
    'If you\'re reading this, you\'re not tapping the Workbench.',
  ],
};

// Tabs that unlock in later builds.
export const LOCKED_TABS = {
  skills: 'Skills unlock in a later build. For now, hitting things IS the skill.',
  crew: "No Crew yet. Nobody's friends are also nobodies.",
  collection: "Collection log coming soon. Don't worry, I'm keeping receipts.",
};

export const WORKBENCH_LINES = {
  needScrap: 'Need more Scrap. Go hit something.',
  cardOpen: 'Deal with the card first.',
};
