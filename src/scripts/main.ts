import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './env';
import { initTheme } from './theme';
import { initExtras } from './extras';
import { initCore } from './core';
import { initHero } from './hero';
import { initSections } from './sections';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- link text roll (pure CSS hover, so it also works with reduced motion) ---------- */
document.querySelectorAll<HTMLElement>('[data-roll]').forEach((el) => {
  const icon = el.querySelector('svg');
  const label = (el.textContent ?? '').trim();
  el.textContent = '';
  if (icon) el.appendChild(icon);
  const roll = document.createElement('span');
  roll.className = 'roll';
  const a = document.createElement('span');
  const b = document.createElement('span');
  a.textContent = label;
  b.textContent = label;
  b.setAttribute('aria-hidden', 'true');
  roll.append(a, b);
  el.appendChild(roll);
});

initTheme();

if (reduced) {
  gsap.globalTimeline.timeScale(20); // interactive bits still work, but effectively instantly
  initHero(true);
  initSections(null, true);
  initExtras(null, true);
} else {
  const core = initCore();
  const hero = initHero(false); // creates the hero pin first so later triggers measure correctly
  initSections(core, false);
  initExtras(core, false);
  core.start(() => hero.play());
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
