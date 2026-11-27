import type { Sfx } from '../render/sfx';
import type { Difficulty, DifficultyId } from '../sim/defs';
import type { Stats } from '../sim/world';
import { formatTime } from './hud';
import { drawLogo } from './logo';
import { NAME_MAX, isValidName } from '../net/protocol';
import { ROOM_CODE_LENGTH, cleanCode } from '../net/signal';

type Pick = (d: Difficulty) => void;

export interface VersusApi {
  host(name: string, onFail: (message: string) => void): Promise<string>;
  join(name: string, code: string, onFail: (message: string) => void): Promise<void>;
  back(): void;
}

const PRIVACY = 'Playing online shares your IP address with the other player, with the DOOMED server that sets up the match, and with a public STUN server (Cloudflare) that helps the two browsers find each other. Only give your code to people you trust.';

interface Counter {
  label: string;
  target: number;
  step: number;
  format: (v: number) => string;
  isInstant?: boolean;
}

const TICK_MS = 33;
const SHOT_EVERY = 2;
const LINE_PAUSE_MS = 450;
const PREV_KEYS = new Set(['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA']);
const NEXT_KEYS = new Set(['ArrowDown', 'ArrowRight', 'KeyS', 'KeyD']);
const ENTER_KEYS = new Set(['Enter', 'NumpadEnter', 'Space']);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

export function pct(n: number, total: number): number {
  return total === 0 ? 100 : Math.round((n / total) * 100);
}

export class Screens {
  private root: HTMLElement;
  private onClick: (() => void) | null = null;
  private timer: number | null = null;
  private sfx: Sfx;
  private actions = new WeakMap<HTMLButtonElement, () => void>();
  private buttons: HTMLButtonElement[] = [];
  private selected = 0;
  private keepOpen = new WeakSet<HTMLButtonElement>();

