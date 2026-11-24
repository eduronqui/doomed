import { readFlag, writeFlag } from './storage';

export function bindCollapse(root: HTMLElement, trigger: HTMLElement, storageKey: string, isCollapsedByDefault: boolean): () => void {
  const apply = (isCollapsed: boolean): void => {
    root.classList.toggle('collapsed', isCollapsed);
    trigger.setAttribute('aria-expanded', String(!isCollapsed));
  };
  const toggle = (): void => {
    const isCollapsed = !root.classList.contains('collapsed');
    apply(isCollapsed);
    writeFlag(storageKey, isCollapsed);
  };
  apply(readFlag(storageKey, isCollapsedByDefault));
  trigger.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    toggle();
  });
  return toggle;
}
