import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { lite } from './env';

gsap.registerPlugin(ScrollTrigger);

const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------- cursor: a dot that grows into a labelled bubble ---------- */
let labelText: string | null = null;
const cur = document.getElementById('cursor');
const curLabel = cur?.querySelector('span') as HTMLElement | null;

export const cursorApi = {
  set(label: string | null) {
    if (!cur || !curLabel || label === labelText) return;
    labelText = label;
    if (label) {
      curLabel.textContent = label;
      gsap.to(cur, { width: 72, height: 72, marginLeft: -36, marginTop: -36, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(curLabel, { opacity: 1, scale: 1, duration: 0.3, overwrite: 'auto' });
    } else {
      gsap.to(cur, { width: 14, height: 14, marginLeft: -7, marginTop: -7, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(curLabel, { opacity: 0, scale: 0.5, duration: 0.2, overwrite: 'auto' });
    }
  },
};

function initCursor() {
  if (!cur || !finePointer) return;
  const cx = gsap.quickTo(cur, 'x', { duration: 0.22, ease: 'power3' });
  const cy = gsap.quickTo(cur, 'y', { duration: 0.22, ease: 'power3' });
  window.addEventListener('mousemove', (e) => {
    gsap.set(cur, { opacity: 1 });
    cx(e.clientX);
    cy(e.clientY);
  });
  document.addEventListener('mouseleave', () => gsap.set(cur, { opacity: 0 }));
  document.addEventListener('mouseover', (e) => {
    const t = e.target as Element;
    const lab = t.closest('[data-cursor]')?.getAttribute('data-cursor') ?? null;
    if (lab) { cursorApi.set(lab); return; }
    if (t.closest('a, button, .skill, .tab')) {
      cursorApi.set(null);
      gsap.to(cur, { scale: 2.6, duration: 0.3, overwrite: 'auto' });
    } else {
      cursorApi.set(null);
      gsap.to(cur, { scale: 1, duration: 0.3, overwrite: 'auto' });
    }
  });
}

/* ---------- magnetic elements ---------- */
function initMagnetic() {
  if (!finePointer) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * 0.28);
      my((e.clientY - (r.top + r.height / 2)) * 0.28);
    });
    el.addEventListener('mouseleave', () => { mx(0); my(0); });
  });
}

