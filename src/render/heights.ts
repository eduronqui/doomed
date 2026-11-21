import type { Grid } from '../sim/grid';
import { STAIR_HEIGHT, type FloorKind } from '../sim/level';
import { TILE } from './art/tiles';

export const RAISE = 12;
const STEPS = 4;
const STEP = TILE / STEPS;
const STEP_RISE = RAISE / STEPS;
const LEDGE = 0.5;

export type DrawFloorPart = (cellX: number, cellY: number, sx: number, sy: number, w: number, h: number, dx: number, dy: number) => void;
export type DrawPlate = (floor: FloorKind, sx: number, sy: number, w: number, h: number, dx: number, dy: number) => void;

const PLATE: Partial<Record<FloorKind, FloorKind>> = { grate: 'metal', slime: 'concrete', lava: 'rock' };

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

function drawPlatform(ctx: CanvasRenderingContext2D, grid: Grid, x: number, y: number, drawFloorPart: DrawFloorPart): void {
  const px = x * TILE;
  drawFloorPart(x, y, 0, 0, TILE, TILE, px, 0);
  ctx.fillStyle = 'rgba(255,236,210,0.08)';
  ctx.fillRect(px, 0, TILE, TILE);
  drawFloorPart(x, y, 0, TILE - RAISE, TILE, RAISE, px, TILE);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(px, TILE, TILE, RAISE);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(px, TILE, TILE, 1);
  if ((heightOf(grid, x, y - 1) ?? 1) < 1 - LEDGE) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(px, 0, TILE, 2);
  }
  for (const side of [-1, 1]) {
    if ((heightOf(grid, x + side, y) ?? 1) >= 1 - LEDGE) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(side < 0 ? px : px + TILE - 2, 0, 2, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(side < 0 ? px : px + TILE - 1, TILE, 1, RAISE);
  }
}

function drawTread(ctx: CanvasRenderingContext2D, plate: FloorKind, drawPlate: DrawPlate, sx: number, sy: number, w: number, h: number, dx: number, dy: number): void {
  drawPlate(plate, sx, sy, w, h, dx, dy);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(dx, dy, w, h);
}

function drawStairs(ctx: CanvasRenderingContext2D, grid: Grid, x: number, y: number, drawPlate: DrawPlate): void {
  const px = x * TILE;
  const [ux, uy] = upSide(grid, x, y);
  const top = grid.tile(x + ux, y + uy)!.floor;
  const plate = PLATE[top] ?? top;
  if (uy < 0) {
    for (let k = STEPS - 1; k >= 0; k--) {
      const ty = RAISE + (STEPS - 1 - k) * STEP - STEP_RISE * (k + 1);
      drawTread(ctx, plate, drawPlate, 0, (STEPS - 1 - k) * STEP, TILE, STEP, px, ty);
      drawPlate(plate, 0, TILE - STEP_RISE, TILE, STEP_RISE, px, ty + STEP);
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(px, ty + STEP, TILE, STEP_RISE);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(px, ty + STEP, TILE, 1);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px, 0, 1, TILE + RAISE);
    ctx.fillRect(px + TILE - 1, 0, 1, TILE + RAISE);
  } else if (uy > 0) {
    for (let k = 0; k < STEPS; k++) {
      const ty = RAISE + k * STEP - STEP_RISE * (k + 1);
      drawTread(ctx, plate, drawPlate, 0, k * STEP, TILE, STEP, px, ty);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px, ty, TILE, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(px, ty + 1, TILE, 1);
    }
  } else {
    for (let k = 0; k < STEPS; k++) {
      const col = ux > 0 ? k : STEPS - 1 - k;
      const cx = px + col * STEP;
      const lift = STEP_RISE * (k + 1);
      drawTread(ctx, plate, drawPlate, col * STEP, 0, STEP, TILE, cx, RAISE - lift);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(ux > 0 ? cx : cx + STEP - 1, RAISE - lift, 1, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(cx, RAISE - lift, STEP, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(cx, TILE + RAISE - lift, STEP, lift);
    }
  }
}

export function drawRaisedRow(ctx: CanvasRenderingContext2D, grid: Grid, y: number, drawFloorPart: DrawFloorPart, drawPlate: DrawPlate): void {
  for (let x = 0; x < grid.width; x++) {
    const h = heightOf(grid, x, y);
    if (h === STAIR_HEIGHT) drawStairs(ctx, grid, x, y, drawPlate);
    else if (h !== null && h > 0) drawPlatform(ctx, grid, x, y, drawFloorPart);
  }
}
