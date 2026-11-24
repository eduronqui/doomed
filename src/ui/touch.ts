import type { UseAction } from '../sim/world';
import { knobOffset, stickVector, type StickVector } from './stick';

const STICK_RADIUS = 56;
const MOVE_DEAD_ZONE = 0.15;
const AIM_DEAD_ZONE = 0.3;
const FIRE_STRENGTH = 1;
const USE_LABELS: Record<UseAction, string> = { exit: 'EXIT', switch: 'PULL' };

type Role = 'move' | 'aim';

export interface TouchState {
  moveX: number;
  moveY: number;
  isAiming: boolean;
  aimAngle: number;
  isFiring: boolean;
  isUsing: boolean;
}

interface Grip {
  role: Role;
  originX: number;
  originY: number;
}

type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };

const IDLE: StickVector = { x: 0, y: 0, angle: 0, strength: 0, isActive: false };

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

export class TouchControls {
  readonly isEnabled: boolean;
  private layer: HTMLElement | null = null;
  private sticks = new Map<Role, HTMLElement>();
  private grips = new Map<number, Grip>();
  private vectors: Record<Role, StickVector> = { move: IDLE, aim: IDLE };
  private aimAngle = 0;
  private isFiring = false;
  private isUseQueued = false;
  private isPauseQueued = false;
  private pauseButton: HTMLElement | null = null;
  private useButton: HTMLButtonElement | null = null;
  private useAction: UseAction | null = null;
  private portrait = window.matchMedia('(orientation: portrait)');

  constructor() {
    this.isEnabled = document.documentElement.classList.contains('touch');
    if (!this.isEnabled) return;
    this.buildLayer();
    this.pauseButton = document.getElementById('pause-btn')!;
    this.pauseButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isPauseQueued = true;
    });
    window.addEventListener('blur', () => {
      this.releaseAll();
    });
    window.addEventListener('pointerup', () => void this.enterImmersive(), { once: true });
  }

  get isBlocked(): boolean {
    return this.isEnabled && this.portrait.matches;
  }

  read(): TouchState {
    const { move, aim } = this.vectors;
    const state: TouchState = { moveX: move.x, moveY: move.y, isAiming: aim.isActive, aimAngle: this.aimAngle, isFiring: this.isFiring, isUsing: this.isUseQueued };
    this.isUseQueued = false;
    return state;
  }

  showPaused(isPaused: boolean): void {
    const label = isPaused ? 'Resume' : 'Pause';
    if (this.pauseButton && this.pauseButton.textContent !== label) this.pauseButton.textContent = label;
  }

  takePause(): boolean {
    const isQueued = this.isPauseQueued;
    this.isPauseQueued = false;
    return isQueued;
  }

  private buildLayer(): void {
    const layer = make('div', '');
    layer.id = 'touch';
    this.layer = layer;
    for (const role of ['move', 'aim'] as const) {
      const stick = make('div', `stick ${role}`);
      stick.append(make('i', ''));
      layer.append(stick);
      this.sticks.set(role, stick);
    }
    layer.append(this.createUseButton());
    document.getElementById('tip-close')!.textContent = 'Continue';
    layer.addEventListener('pointerdown', (e) => this.onDown(e));
    layer.addEventListener('pointermove', (e) => this.onMove(e));
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) layer.addEventListener(type, (e) => this.release((e as PointerEvent).pointerId));
    layer.addEventListener('contextmenu', (e) => e.preventDefault());
    document.getElementById('viewport')!.append(layer);
  }

  private createUseButton(): HTMLButtonElement {
    const btn = make('button', '', 'USE');
    btn.id = 'btn-use';
    btn.type = 'button';
    btn.hidden = true;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.isUseQueued = true;
    });
    this.useButton = btn;
    return btn;
  }

  showUse(action: UseAction | null): void {
    if (action === this.useAction || !this.useButton) return;
    this.useAction = action;
    this.useButton.hidden = action === null;
    if (!action) return;
    this.useButton.textContent = USE_LABELS[action];
    this.useButton.dataset.action = action;
  }

  private onDown(e: PointerEvent): void {
    const layer = this.layer!;
    if (e.target !== layer) return;
    e.preventDefault();
    const rect = layer.getBoundingClientRect();
    const role: Role = e.clientX - rect.left < rect.width / 2 ? 'move' : 'aim';
    if ([...this.grips.values()].some((g) => g.role === role)) return;
    layer.setPointerCapture(e.pointerId);
    this.grips.set(e.pointerId, { role, originX: e.clientX, originY: e.clientY });
    const stick = this.sticks.get(role)!;
    stick.style.left = `${e.clientX - rect.left}px`;
    stick.style.top = `${e.clientY - rect.top}px`;
    stick.style.setProperty('--kx', '0px');
    stick.style.setProperty('--ky', '0px');
    stick.classList.add('on');
  }

  private onMove(e: PointerEvent): void {
    const grip = this.grips.get(e.pointerId);
    if (!grip) return;
    const dx = e.clientX - grip.originX;
    const dy = e.clientY - grip.originY;
    const vector = stickVector(dx, dy, STICK_RADIUS, grip.role === 'move' ? MOVE_DEAD_ZONE : AIM_DEAD_ZONE);
    this.vectors[grip.role] = vector;
    if (grip.role === 'aim') this.updateAim(vector);
    const knob = knobOffset(dx, dy, STICK_RADIUS);
    const stick = this.sticks.get(grip.role)!;
    stick.style.setProperty('--kx', `${knob.x}px`);
    stick.style.setProperty('--ky', `${knob.y}px`);
  }

  private updateAim(vector: StickVector): void {
    if (vector.isActive) this.aimAngle = vector.angle;
    const isFiring = vector.isActive && vector.strength >= FIRE_STRENGTH;
    if (isFiring && !this.isFiring) this.isUseQueued = true;
    this.isFiring = isFiring;
    this.sticks.get('aim')!.classList.toggle('firing', isFiring);
  }

  private release(pointerId: number): void {
    const grip = this.grips.get(pointerId);
    if (!grip) return;
    this.grips.delete(pointerId);
    this.vectors[grip.role] = IDLE;
    if (grip.role === 'aim') this.updateAim(IDLE);
    this.sticks.get(grip.role)!.classList.remove('on');
  }

  private releaseAll(): void {
    for (const id of [...this.grips.keys()]) this.release(id);
  }

  private async enterImmersive(): Promise<void> {
    if (!isStandalone()) {
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        return;
      }
    }
    try {
      await (screen.orientation as LockableOrientation).lock?.('landscape');
    } catch {
      return;
    }
  }
}