/* ---------- core: smooth scroll, nav transitions, spy, loader ---------- */
export function initCore() {
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  initCursor();
  initMagnetic();

  /* page transition overlay: tiles are built per click so they always fit the screen */
  const wipe = document.getElementById('wipe') as HTMLElement | null;

  function tileTransition(origin: { x: number; y: number }, label: string, jump: () => void, done: () => void) {
    if (!wipe) { jump(); done(); return; }
    const cols = innerWidth < 640 || lite ? 6 : 12;
    const size = innerWidth / cols;
    const rows = Math.ceil(innerHeight / size);
    wipe.textContent = '';
    wipe.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    wipe.style.gridTemplateRows = `repeat(${rows}, ${size}px)`;
    for (let i = 0; i < cols * rows; i++) {
      const t = document.createElement('div');
      const roll = Math.random();
      t.className = roll < 0.16 ? 'tile k1' : roll < 0.26 ? 'tile k2' : 'tile';
      wipe.appendChild(t);
    }
    const text = document.createElement('div');
    text.className = 'wipe-label';
    text.textContent = label;
    wipe.appendChild(text);

    const tiles = gsap.utils.toArray<HTMLElement>('#wipe .tile');
    const from = Math.min(rows - 1, Math.max(0, Math.floor(origin.y / size))) * cols
      + Math.min(cols - 1, Math.max(0, Math.floor(origin.x / size)));
    wipe.style.visibility = 'visible';

    gsap.timeline({ onComplete: () => { wipe.style.visibility = 'hidden'; wipe.textContent = ''; done(); } })
      .fromTo(tiles, { scale: 0, rotate: -90 },
        { scale: 1.05, rotate: 0, duration: 0.45, ease: 'back.out(1.4)', stagger: { amount: 0.55, grid: [rows, cols], from } })
      .fromTo(text, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, '-=0.25')
      .add(() => {
        try { jump(); }
        catch (err) { console.error('transition jump failed', err); }
      })
      .to(text, { opacity: 0, y: -30, duration: 0.25, ease: 'power3.in' }, '+=0.25')
      .to(tiles, { scale: 0, rotate: 90, duration: 0.4, ease: 'power3.in', stagger: { amount: 0.5, grid: [rows, cols], from: 'center' } }, '-=0.1');
  }

  /* scroll progress */
  gsap.to('#progress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
  });

  /* nav hides while scrolling down, returns on the way up */
  const nav = document.querySelector<HTMLElement>('.nav');
  if (nav) {
    const showNav = gsap.quickTo(nav, 'yPercent', { duration: 0.5, ease: 'power3' });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => showNav(self.scroll() < 160 || self.direction === -1 ? 0 : -130),
    });
  }

  /* anchor links: nav ones use a tile transition, the rest glide */
  let wiping = false;
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      if (!a.hasAttribute('data-nav') && !a.hasAttribute('data-spy')) {
        lenis.scrollTo(target, { duration: 1.6 });
        return;
      }
      const r = a.getBoundingClientRect();
      goTo(
        id,
        { x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2 },
        a.querySelector('.roll span')?.textContent?.trim() || undefined,
      );
    });
  });

  /** Jump to a section with the tile transition (also used by the command palette). */
  function goTo(id: string, origin?: { x: number; y: number }, label?: string) {
    const target = document.querySelector<HTMLElement>(id);
    if (!target || wiping) return;
    wiping = true;
    lenis.stop();
    tileTransition(
      origin ?? { x: innerWidth / 2, y: innerHeight / 2 },
      label ?? id.slice(1).replace('top', 'home'),
      () => { lenis.scrollTo(target, { immediate: true, force: true }); ScrollTrigger.update(); },
      () => { wiping = false; lenis.start(); },
    );
  }

  /* scroll spy */
  document.querySelectorAll<HTMLElement>('[data-spy]').forEach((dot) => {
    const id = dot.dataset.spy!;
    const sec = document.getElementById(id);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (s) => {
        if (!s.isActive) { dot.classList.remove('on'); return; }
        dot.classList.add('on');
        document.querySelectorAll('.nav-links a').forEach((l) => l.classList.toggle('on', l.getAttribute('href') === `#${id}`));
      },
    });
  });

  /* loader: counts up, then lifts away. `onDone` starts the page's intro. */
  const loader = document.getElementById('loader');
  const num = loader?.querySelector<HTMLElement>('.loader-num');
  let started = false;
  const finish = () => {
    if (loader) loader.style.display = 'none';
    lenis.start();
    try { sessionStorage.setItem('seen', '1'); } catch { /* storage blocked: fine */ }
    /* arriving from a project page with #work etc: land on that section */
    const h = location.hash;
    if (h.length > 1) {
      const el = document.querySelector<HTMLElement>(h);
      if (el) { ScrollTrigger.refresh(); lenis.scrollTo(el, { immediate: true, force: true }); }
    }
  };

  function run(onDone: () => void) {
    if (started) return;
    started = true;
    let seen = false;
    try { seen = sessionStorage.getItem('seen') === '1'; } catch { /* storage blocked: fine */ }
    /* returning visitors skip the counter: straight into the page */
    if (!loader || !num || seen) {
      if (loader) loader.style.display = 'none';
      onDone();
      finish();
      return;
    }
    const counter = { v: 0 };
    gsap.timeline({ onComplete: finish })
      .to('.loader-name', { y: 0, duration: 0.01 })
      .to('.loader-bar i', { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to(counter, {
        v: 100, duration: 1.3, ease: 'power2.inOut',
        onUpdate: () => { num.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
      }, 0)
      .to(loader.querySelector('.loader-inner'), { yPercent: -30, opacity: 0, duration: 0.45, ease: 'power3.in' }, '+=0.1')
      .to(loader, { yPercent: -100, duration: 1, ease: 'power4.inOut' }, '-=0.1')
      .add(onDone, '-=0.55');
  }

  return {
    lenis,
    goTo,
    start(onDone: () => void) {
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2000))]).then(() => run(onDone));
      setTimeout(() => run(onDone), 2600); // hard fallback
      setTimeout(() => { if (loader && loader.style.display !== 'none') finish(); }, 8000);
    },
  };
}

export type Core = ReturnType<typeof initCore>;
