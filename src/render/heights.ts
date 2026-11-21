import type { Grid } from '../sim/grid';
import { STAIR_HEIGHT, type FloorKind } from '../sim/level';
import { RAISE, type StairDir, type StairFloor } from './art/raised';
import { TILE } from './art/tiles';
import { key } from './atlas';

export { RAISE };
const LEDGE = 0.5;

export type VariantOf = (cellX: number, cellY: number) => number;
export type DrawFrame = (frameKey: string, dx: number, dy: number) => void;

const PLATE: Record<FloorKind, StairFloor> = { metal: 'metal', concrete: 'concrete', rock: 'rock', grate: 'metal', slime: 'concrete', lava: 'rock' };

function heightOf(grid: Grid, x: number, y: number): number | null {
  const t = grid.tile(x, y);
  return t && (t.type === 'floor' || t.type === 'door') ? t.height : null;
}

function upSide(grid: Grid, x: number, y: number): [number, number] {
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ] as const) {
    if ((heightOf(grid, x + dx, y + dy) ?? 0) > STAIR_HEIGHT) return [dx, dy];
  }
  return [0, -1];
}

export function rowHasHeight(grid: Grid, y: number): boolean {
  for (let x = 0; x < grid.width; x++) if ((heightOf(grid, x, y) ?? 0) > 0) return true;
  return false;
}

export function drawLowShadows(ctx: CanvasRenderingContext2D, grid: Grid): void {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const here = heightOf(grid, x, y);
      if (here === null) continue;
      const north = heightOf(grid, x, y - 1);
      if (north !== null && north - here > LEDGE) {
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fillRect(x * TILE, y * TILE, TILE, 4);
      }
      for (const side of [-1, 1]) {
        const n = heightOf(grid, x + side, y);
        if (n === null || n - here <= LEDGE) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(side < 0 ? x * TILE : x * TILE + TILE - 5, y * TILE, 5, TILE);
      }
    }
  }
}

function drawPlatform(grid: Grid, x: number, y: number, variantOf: VariantOf, drawFrame: DrawFrame): void {
  const px = x * TILE;
  const floor = grid.tile(x, y)!.floor;
  const v = variantOf(x, y);
  drawFrame(key.raisedTop(floor, v), px, 0);
  drawFrame(key.raisedFace(floor, v), px, TILE);
  if ((heightOf(grid, x, y - 1) ?? 1) < 1 - LEDGE) drawFrame(key.ledgeRim(false), px, 0);
  for (const side of [-1, 1]) {
    if ((heightOf(grid, x + side, y) ?? 1) >= 1 - LEDGE) continue;
    drawFrame(key.ledgeRim(true), side < 0 ? px : px + TILE - 2, 0);
    drawFrame(key.ledgeSide(), side < 0 ? px : px + TILE - 1, TILE);
  }
}

function drawStairs(grid: Grid, x: number, y: number, drawFrame: DrawFrame): void {
  const [ux, uy] = upSide(grid, x, y);
  const top = grid.tile(x + ux, y + uy)!.floor;
  const up: StairDir = uy < 0 ? 'n' : uy > 0 ? 's' : ux < 0 ? 'w' : 'e';
  drawFrame(key.stairs(PLATE[top], up), x * TILE, 0);
}

export function drawRaisedRow(grid: Grid, y: number, variantOf: VariantOf, drawFrame: DrawFrame): void {
  for (let x = 0; x < grid.width; x++) {
    const h = heightOf(grid, x, y);
    if (h === STAIR_HEIGHT) drawStairs(grid, x, y, drawFrame);
    else if (h !== null && h > 0) drawPlatform(grid, x, y, variantOf, drawFrame);
  }
}
