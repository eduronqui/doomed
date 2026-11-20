import Phaser from 'phaser';
import { Sfx } from './render/sfx';
import { Music } from './render/music';
import { GameScene, VIEW_H, VIEW_W, type GameDeps } from './render/GameScene';
import { ArenaScene } from './render/ArenaScene';
import { ATLAS, ATLAS_DATA, ATLAS_IMAGE, frameCanvas, key } from './render/atlas';
import { WEAPON_ORDER } from './weapons';
import { Hud } from './ui/hud';
import { Screens } from './ui/screens';

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.atlas(ATLAS, ATLAS_IMAGE, ATLAS_DATA);
  }

  create(): void {
    const iconNames = [...WEAPON_ORDER.map((w) => key.weaponIcon(w)), 'item_clip', 'item_shells', 'item_redkey', 'item_bluekey', 'item_yellowkey'];
    const canvases = new Map(iconNames.map((name) => [name, frameCanvas(this, name)]));
    const sfx = new Sfx();
    const deps: GameDeps = { sfx, music: new Music(sfx), hud: new Hud(canvases), screens: new Screens(sfx) };
    this.scene.start('game', { deps });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { mouse: { preventDefaultWheel: true } },
  scene: [BootScene, GameScene, ArenaScene],
});
