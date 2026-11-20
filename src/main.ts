import Phaser from 'phaser';
import { Sfx } from './render/sfx';
import { Music } from './render/music';
import { GameScene, VIEW_H, VIEW_W, type GameDeps } from './render/GameScene';
import { ArenaScene } from './render/ArenaScene';
import { ATLAS, ATLAS_DATA, ATLAS_IMAGE, frameCanvas, key } from './render/atlas';
import { AMMO_ORDER, WEAPON_ORDER } from './weapons';
import { AMMO_ICON } from './ui/hud';
import { Hud } from './ui/hud';
import { Screens } from './ui/screens';
import { TouchControls } from './ui/touch';
import { bindCollapse } from './ui/collapse';
import { mountInstallHint } from './ui/install';

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.atlas(ATLAS, ATLAS_IMAGE, ATLAS_DATA);
  }

  create(): void {
    const iconNames = [...WEAPON_ORDER.map((w) => key.weaponIcon(w)), ...AMMO_ORDER.map((a) => AMMO_ICON[a]), 'item_redkey', 'item_bluekey', 'item_yellowkey'];
    const canvases = new Map(iconNames.map((name) => [name, frameCanvas(this, name)]));
    const sfx = new Sfx();
    const touch = new TouchControls();
    if (touch.isEnabled) {
      const panel = document.getElementById('panel')!;
      const togglePanel = bindCollapse(panel, document.getElementById('panel-toggle')!, 'doomed.hudCollapsed', true);
      document.addEventListener(
        'pointerdown',
        (e) => {
          if (!panel.classList.contains('collapsed') && !panel.contains(e.target as Node)) togglePanel();
        },
        true,
      );
      for (const id of ['panel-status', 'panel-inventory']) {
        document.getElementById(id)!.addEventListener('pointerdown', () => {
          if (panel.classList.contains('collapsed')) togglePanel();
        });
      }
      bindCollapse(document.getElementById('console')!, document.getElementById('console-toggle')!, 'doomed.logCollapsed', true);
      mountInstallHint();
    }
    const deps: GameDeps = { sfx, music: new Music(sfx), hud: new Hud(canvases), screens: new Screens(sfx), touch };
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
