import { BRUTE } from './brute';
import { FIEND } from './fiend';
import { HUSK } from './husk';
import { SHADE } from './shade';
import type { MonsterDef, MonsterKind } from './types';

export { MARINE } from './marine';
export type { AttackStyle, LostBehavior, MarineDef, MonsterDef, MonsterKind } from './types';

export const MONSTERS: Record<MonsterKind, MonsterDef> = { husk: HUSK, fiend: FIEND, brute: BRUTE, shade: SHADE };
