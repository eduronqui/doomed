import type Phaser from 'phaser';
import type { DecoKind, ItemKind } from '../sim/defs';
import type { WeaponId } from '../weapons';
import type { DoorKind, FloorKind } from '../sim/level';
import type { CharacterKind } from '../characters/art';

export const ATLAS = 'sprites';
export const ATLAS_IMAGE = 'assets/sprites.png';
export const ATLAS_DATA = 'assets/sprites.json';

export const FLOOR_VARIANTS = 3;
export const WALL_VARIANTS: Record<'tech' | 'stone', number> = { tech: 4, stone: 3 };

export const key = {
  floor: (k: FloorKind, v: number): string => `floor_${k}_${v}`,
  wall: (k: 'tech' | 'stone', v: number): string => `wall_${k}_${v}`,
  stairs: (floor: string, up: string): string => `stairs_${floor}_${up}`,
  raisedTop: (floor: string, v: number): string => `raised_top_${floor}_${v}`,
  raisedFace: (floor: string, v: number): string => `raised_face_${floor}_${v}`,
  ledgeRim: (vertical: boolean): string => `ledge_rim_${vertical ? 'v' : 'h'}`,
  ledgeSide: (): string => 'ledge_side',
  doorPiece: (k: DoorKind, wall: 'tech' | 'stone', cellsW: number, cellsH: number): string =>
    k === 'secret' || k === 'trap' ? `doorpiece_${k}_${wall}_${cellsW}x${cellsH}` : `doorpiece_${k}_${cellsW}x${cellsH}`,
  exit: (wall: 'tech' | 'stone', on: boolean): string => `exit_${wall}_${on ? 'on' : 'off'}`,
  switch: (wall: 'tech' | 'stone', on: boolean): string => `switch_${wall}_${on ? 'on' : 'off'}`,
  actor: (k: string, dir: string, frame: number): string => `actor_${k}_${dir}_${frame}`,
  marine: (w: WeaponId, dir: string, frame: number): string => `actor_marine-${w}_${dir}_${frame}`,
  corpse: (k: CharacterKind): string => `corpse_${k}`,
  item: (k: ItemKind): string => `item_${k}`,
  deco: (k: DecoKind, frame: number): string => `deco_${k}_${frame}`,
  barrel: (frame: number): string => `barrel_${frame}`,
  fx: (name: string, frame: number): string => `fx_${name}_${frame}`,
  weaponIcon: (id: string): string => `icon_${id}`,
};

export function frameCanvas(scene: Phaser.Scene, name: string): HTMLCanvasElement {
  const frame = scene.textures.getFrame(ATLAS, name);
  const canvas = document.createElement('canvas');
  canvas.width = frame.cutWidth;
  canvas.height = frame.cutHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
  return canvas;
}
