/** Light/dark toggle. The new theme spreads out from the button as a circle (View Transitions API). */
export function initTheme() {
  const btn = document.getElementById('theme');
  if (!btn) return;
  const root = document.documentElement;

  const apply = (t: string) => {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch { /* storage blocked: fine */ }
  };

  btn.addEventListener('click', (e) => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) { apply(next); return; }

    const rect = btn.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const t = doc.startViewTransition(() => apply(next));
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 850, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
  });
}
