import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindCollapse } from '../src/ui/collapse';

function fakeElement() {
  const classes = new Set<string>();
  const attrs = new Map<string, string>();
  const listeners = new Map<string, (e: never) => void>();
  return {
    classList: {
      toggle: (name: string, force: boolean) => void (force ? classes.add(name) : classes.delete(name)),
      contains: (name: string) => classes.has(name),
    },
    setAttribute: (name: string, value: string) => void attrs.set(name, value),
    addEventListener: (type: string, fn: (e: never) => void) => void listeners.set(type, fn),
    attrs,
    press: () => listeners.get('pointerdown')!({ button: 0, preventDefault: () => undefined } as never),
  };
}

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal('window', {
    localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
  });
  return store;
}

afterEach(() => vi.unstubAllGlobals());

describe('bindCollapse', () => {
  it('starts collapsed by default and expands on click', () => {
    stubStorage();
    const root = fakeElement();
    const trigger = fakeElement();
    bindCollapse(root as never, trigger as never, 'k', true);
    expect(root.classList.contains('collapsed')).toBe(true);
    expect(trigger.attrs.get('aria-expanded')).toBe('false');
    trigger.press();
    expect(root.classList.contains('collapsed')).toBe(false);
    expect(trigger.attrs.get('aria-expanded')).toBe('true');
  });

  it('remembers the choice', () => {
    const store = stubStorage();
    const trigger = fakeElement();
    bindCollapse(fakeElement() as never, trigger as never, 'k', true);
    trigger.press();
    expect(store.get('k')).toBe('0');
    const reopened = fakeElement();
    bindCollapse(reopened as never, fakeElement() as never, 'k', true);
    expect(reopened.classList.contains('collapsed')).toBe(false);
  });
});
