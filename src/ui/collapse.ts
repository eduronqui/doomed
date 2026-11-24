import { readFlag, writeFlag } from './storage';

export function bindCollapse(root: HTMLElement, trigger: HTMLElement, storageKey: string, isCollapsedByDefault: boolean): void {
  const apply = (isCollapsed: boolean): void => {
    root.classList.toggle('collapsed', isCollapsed);
    trigger.setAttribute('aria-expanded', String(!isCollapsed));
  };
  apply(readFlag(storageKey, isCollapsedByDefault));
  trigger.addEventListener('click', () => {
    const isCollapsed = !root.classList.contains('collapsed');
    apply(isCollapsed);
    writeFlag(storageKey, isCollapsed);
  });
}
