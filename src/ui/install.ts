import { isStandalone } from './touch';
import { readFlag, writeFlag } from './storage';

const DISMISSED_KEY = 'doomed.installHintDismissed';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function mountInstallHint(): void {
  const hint = document.getElementById('install-hint')!;
  if (isStandalone() || readFlag(DISMISSED_KEY, false)) return;
  const text = document.getElementById('install-text')!;
  const go = document.getElementById('install-go')!;
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  let prompt: InstallPromptEvent | null = null;

  const render = (): void => {
    go.hidden = prompt === null;
    text.textContent = prompt
      ? 'Install DOOMED for fullscreen play.'
      : isIos
        ? 'For fullscreen play: tap Share, then Add to Home Screen.'
        : 'For fullscreen play: open the browser menu, then Install app.';
  };
  const dismiss = (): void => {
    hint.classList.add('hidden');
    writeFlag(DISMISSED_KEY, true);
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    prompt = e as InstallPromptEvent;
    render();
  });
  window.addEventListener('appinstalled', dismiss);
  go.addEventListener('click', () => {
    void prompt?.prompt();
    dismiss();
  });
  document.getElementById('install-close')!.addEventListener('click', dismiss);
  render();
  hint.classList.remove('hidden');
}
