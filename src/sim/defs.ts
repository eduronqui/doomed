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
  | 'grenades'
  | 'fuel'
  | 'cells'
  | 'launcher'
  | 'flamer'
  | 'arc'
  | 'rift'
  | 'redkey'
  | 'bluekey'
  | 'yellowkey';
export type DecoKind = 'lamp' | 'crate' | 'brazier' | 'gore' | 'body';

export type SoundId =
  | 'pistol'
  | 'shotgun'
  | 'rotary'
  | 'launcher'
  | 'flame'
  | 'arc'
  | 'rift'
  | 'knife'
  | 'backstab'
  | 'footstep'
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
  | 'empty';


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
  grenades: 'a box of grenades',
  fuel: 'a fuel canister',
  cells: 'an energy cell pack',
  launcher: 'the grenade launcher',
  flamer: 'the flamer',
  arc: 'the arc rifle',
  rift: 'the rift cannon',
  redkey: 'a red keycard',
  bluekey: 'a blue keycard',
  yellowkey: 'a yellow keycard',
};

export const SOLID_DECOS: ReadonlySet<DecoKind> = new Set<DecoKind>(['crate']);
export const DECO_POSTS: ReadonlyMap<DecoKind, number> = new Map<DecoKind, number>([
  ['lamp', 0.18],
  ['brazier', 0.22],
]);

export type DifficultyId = 'recruit' | 'veteran' | 'doomed';

export interface Ambush {
  key: KeyColor;
  groups: Record<DifficultyId, string>;
}

export interface Difficulty {
  id: DifficultyId;
  name: string;
  blurb: string;
  enemyDamage: number;
  ammo: number;
  startBullets: number;
  enemySpeed: number;
  enemyCooldown: number;
  enemySight: number;
  projectileSpeed: number;
  restInterval: number;
  restCap: number;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: 'recruit',
    name: 'Recruit',
    blurb: 'Half damage, double ammo, slow demons.',
    enemyDamage: 0.5,
    ammo: 2,
    startBullets: 60,
    enemySpeed: 0.9,
    enemyCooldown: 1.3,
    enemySight: 0.85,
    projectileSpeed: 0.85,
    restInterval: 1.5,
    restCap: 60,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    blurb: 'The outpost as intended.',
    enemyDamage: 1,
    ammo: 1,
    startBullets: 40,
    enemySpeed: 1,
    enemyCooldown: 1,
    enemySight: 1,
    projectileSpeed: 1,
    restInterval: 2,
    restCap: 30,
  },
  {
    id: 'doomed',
    name: 'Doomed',
    blurb: 'Harder hits, less ammo, faster and sharper demons, no resting.',
    enemyDamage: 1.5,
    ammo: 0.75,
    startBullets: 20,
    enemySpeed: 1.15,
    enemyCooldown: 0.75,
    enemySight: 1.25,
    projectileSpeed: 1.25,
    restInterval: 4,
    restCap: 0,
  },
];

export const DEFAULT_DIFFICULTY: Difficulty = DIFFICULTIES[1];
