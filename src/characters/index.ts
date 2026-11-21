import { BRUTE } from './brute';
import { GATEKEEPER } from './gatekeeper';
import { GUNNER } from './gunner';
import { HOLLOW } from './hollow';
import { STALKER } from './stalker';
import { WARDEN } from './warden';
import { FIEND } from './fiend';
import { HUSK } from './husk';
import { SHADE } from './shade';
import { SHOTGUNNER } from './shotgunner';
import type { MonsterDef, MonsterKind } from './types';

export { MARINE } from './marine';
export type { AttackStyle, Leap, LostBehavior, MarineDef, MonsterDef, MonsterKind, ShotSpec } from './types';

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  husk: HUSK,
  shotgunner: SHOTGUNNER,
  fiend: FIEND,
  brute: BRUTE,
  shade: SHADE,
  gunner: GUNNER,
  stalker: STALKER,
  warden: WARDEN,
  hollow: HOLLOW,
  gatekeeper: GATEKEEPER,
};