  constructor(sfx: Sfx) {
    this.sfx = sfx;
    this.root = document.getElementById('screen')!;
    this.root.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !this.onClick) return;
      const cb = this.onClick;
      cb();
    });
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.visible || e.repeat) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (ENTER_KEYS.has(e.code)) {
      e.preventDefault();
      if (this.onClick) this.onClick();
      else this.press(this.buttons[this.selected]);
    } else if (PREV_KEYS.has(e.code)) this.select(this.selected - 1);
    else if (NEXT_KEYS.has(e.code)) this.select(this.selected + 1);
  }

  private choice(name: string, blurb: string, cls: string, action: () => void, keepOpen = false): HTMLButtonElement {
    const btn = el('button', undefined, cls);
    btn.type = 'button';
    btn.append(el('span', name, 'diff-name'), el('span', blurb, 'diff-blurb'));
    this.actions.set(btn, action);
    if (keepOpen) this.keepOpen.add(btn);
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      this.press(btn);
    });
    btn.addEventListener('pointerenter', () => {
      const index = this.buttons.indexOf(btn);
      if (index >= 0) this.select(index);
    });
    return btn;
  }

  private press(btn: HTMLButtonElement | undefined): void {
    const action = btn && this.actions.get(btn);
    if (!action) return;
    if (!this.keepOpen.has(btn)) this.hide();
    action();
  }

  private bindButtons(): void {
    this.buttons = [...this.root.querySelectorAll<HTMLButtonElement>('button')];
    this.select(Math.max(0, this.buttons.findIndex((b) => b.classList.contains('current'))));
  }

  private select(index: number): void {
    const n = this.buttons.length;
    if (n === 0) return;
    this.selected = (index + n) % n;
    this.buttons.forEach((b, i) => b.classList.toggle('selected', i === this.selected));
  }

  get visible(): boolean {
    return !this.root.classList.contains('hidden');
  }

  hide(): void {
    this.stopTimer();
    this.root.classList.add('hidden');
    this.onClick = null;
    this.buttons = [];
  }

  private stopTimer(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }

  private show(parts: HTMLElement[], onClick: (() => void) | null): void {
    this.stopTimer();
    const card = el('div', undefined, 'card');
    card.append(...parts);
    this.root.replaceChildren(card);
    this.root.classList.remove('hidden');
    this.onClick = onClick;
    this.bindButtons();
  }

  private picker(title: string, list: Difficulty[], current: DifficultyId, onPick: Pick): HTMLElement {
    const box = el('div', undefined, 'picker');
    box.append(el('div', title, 'picker-title'));
    for (const d of list) box.append(this.choice(d.name, d.blurb, `diff${d.id === current ? ' current' : ''}`, () => onPick(d)));
    return box;
  }

  title(levelTitle: string, briefing: string, list: Difficulty[], current: DifficultyId, onPick: Pick): void {
    const logo = drawLogo();
    logo.className = 'logo';
    logo.setAttribute('role', 'img');
    logo.setAttribute('aria-label', 'DOOMED');
    this.show([logo, el('h3', levelTitle), el('p', briefing), this.picker('Choose your difficulty', list, current, onPick)], null);
  }

  notice(title: string, text: string, button: string, action: () => void): void {
    const box = el('div', undefined, 'picker');
    box.append(this.choice(button, '', 'diff current', action));
    this.show([el('h1', title), el('h3', text), box], null);
  }

  menu(title: string, text: string, options: { name: string; blurb: string; action: () => void }[]): void {
    const box = el('div', undefined, 'picker');
    options.forEach((o, i) => box.append(this.choice(o.name, o.blurb, i === 0 ? 'diff current' : 'diff', o.action)));
    this.show([el('h1', title), el('p', text), box], null);
  }

  versus(api: VersusApi, name = ''): void {
    const input = el('input', undefined, 'lobby-input');
    input.type = 'text';
    input.maxLength = NAME_MAX;
    input.placeholder = 'Your name';
    input.value = name;
    input.autocomplete = 'off';
    input.spellcheck = false;
    const status = el('p', '', 'lobby-status');
    const named = (next: (api: VersusApi, name: string) => void) => (): void => {
      if (!isValidName(input.value)) {
        status.textContent = 'Type your name first.';
        input.focus();
        return;
      }
      this.hide();
      next(api, input.value);
    };
    input.addEventListener('input', () => (status.textContent = ''));
    const box = el('div', undefined, 'picker');
    box.append(
      this.choice('Host a match', 'Get a code to give to the other player.', 'diff current', named((a, n) => this.versusHost(a, n)), true),
      this.choice('Join a match', 'Type the code the host gave you.', 'diff', named((a, n) => this.versusJoin(a, n)), true),
      this.choice('Back', 'Return to the menu.', 'diff', api.back),
    );
    this.show([el('h1', 'VERSUS'), el('p', 'Two Marines, one arena. The host plays green, the guest plays blue.'), el('div', `Name (up to ${NAME_MAX} characters)`, 'picker-title'), input, status, box, el('p', PRIVACY, 'lobby-note')], null);
    input.focus();
  }

  private versusFailed(api: VersusApi, name: string, title: string, message: string): void {
    this.notice(title, message, 'Back', () => this.versus(api, name));
  }

  private versusHost(api: VersusApi, name: string): void {
    const status = el('p', 'Opening a room...', 'lobby-status');
    const back = el('div', undefined, 'picker');
    back.append(this.choice('Back', 'Close the room and return.', 'diff current', api.back));
    this.show([el('h1', 'HOST'), status, back], null);
    const fail = (message: string): void => {
      if (this.root.contains(status)) this.versusFailed(api, name, 'HOST', message);
    };
    api.host(name, fail).then((code) => {
      if (!this.root.contains(status)) return;
      const shown = el('div', code, 'lobby-room');
      const box = el('div', undefined, 'picker');
      box.append(
        this.choice(
          'Copy the code',
          'Give it to the other player by chat or voice.',
          'diff',
          () => {
            navigator.clipboard?.writeText(code).then(
              () => (status.textContent = 'Code copied. Waiting for the other player...'),
              () => (status.textContent = 'Copy the code by hand. Waiting for the other player...'),
            );
          },
          true,
        ),
        this.choice('Back', 'Close the room and return.', 'diff current', api.back),
      );
      status.textContent = 'Waiting for the other player... The match starts when they join.';
      this.show([el('h1', 'HOST'), el('div', 'Your room code', 'picker-title'), shown, status, box], null);
    }, (e: unknown) => fail(e instanceof Error ? e.message : 'Could not open a room.'));
  }

  private versusJoin(api: VersusApi, name: string): void {
    const input = el('input', undefined, 'lobby-input lobby-room-input');
    input.type = 'text';
    input.maxLength = ROOM_CODE_LENGTH + 4;
    input.placeholder = 'ABCDEF';
    input.autocomplete = 'off';
    input.autocapitalize = 'characters';
    input.spellcheck = false;
    const status = el('p', `Type the ${ROOM_CODE_LENGTH}-letter code the host gave you.`, 'lobby-status');
    const fail = (message: string): void => {
      if (this.root.contains(status)) this.versusFailed(api, name, 'JOIN', message);
    };
    let busy = false;
    const join = (): void => {
      const code = cleanCode(input.value);
      if (!code) {
        status.textContent = `The code has ${ROOM_CODE_LENGTH} letters.`;
        return;
      }
      if (busy) return;
      busy = true;
      status.textContent = 'Joining the room...';
      api.join(name, code, fail).then(
        () => {
          if (this.root.contains(status)) status.textContent = 'Connecting to the host...';
        },
        (e: unknown) => {
          busy = false;
          if (this.root.contains(status)) status.textContent = e instanceof Error ? e.message : 'Could not join the room.';
        },
      );
    };
    input.addEventListener('input', () => (input.value = input.value.toUpperCase()));
    input.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') join();
    });
    const box = el('div', undefined, 'picker');
    box.append(this.choice('Join', 'Connect to the host.', 'diff current', join, true), this.choice('Back', 'Return.', 'diff', api.back));
    this.show([el('h1', 'JOIN'), el('div', 'Room code', 'picker-title'), input, box, status], null);
    input.focus();
  }

  mainMenu(save: { blurb: string } | null, onContinue: () => void, onNew: () => void, onVersus: () => void): void {
    const logo = drawLogo();
    logo.className = 'logo';
    logo.setAttribute('role', 'img');
    logo.setAttribute('aria-label', 'DOOMED');
    const box = el('div', undefined, 'picker');
    if (save) box.append(this.choice('Continue', save.blurb, 'diff current', onContinue));
    box.append(
      this.choice('New game', save ? 'Replaces your saved game when the level starts.' : 'Start the episode.', save ? 'diff' : 'diff current', onNew),
      this.choice('Versus', 'Two players online. First to 10 frags wins.', 'diff', onVersus),
    );
    this.show([logo, box], null);
  }

  paused(onResume: () => void): void {
    this.show([el('h1', 'PAUSED'), el('p', 'The demons wait for you.'), el('div', 'Click or press Enter, Space or Esc to resume', 'prompt')], () => {
      this.hide();
      onResume();
    });
  }

  dead(list: Difficulty[], current: DifficultyId, onPick: Pick, canPick: boolean): void {
    const retry = canPick ? this.picker('Try again (R repeats the same difficulty)', list, current, onPick) : this.retry(list, current, onPick);
    this.show([el('h1', 'YOU DIED'), retry], null);
  }

  private retry(list: Difficulty[], current: DifficultyId, onPick: Pick): HTMLElement {
    const difficulty = list.find((d) => d.id === current) ?? list[0];
    const box = el('div', undefined, 'picker');
    box.append(this.choice('Try again', 'Press Enter, Space or R.', 'diff current', () => onPick(difficulty)));
    return box;
  }

  won(
    levelTitle: string,
    stats: Stats,
    time: number,
    par: number,
    list: Difficulty[],
    current: DifficultyId,
    onPick: Pick,
    next: { title: string; onContinue: () => void; blurb?: string } | null,
  ): void {
    const counters: Counter[] = [
      { label: 'Kills', target: pct(stats.kills, stats.totalKills), step: 2, format: (v) => `${v}%` },
      { label: 'Items', target: pct(stats.items, stats.totalItems), step: 2, format: (v) => `${v}%` },
      { label: 'Secrets', target: pct(stats.secrets, stats.totalSecrets), step: 2, format: (v) => `${v}%` },
      { label: 'Time', target: Math.floor(time), step: 3, format: formatTime },
      { label: 'Par', target: par, step: 3, format: formatTime, isInstant: true },
    ];
    const table = el('table', undefined, 'tally');
    const cells = counters.map((c) => {
      const tr = el('tr');
      const value = el('td', '');
      tr.append(el('td', c.label), value);
      tr.style.visibility = 'hidden';
      table.append(tr);
      return { row: tr, value };
    });
    const footer = el('div', undefined, 'tally-footer');
    this.show([el('h1', 'CLEARED'), el('h3', `${levelTitle} finished`), table, footer], null);

    let line = 0;
    let value = 0;
    let ticks = 0;
    const finishAll = (): void => {
      this.stopTimer();
      counters.forEach((c, i) => {
        cells[i].row.style.visibility = 'visible';
        cells[i].value.textContent = c.format(c.target);
      });
      this.sfx.play('explode', 0.7);
      if (next) {
        const box = el('div', undefined, 'picker');
        box.append(this.choice(`Continue to ${next.title}`, next.blurb ?? 'Your weapons, ammo, health and armor carry over.', 'diff current next', next.onContinue));
        footer.replaceChildren(box);
      } else {
        footer.replaceChildren(el('p', 'The gate is sealed. The episode is complete... for now.'), this.picker('Play the episode again', list, current, onPick));
      }
      this.onClick = null;
      this.bindButtons();
    };
    const tick = (): void => {
      const c = counters[line];
      cells[line].row.style.visibility = 'visible';
      value = c.isInstant ? c.target : Math.min(c.target, value + c.step);
      cells[line].value.textContent = c.format(value);
      if (!c.isInstant && ticks++ % SHOT_EVERY === 0) this.sfx.play('pistol', 0.45);
      if (value >= c.target) {
        this.sfx.play('explode', 0.7);
        line++;
        value = 0;
        if (line >= counters.length) {
          finishAll();
          return;
        }
        this.timer = window.setTimeout(tick, LINE_PAUSE_MS);
        return;
      }
      this.timer = window.setTimeout(tick, TICK_MS);
    };
    this.onClick = finishAll;
    this.timer = window.setTimeout(tick, 600);
  }
}
