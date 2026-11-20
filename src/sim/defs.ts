export type WeaponId = 'knife' | 'pistol' | 'shotgun' | 'rotary';
export type AmmoType = 'bullets' | 'shells';
export type KeyColor = 'red' | 'blue' | 'yellow';
export type ItemKind =
  | 'stimpack'
  | 'medkit'
  | 'armor'
  | 'sphere'
  | 'clip'
  | 'shells'
  | 'shotgun'
  | 'rotary'
  | 'redkey'
  | 'bluekey'
  | 'yellowkey';
export type DecoKind = 'lamp' | 'crate' | 'brazier' | 'gore' | 'body';

export type SoundId =
  | 'pistol'
  | 'shotgun'
  | 'rotary'
  | 'knife'
  | 'fireball'
  | 'explode'
  | 'door'
  | 'switch'
  | 'pickup'
  | 'weapon'
  | 'powerup'
  | 'alertHusk'
  | 'alertFiend'
  | 'alertBrute'
  | 'monsterPain'
  | 'monsterDeath'
  | 'playerPain'
  | 'playerDeath'
  | 'noway'
  | 'secret'
  | 'claw'
  | 'huskShot'
  | 'empty';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  slot: number;
  ammo: AmmoType | null;
  cooldown: number;
  pellets: number;
  spread: number;
  damage: [number, number];
  range: number;
  sound: SoundId;
  noise: boolean;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  knife: {
    id: 'knife',
    name: 'Combat Knife',
    slot: 1,
    ammo: null,
    cooldown: 0.4,
    pellets: 1,
    spread: 0,
    damage: [6, 20],
    range: 1.25,
    sound: 'knife',
    noise: false,
  },
  pistol: {
    id: 'pistol',
    name: 'Sidearm',
    slot: 2,
    ammo: 'bullets',
    cooldown: 0.38,
    pellets: 1,
    spread: 0.035,
    damage: [5, 15],
    range: 22,
    sound: 'pistol',
    noise: true,
  },
  shotgun: {
    id: 'shotgun',
    name: 'Pump Shotgun',
    slot: 3,
    ammo: 'shells',
    cooldown: 0.95,
    pellets: 7,
    spread: 0.11,
    damage: [5, 15],
    range: 18,
    sound: 'shotgun',
    noise: true,
  },
  rotary: {
    id: 'rotary',
    name: 'Rotary Gun',
    slot: 4,
    ammo: 'bullets',
    cooldown: 0.11,
    pellets: 1,
    spread: 0.06,
    damage: [5, 15],
    range: 22,
    sound: 'rotary',
    noise: true,
  },
};

export const WEAPON_ORDER: WeaponId[] = ['knife', 'pistol', 'shotgun', 'rotary'];

export const MAX_AMMO: Record<AmmoType, number> = { bullets: 200, shells: 50 };

export const KEY_ITEMS: Record<KeyColor, ItemKind> = { red: 'redkey', blue: 'bluekey', yellow: 'yellowkey' };

export const ITEM_NAMES: Record<ItemKind, string> = {
  stimpack: 'a stimpack',
  medkit: 'a medikit',
  armor: 'a combat vest',
  sphere: 'a vital sphere',
  clip: 'a clip of bullets',
  shells: 'a box of shells',
  shotgun: 'the pump shotgun',
  rotary: 'the rotary gun',
  redkey: 'a red keycard',
  bluekey: 'a blue keycard',
  yellowkey: 'a yellow keycard',
};

export const SOLID_DECOS: ReadonlySet<DecoKind> = new Set<DecoKind>(['lamp', 'crate', 'brazier']);

export type DifficultyId = 'recruit' | 'veteran' | 'doomed';

export interface Difficulty {
  id: DifficultyId;
  name: string;
  blurb: string;
  enemyDamage: number;
  ammo: number;
  enemySpeed: number;
  enemyCooldown: number;
  enemySight: number;
  projectileSpeed: number;
  restInterval: number;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: 'recruit',
    name: 'Recruit',
    blurb: 'Half damage, double ammo, slow demons.',
    enemyDamage: 0.5,
    ammo: 2,
    enemySpeed: 0.9,
    enemyCooldown: 1.3,
    enemySight: 0.85,
    projectileSpeed: 0.85,
    restInterval: 1.5,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    blurb: 'The outpost as intended.',
    enemyDamage: 1,
    ammo: 1,
    enemySpeed: 1,
    enemyCooldown: 1,
    enemySight: 1,
    projectileSpeed: 1,
    restInterval: 2,
  },
  {
    id: 'doomed',
    name: 'Doomed',
    blurb: 'Harder hits, faster and sharper demons, slow rest.',
    enemyDamage: 1.5,
    ammo: 1,
    enemySpeed: 1.15,
    enemyCooldown: 0.75,
    enemySight: 1.25,
    projectileSpeed: 1.25,
    restInterval: 4,
  },
];

export const DEFAULT_DIFFICULTY: Difficulty = DIFFICULTIES[1];
