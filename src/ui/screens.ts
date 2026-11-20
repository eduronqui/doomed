import type { Sfx } from '../render/sfx';
import type { Difficulty, DifficultyId } from '../sim/defs';
import type { Stats } from '../sim/world';
import { formatTime } from './hud';
import { drawLogo } from './logo';

type Pick = (d: Difficulty) => void;

interface Counter {
  label: string;
  target: number;
  step: number;
  format: (v: number) => string;
}

const TICK_MS = 33;
const SHOT_EVERY = 2;
const LINE_PAUSE_MS = 450;

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

  constructor(sfx: Sfx) {
    this.sfx = sfx;
    this.root = document.getElementById('screen')!;
    this.root.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !this.onClick) return;
      const cb = this.onClick;
      cb();
    });
  }

  get visible(): boolean {
    return !this.root.classList.contains('hidden');
  }

  hide(): void {
    this.stopTimer();
    this.root.classList.add('hidden');
    this.onClick = null;
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
  }

  private picker(title: string, list: Difficulty[], current: DifficultyId, onPick: Pick): HTMLElement {
    const box = el('div', undefined, 'picker');
    box.append(el('div', title, 'picker-title'));
    for (const d of list) {
      const btn = el('button', undefined, `diff${d.id === current ? ' current' : ''}`);
      btn.type = 'button';
      btn.append(el('span', d.name, 'diff-name'), el('span', d.blurb, 'diff-blurb'));
      btn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        this.hide();
        onPick(d);
      });
      box.append(btn);
    }
    return box;
  }

  title(levelTitle: string, briefing: string, list: Difficulty[], current: DifficultyId, onPick: Pick): void {
    const logo = drawLogo();
    logo.className = 'logo';
    logo.setAttribute('role', 'img');
    logo.setAttribute('aria-label', 'DOOMED');
    this.show([logo, el('h3', levelTitle), el('p', briefing), this.picker('Choose your difficulty', list, current, onPick)], null);
  }

  paused(onResume: () => void): void {
    this.show([el('h1', 'PAUSED'), el('p', 'The demons wait for you.'), el('div', 'Click or press Esc to resume', 'prompt')], () => {
      this.hide();
      onResume();
    });
  }

  dead(stats: Stats, time: number, list: Difficulty[], current: DifficultyId, onPick: Pick): void {
    const table = el('table');
    for (const [k, v] of [
      ['Kills', `${stats.kills} / ${stats.totalKills}`],
      ['Time', formatTime(time)],
    ]) {
      const tr = el('tr');
      tr.append(el('td', k), el('td', v));
      table.append(tr);
    }
    this.show(
      [el('h1', 'YOU DIED'), el('h3', 'The outpost claims another soul.'), table, this.picker('Try again (R repeats the same difficulty)', list, current, onPick)],
      null,
    );
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
      { label: 'Par', target: par, step: 3, format: formatTime },
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
        const btn = el('button', undefined, 'diff current next');
        btn.type = 'button';
        btn.append(el('span', `Continue to ${next.title}`, 'diff-name'), el('span', next.blurb ?? 'Your weapons, ammo, health and armor carry over.', 'diff-blurb'));
        btn.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          this.hide();
          next.onContinue();
        });
        const box = el('div', undefined, 'picker');
        box.append(btn);
        footer.replaceChildren(box);
      } else {
        footer.replaceChildren(el('p', 'The gate is sealed. The episode is complete... for now.'), this.picker('Play the episode again', list, current, onPick));
      }
      this.onClick = null;
    };
    const tick = (): void => {
      const c = counters[line];
      cells[line].row.style.visibility = 'visible';
      value = Math.min(c.target, value + c.step);
      cells[line].value.textContent = c.format(value);
      if (ticks++ % SHOT_EVERY === 0) this.sfx.play('pistol', 0.45);
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
