import { ALL_LEVELS } from '../../levels';
import { ITEM_NAMES, type ItemKind } from '../../sim/defs';
import { WEAPON_ORDER } from '../../weapons';
import { WEAPON_ART } from '../../weapons/art';
import { Grid } from '../../sim/grid';
import type { FloorKind } from '../../sim/level';
import type { Pix } from '../pixel';
import { packSheet, type Sheet } from '../sheet';
import { CHARACTERS, CHARACTER_ART, DIRS, FRAMES } from '../../characters/art';
import { FLOOR_VARIANTS, WALL_VARIANTS, key } from '../atlas';
import { barrelTexture, bloodFx, decoTexture, explosion, fireball, flameFx, wisp, grenadeShot, itemTexture, muzzle, puff, riftBlast, riftOrb, scorch } from './items';
import { RAISED_FLOORS, STAIR_DIRS, STAIR_FLOORS, ledgeRimTexture, ledgeSideTexture, raisedFaceTexture, raisedTopTexture, stairsTexture } from './raised';
import { doorPiece, exitTexture, floorTexture, hiddenPiece, wallTexture } from './tiles';

function addDoorPieces(art: Map<string, Pix>): void {
  for (const info of ALL_LEVELS) {
    const grid = new Grid(info.load());
    for (const group of grid.doorGroups) {
      const lead = group[0];
      const wall = grid.tiles[lead.index].wall;
      const cw = Math.max(...group.map((d) => d.x)) - Math.min(...group.map((d) => d.x)) + 1;
      const ch = Math.max(...group.map((d) => d.y)) - Math.min(...group.map((d) => d.y)) + 1;
      const name = key.doorPiece(lead.kind, wall, cw, ch);
      if (art.has(name)) continue;
      art.set(name, lead.kind === 'secret' || lead.kind === 'trap' ? hiddenPiece(lead.kind, wall, cw, ch) : doorPiece(lead.kind, cw, ch));
    }
  }
}

export function buildArt(): Map<string, Pix> {
  const art = new Map<string, Pix>();
  const floors: FloorKind[] = ['metal', 'concrete', 'grate', 'rock', 'slime', 'lava'];
  for (const f of floors) for (let v = 0; v < FLOOR_VARIANTS; v++) art.set(key.floor(f, v), floorTexture(f, v));
  for (const w of ['tech', 'stone'] as const) for (let v = 0; v < WALL_VARIANTS[w]; v++) art.set(key.wall(w, v), wallTexture(w, v));
  for (const f of STAIR_FLOORS) for (const d of STAIR_DIRS) art.set(key.stairs(f, d), stairsTexture(f, d));
  for (const f of RAISED_FLOORS) {
    for (let v = 0; v < FLOOR_VARIANTS; v++) {
      art.set(key.raisedTop(f, v), raisedTopTexture(f, v));
      art.set(key.raisedFace(f, v), raisedFaceTexture(f, v));
    }
  }
  art.set(key.ledgeRim(false), ledgeRimTexture(false));
  art.set(key.ledgeRim(true), ledgeRimTexture(true));
  art.set(key.ledgeSide(), ledgeSideTexture());
  addDoorPieces(art);
  for (const wall of ['tech', 'stone'] as const) {
    art.set(key.exit(wall, false), exitTexture(wall, false));
    art.set(key.exit(wall, true), exitTexture(wall, true));
  }
  for (const c of CHARACTERS) {
    const look = CHARACTER_ART[c];
    if (c === 'marine') {
      for (const w of WEAPON_ORDER) for (const d of DIRS) for (const f of FRAMES) art.set(key.marine(w, d, f), look.frame(d, f, w));
    } else for (const d of DIRS) for (const f of FRAMES) art.set(key.actor(c, d, f), look.frame(d, f));
    art.set(key.corpse(c), look.corpse());
  }
  for (const i of Object.keys(ITEM_NAMES) as ItemKind[]) art.set(key.item(i), itemTexture(i));
  for (const d of ['lamp', 'crate', 'gore', 'body'] as const) art.set(key.deco(d, 0), decoTexture(d, 0));
  for (let f = 0; f < 3; f++) {
    art.set(key.deco('brazier', f), decoTexture('brazier', f));
    art.set(key.barrel(f), barrelTexture(f));
    art.set(key.fx('puff', f), puff(f));
    art.set(key.fx('blood', f), bloodFx(f));
  }
  for (let f = 0; f < 2; f++) {
    art.set(key.fx('fireball', f), fireball(f));
    art.set(key.fx('grenade', f), grenadeShot(f));
    art.set(key.fx('orb', f), riftOrb(f));
    art.set(key.fx('wisp', f), wisp(f));
  }
  for (let f = 0; f < 3; f++) art.set(key.fx('flame', f), flameFx(f));
  for (let f = 0; f < 4; f++) {
    art.set(key.fx('explosion', f), explosion(f));
    art.set(key.fx('burst', f), explosion(f, 24));
    art.set(key.fx('riftblast', f), riftBlast(f));
  }
  art.set(key.fx('scorch', 0), scorch());
  art.set(key.fx('muzzle', 0), muzzle());
  for (const w of WEAPON_ORDER) art.set(key.weaponIcon(w), WEAPON_ART[w].icon());
  return art;
}

export function buildSheet(): Sheet {
  return packSheet(buildArt(), 'sprites.png');
}
