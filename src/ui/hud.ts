import type { KeyColor } from '../sim/defs';
import { MAX_AMMO, WEAPONS, WEAPON_ORDER, type WeaponId } from '../weapons';
import type { MessageTone, World } from '../sim/world';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const KEY_COLORS: KeyColor[] = ['red', 'blue', 'yellow'];

const MINIMAP_COLORS = {
  wall: '#8a8478',
  stone: '#8a4a3a',
  floor: '#3a3a3e',
  rock: '#3a2420',
  slime: '#2a8a2a',
  lava: '#d0501a',
  door: '#d8b02a',
  red: '#e02a2a',
  blue: '#3a7aff',
  yellow: '#ffe040',
  exit: '#40e050',
};

export class Hud {
  private cache = new Map<string, string>();
  private slots = new Map<WeaponId, { root: HTMLElement; ammo: HTMLElement }>();
  private minimap: HTMLCanvasElement;
  private explored: Uint8Array = new Uint8Array(0);
  private minimapTimer = 0;
  private centerTimer = 0;
  private hurt = $('hurt');
  private center = $('center-msg');
  private log = $('log');
  private tip = $('tip');
  private tipText = '';
  private onSkip: (() => void) | null = null;

  constructor(icons: Map<string, HTMLCanvasElement>) {
    this.minimap = $<HTMLCanvasElement>('minimap');
    $('tip-skip').addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !this.onSkip) return;
      e.stopPropagation();
      this.onSkip();
    });
    window.addEventListener('keydown', (e) => {
      if (e.repeat || e.defaultPrevented || (e.code !== 'Enter' && e.code !== 'NumpadEnter')) return;
      if (!this.onSkip || this.tip.classList.contains('hidden') || !$('screen').classList.contains('hidden')) return;
      e.preventDefault();
      this.onSkip();
    });
    const slotRoot = $('slots');
    slotRoot.replaceChildren();
    for (const id of WEAPON_ORDER) {
      const root = document.createElement('div');
      root.className = 'wslot locked';
      root.title = WEAPONS[id].name;
      root.append(this.icon(icons, `icon_${id}`));
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(WEAPONS[id].slot);
      const ammo = document.createElement('span');
      ammo.className = 'ammo';
      root.append(num, ammo);
      slotRoot.append(root);
      this.slots.set(id, { root, ammo });
    }
    $('inv-bullets').replaceChildren(this.icon(icons, 'item_clip'));
    $('inv-shells').replaceChildren(this.icon(icons, 'item_shells'));
    for (const color of KEY_COLORS) $(`inv-key-${color}`).replaceChildren(this.icon(icons, `item_${color}key`));
  }

  private icon(icons: Map<string, HTMLCanvasElement>, key: string): HTMLImageElement {
    const img = document.createElement('img');
    const canvas = icons.get(key);
    if (canvas) img.src = canvas.toDataURL();
    img.alt = '';
    return img;
  }

  setTip(text: string | null, onSkip: (() => void) | null): void {
    this.onSkip = onSkip;
    if (text === this.tipText) return;
    this.tipText = text ?? '';
    this.tip.classList.toggle('hidden', text === null);
    $('tip-text').textContent = this.tipText;
  }

  reset(world: World, levelTitle: string): void {
    this.cache.clear();
    this.log.replaceChildren();
    this.explored = new Uint8Array(world.grid.width * world.grid.height);
    this.minimap.width = world.grid.width * 3;
    this.minimap.height = world.grid.height * 3;
    $('level-name').textContent = levelTitle;
    this.hurt.style.opacity = '0';
  }

  private setText(id: string, value: string): void {
    if (this.cache.get(id) === value) return;
    this.cache.set(id, value);
    $(id).textContent = value;
  }

  private setBar(cls: string, value: number, max: number, label: string): void {
    const key = `bar-${cls}`;
    const text = `${value}|${max}`;
    if (this.cache.get(key) === text) return;
    this.cache.set(key, text);
    const bar = document.querySelector<HTMLElement>(`.bar.${cls}`)!;
    bar.querySelector<HTMLElement>('.fill')!.style.width = `calc(${Math.min(100, (value / max) * 100)}% - 2px)`;
    bar.querySelector<HTMLElement>('.value')!.textContent = label;
  }

  update(world: World, dt: number): void {
    const p = world.player;
    this.setBar('hp', p.health, p.health > 100 ? 200 : 100, `${p.health}`);
    this.setBar('ar', p.armor, p.armor > 100 ? 200 : 100, `${p.armor}`);
    for (const [id, slot] of this.slots) {
      const owned = p.weapons.has(id);
      const ammoType = WEAPONS[id].ammo;
      const cls = `wslot${owned ? '' : ' locked'}${p.weapon === id ? ' active' : ''}`;
      if (slot.root.className !== cls) slot.root.className = cls;
      const ammoText = owned && ammoType ? String(p.ammo[ammoType]) : '';
      if (slot.ammo.textContent !== ammoText) slot.ammo.textContent = ammoText;
    }
    this.setText('ammo-bullets', `${p.ammo.bullets}/${MAX_AMMO.bullets}`);
    this.setText('ammo-shells', `${p.ammo.shells}/${MAX_AMMO.shells}`);
    for (const color of KEY_COLORS) {
      const cls = p.keys.has(color) ? 'slot' : 'slot empty';
      const slot = $(`inv-key-${color}`);
      if (slot.className !== cls) slot.className = cls;
    }

    const hurt = Math.min(0.85, p.hurtTime * 2.4 + (p.health < 25 && world.status === 'playing' ? 0.25 + Math.sin(world.time * 6) * 0.1 : 0));
    this.hurt.style.opacity = world.status === 'dead' ? '0.8' : hurt.toFixed(2);

    this.centerTimer -= dt;
    if (this.centerTimer <= 0) this.center.classList.remove('show');

    this.minimapTimer -= dt;
    if (this.minimapTimer <= 0) {
      this.minimapTimer = 0.15;
      this.drawMinimap(world);
    }
  }

  message(text: string, tone: MessageTone, time: number): void {
    const li = document.createElement('li');
    li.className = `t-${tone}`;
    const stamp = document.createElement('time');
    stamp.textContent = formatTime(time);
    li.append(stamp, document.createTextNode(text));
    this.log.append(li);
    while (this.log.children.length > 7) this.log.firstElementChild?.remove();
    if (tone !== 'pickup') {
      this.center.textContent = text;
      this.center.classList.add('show');
      this.centerTimer = 2.2;
    }
  }

  private drawMinimap(world: World): void {
    const g = world.grid;
    const p = world.player;
    const R = 7;
    for (let y = Math.floor(p.y) - R; y <= Math.floor(p.y) + R; y++) {
      for (let x = Math.floor(p.x) - R; x <= Math.floor(p.x) + R; x++) {
        if (g.inBounds(x, y) && Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) <= R && world.isRevealedAt(x + 0.5, y + 0.5)) this.explored[g.index(x, y)] = 1;
      }
    }
    const ctx = this.minimap.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.minimap.width, this.minimap.height);
    const S = 3;
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        if (!this.explored[g.index(x, y)]) continue;
        const t = g.tiles[g.index(x, y)];
        let color: string | null = null;
        if (t.type === 'wall') color = t.wall === 'stone' ? MINIMAP_COLORS.stone : MINIMAP_COLORS.wall;
        else if (t.type === 'door') color = t.door === 'red' || t.door === 'blue' || t.door === 'yellow' ? MINIMAP_COLORS[t.door] : t.door === 'secret' ? MINIMAP_COLORS.wall : MINIMAP_COLORS.door;
        else if (t.type === 'exit') color = MINIMAP_COLORS.exit;
        else if (t.type === 'floor') color = t.floor === 'slime' ? MINIMAP_COLORS.slime : t.floor === 'lava' ? MINIMAP_COLORS.lava : t.floor === 'rock' ? MINIMAP_COLORS.rock : MINIMAP_COLORS.floor;
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * S, y * S, S, S);
      }
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.floor(p.x * S) - 1, Math.floor(p.y * S) - 1, 3, 3);
    ctx.fillStyle = '#ffe040';
    ctx.fillRect(Math.floor((p.x + Math.cos(p.angle) * 1.2) * S), Math.floor((p.y + Math.sin(p.angle) * 1.2) * S), 1, 1);
  }
}
