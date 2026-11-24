(() => {
  const root = document.documentElement;
  const isTouch = window.matchMedia('(pointer: coarse)').matches || new URLSearchParams(window.location.search).has('touch');
  if (!isTouch) return;
  root.classList.add('touch');
  const portrait = window.matchMedia('(orientation: portrait)');
  const sync = () => root.classList.toggle('portrait', portrait.matches);
  sync();
  portrait.addEventListener('change', sync);
})();
