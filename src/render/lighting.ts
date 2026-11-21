import Phaser from 'phaser';
import { TILE } from './art/tiles';

export interface Light {
  x: number;
  y: number;
  r: number;
  a: number;
  color: [number, number, number];
  glow: number;
  flicker?: boolean;
}

const RES = 4;

export class Lighting {
  private dark: Phaser.Textures.CanvasTexture;
  private glow: Phaser.Textures.CanvasTexture;
  private darkImg: Phaser.GameObjects.Image;
  private glowImg: Phaser.GameObjects.Image;
  private w: number;
  private h: number;
  private darkness: number;

  constructor(scene: Phaser.Scene, viewW: number, viewH: number, darkness: number, depth: number) {
    this.w = Math.ceil(viewW / RES) + 2;
    this.h = Math.ceil(viewH / RES) + 2;
    this.darkness = darkness;
    for (const k of ['light_dark', 'light_glow']) if (scene.textures.exists(k)) scene.textures.remove(k);
    this.dark = scene.textures.createCanvas('light_dark', this.w, this.h)!;
    this.glow = scene.textures.createCanvas('light_glow', this.w, this.h)!;
    this.dark.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.glow.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.darkImg = scene.add.image(0, 0, 'light_dark').setOrigin(0).setScale(RES).setDepth(depth);
    this.glowImg = scene.add.image(0, 0, 'light_glow').setOrigin(0).setScale(RES).setDepth(depth - 1).setBlendMode(Phaser.BlendModes.ADD);
  }

  render(view: Phaser.Geom.Rectangle, lights: Light[], clock: number, hidden: [number, number, number][] = []): void {
    const ox = Math.floor(view.x / RES) * RES - RES;
    const oy = Math.floor(view.y / RES) * RES - RES;
    this.darkImg.setPosition(ox, oy);
    this.glowImg.setPosition(ox, oy);

    const dctx = this.dark.context;
    const gctx = this.glow.context;
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, this.w, this.h);
    dctx.fillStyle = `rgba(4, 2, 10, ${this.darkness})`;
    dctx.fillRect(0, 0, this.w, this.h);
    dctx.globalCompositeOperation = 'destination-out';
    gctx.globalCompositeOperation = 'source-over';
    gctx.clearRect(0, 0, this.w, this.h);
    gctx.globalCompositeOperation = 'lighter';

    for (const l of lights) {
      const flick = l.flicker ? 0.9 + Math.sin(clock * 11 + l.x * 3) * 0.06 + Math.sin(clock * 23 + l.y) * 0.04 : 1;
      const r = (l.r * TILE * flick) / RES;
      const lx = (l.x * TILE - ox) / RES;
      const ly = (l.y * TILE - oy) / RES;
      if (lx + r < 0 || ly + r < 0 || lx - r > this.w || ly - r > this.h) continue;
      const g = dctx.createRadialGradient(lx, ly, 0, lx, ly, r);
      g.addColorStop(0, `rgba(0,0,0,${l.a})`);
      g.addColorStop(0.55, `rgba(0,0,0,${l.a * 0.6})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.fillRect(lx - r, ly - r, r * 2, r * 2);
      if (l.glow > 0) {
        const [cr, cg, cb] = l.color;
        const gg = gctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.8);
        gg.addColorStop(0, `rgba(${cr},${cg},${cb},${l.glow * flick})`);
        gg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        gctx.fillStyle = gg;
        gctx.fillRect(lx - r, ly - r, r * 2, r * 2);
      }
    }
    const cell = TILE / RES;
    dctx.globalCompositeOperation = 'source-over';
    dctx.fillStyle = '#000';
    gctx.globalCompositeOperation = 'destination-out';
    gctx.fillStyle = '#000';
    for (const [cx, cy, height] of hidden) {
      const x = (cx * TILE - ox) / RES;
      const y = (cy * TILE - oy) / RES;
      dctx.fillRect(x, y, cell, height / RES);
      gctx.fillRect(x, y, cell, height / RES);
    }
    this.dark.refresh();
    this.glow.refresh();
  }
}
