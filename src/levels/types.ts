import type { Track } from '../render/tracks';
import type { MonsterKind } from '../characters';
import type { LevelData } from '../sim/level';
import type { Carry } from '../sim/world';

export interface LevelInfo {
  id: number;
  title: string;
  briefing: string;
  darkness: number;
  par: number;
  startMessage: string;
  music: Track;
  load: () => LevelData;
  training?: boolean;
  startCarry?: Carry;
  tips?: Tip[];
  alertOnEntry?: MonsterKind[];
}

export interface Tip {
  area: [number, number, number, number];
  text: string;
  clearText?: string;
}
