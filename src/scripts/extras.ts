import { gsap } from 'gsap';
import type { Core } from './core';
import { lite, setLite } from './env';

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s);
const html = document.documentElement;

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

/* ---------- small toast, shared by the palette and QA mode ---------- */
let toastTimer: number | undefined;
function toast(msg: string) {
  const el = $('#qa-toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out', overwrite: true });
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    gsap.to(el, { y: 10, opacity: 0, duration: 0.3, onComplete: () => { el.hidden = true; } });
  }, 2600);
}

/* ---------- QA mode: outline everything like a test inspector, with a bug to squash ---------- */
function initQA(reduced: boolean) {
  const badge = $('#qa-badge');
  const tip = $('#qa-tip');
  const countEl = $('#qa-count');
  if (!badge || !tip || !countEl) return { toggle() {}, isOn: () => false };

  let on = false;
  let count = 0;
  let bug: HTMLElement | null = null;
  let hovered: Element | null = null;

  const describe = (el: Element) => {
    const r = el.getBoundingClientRect();
    const cls = typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className.trim().split(/\s+/)[0] : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}  ${Math.round(r.width)}×${Math.round(r.height)}`;
  };

  const onMove = (e: MouseEvent) => {
    const el = e.target as Element;
    if (!el || el === tip || el.closest('.qa-badge, .qa-bug')) { tip.hidden = true; return; }
    if (hovered !== el) { hovered?.classList.remove('qa-hover'); el.classList.add('qa-hover'); hovered = el; }
    tip.hidden = false;
    tip.textContent = describe(el);
    tip.style.left = `${Math.min(e.clientX + 14, innerWidth - 240)}px`;
    tip.style.top = `${Math.min(e.clientY + 16, innerHeight - 40)}px`;
  };

  function spawnBug() {
    if (!on || reduced) return;
    bug = document.createElement('button');
    bug.type = 'button';
    bug.className = 'qa-bug';
    bug.setAttribute('aria-label', 'Squash the bug');
    bug.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><g class="legs"><path d="M10 14L3 9M10 21H2M10 28L3 33M30 14l7-5M30 21h8M30 28l7 5"/></g><ellipse cx="20" cy="24" rx="9" ry="12"/><circle cx="20" cy="10" r="5"/><path d="M17 5L14 1M23 5l3-4"/></svg>';
    document.body.appendChild(bug);
    const edge = Math.random() < 0.5;
    gsap.set(bug, { x: edge ? -60 : innerWidth + 60, y: 80 + Math.random() * (innerHeight - 160) });
    crawl();
    bug.addEventListener('click', squash);
  }

  function crawl() {
    if (!bug || !on) return;
    const cur = { x: gsap.getProperty(bug, 'x') as number, y: gsap.getProperty(bug, 'y') as number };
    const tx = 40 + Math.random() * (innerWidth - 120);
    const ty = 80 + Math.random() * (innerHeight - 160);
    const angle = (Math.atan2(ty - cur.y, tx - cur.x) * 180) / Math.PI + 90;
    const dist = Math.hypot(tx - cur.x, ty - cur.y);
    gsap.to(bug, { rotation: angle, duration: 0.25, ease: 'power2.out' });
    gsap.to(bug, { x: tx, y: ty, duration: Math.max(0.8, dist / 230), ease: 'none', delay: 0.15, onComplete: crawl, overwrite: false });
  }

  function squash(e: Event) {
    e.stopPropagation();
    if (!bug) return;
    const b = bug;
    bug = null;
    gsap.killTweensOf(b);
    count += 1;
    countEl!.textContent = String(count);
    toast(`BUG-${100 + count} closed: reproduced, fixed, verified.`);
    gsap.timeline({ onComplete: () => b.remove() })
      .to(b, { scaleX: 1.7, scaleY: 0.25, duration: 0.12, ease: 'power2.out' })
      .to(b, { opacity: 0, duration: 0.6, delay: 0.5 });
    setTimeout(spawnBug, 1400);
  }

  function toggle(force?: boolean) {
    on = force ?? !on;
    html.classList.toggle('qa', on);
    badge!.hidden = !on;
    if (on) {
      if (!lite) window.addEventListener('mousemove', onMove);
      spawnBug();
      toast('QA mode on. Inspect anything, squash the bug.');
    } else {
      window.removeEventListener('mousemove', onMove);
      hovered?.classList.remove('qa-hover');
      hovered = null;
      tip!.hidden = true;
      if (bug) { gsap.killTweensOf(bug); bug.remove(); bug = null; }
    }
  }

  $('#qa-exit')?.addEventListener('click', () => toggle(false));
  return { toggle, isOn: () => on };
}

/* ---------- command palette ---------- */
type Cmd = { label: string; group: string; hint?: string; run: () => void };

function initPalette(core: Core | null, reduced: boolean, qa: ReturnType<typeof initQA>) {
  const root = $('#palette');
  const input = $<HTMLInputElement>('#pal-input');
  const list = $('#pal-list');
  const box = $('.pal-box');
  const dataEl = document.getElementById('palette-data');
  if (!root || !input || !list || !box || !dataEl) return;
  const data = JSON.parse(dataEl.textContent || '{}') as {
    sections: { id: string; label: string }[]; projects: { id: string; title: string }[];
    email: string; cv: string; linkedin: string; github: string;
  };

  const go = (id: string, label: string) => {
    if (core) core.goTo(`#${id}`, undefined, label);
    else document.getElementById(id)?.scrollIntoView({ behavior: 'auto' });
  };

  const cmds: Cmd[] = [
    ...data.sections.map((s) => ({ label: s.label, group: 'Go to', hint: 'Section', run: () => go(s.id, s.label) })),
    ...data.projects.map((p) => ({ label: p.title, group: 'Projects', hint: 'Case study', run: () => { location.href = `/projects/${p.id}/`; } })),
    { label: 'Toggle light / dark theme', group: 'Actions', run: () => $('#theme')?.click() },
    { label: 'Copy my email', group: 'Actions', hint: data.email, run: async () => { try { await navigator.clipboard.writeText(data.email); } catch { /* blocked */ } toast('Email copied. Talk soon!'); } },
    { label: 'Download my CV', group: 'Actions', run: () => { const a = document.createElement('a'); a.href = data.cv; a.download = ''; a.click(); } },
    { label: 'Open LinkedIn', group: 'Actions', run: () => window.open(data.linkedin, '_blank', 'noopener') },
    { label: 'Open GitHub', group: 'Actions', run: () => window.open(data.github, '_blank', 'noopener') },
    { label: 'Toggle QA mode', group: 'Fun', hint: 'Press Q', run: () => qa.toggle() },
    { label: lite ? 'Switch to full effects' : 'Switch to lite mode', group: 'Fun', hint: 'Reloads the page', run: () => setLite(!lite) },
  ];

  let shown: Cmd[] = cmds;
  let active = 0;
  let isOpen = false;
  let returnTo: HTMLElement | null = null;

  const render = () => {
    list.innerHTML = '';
    let lastGroup = '';
    shown.forEach((c, i) => {
      if (c.group !== lastGroup) {
        lastGroup = c.group;
        const h = document.createElement('li');
        h.className = 'pal-group';
        h.setAttribute('role', 'presentation');
        h.textContent = c.group;
        list.appendChild(h);
      }
      const li = document.createElement('li');
      li.className = 'pal-item' + (i === active ? ' on' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      li.innerHTML = `<span></span><em></em>`;
      (li.children[0] as HTMLElement).textContent = c.label;
      (li.children[1] as HTMLElement).textContent = c.hint ?? '';
      li.addEventListener('mousemove', () => { if (active !== i) { active = i; render(); } });
      li.addEventListener('click', () => run(c));
      list.appendChild(li);
    });
    if (!shown.length) list.innerHTML = '<li class="pal-empty">Nothing matches. Try “skills” or “theme”.</li>';
    list.querySelector('.on')?.scrollIntoView({ block: 'nearest' });
  };

  const filter = () => {
    const q = input.value.trim().toLowerCase();
    shown = !q
      ? cmds
      : cmds
          .filter((c) => q.split(/\s+/).every((w) => `${c.label} ${c.group}`.toLowerCase().includes(w)))
          .sort((a, b) => Number(b.label.toLowerCase().startsWith(q)) - Number(a.label.toLowerCase().startsWith(q)));
    active = 0;
    render();
  };

  function open() {
    if (isOpen) return;
    isOpen = true;
    returnTo = document.activeElement as HTMLElement | null;
    input.value = '';
    filter();
    root!.hidden = false;
    core?.lenis.stop();
    if (!reduced) {
      gsap.fromTo('#pal-scrim', { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(box, { y: -24, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'power4.out' });
      gsap.from('.pal-item', { y: 10, opacity: 0, duration: 0.35, stagger: 0.015, ease: 'power3.out', delay: 0.08 });
    }
    input.focus();
  }

  function close(restore = true) {
    if (!isOpen) return;
    isOpen = false;
    const done = () => { root!.hidden = true; core?.lenis.start(); if (restore) returnTo?.focus?.({ preventScroll: true }); };
    if (reduced) { done(); return; }
    gsap.to(box, { y: -16, scale: 0.97, opacity: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to('#pal-scrim', { opacity: 0, duration: 0.2, onComplete: done });
  }

  function run(c: Cmd) {
    close(false);
    setTimeout(() => c.run(), reduced ? 0 : 230);
  }

  input.addEventListener('input', filter);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(1, shown.length); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(1, shown.length); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) run(shown[active]); }
    else if (e.key === 'Tab') { e.preventDefault(); input.focus(); } // keep focus inside the dialog
  });
  $('#pal-scrim')?.addEventListener('click', () => close());
  $('#pal-open')?.addEventListener('click', open);

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); isOpen ? close() : open(); return; }
    if (e.key === 'Escape' && isOpen) { close(); return; }
    if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/' && !isOpen) { e.preventDefault(); open(); }
  });
}

/* ---------- footer clock ---------- */
function initClock() {
  const els = ['clock'].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Colombo' });
  const tick = () => { const now = fmt.format(new Date()); els.forEach((el) => { el.textContent = now; }); };
  tick();
  setInterval(tick, 15000);
}

/* hero "Email me": copies the address and says so */
function initHeroMail() {
  const btn = document.getElementById('hero-mail');
  const text = document.getElementById('hero-mail-text');
  if (!btn || !text) return;
  let busy = false;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.email ?? ''); } catch { /* blocked: still show feedback */ }
    if (busy) return;
    busy = true;
    text.textContent = 'Copied!';
    toast('Email copied. Talk soon!');
    setTimeout(() => { text.textContent = 'Email me'; busy = false; }, 1600);
  });
}

export function initExtras(core: Core | null, reduced: boolean) {
  const qa = initQA(reduced);
  initPalette(core, reduced, qa);
  initClock();
  initHeroMail();

  /* Q toggles QA mode; the Konami code does too */
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  window.addEventListener('keydown', (e) => {
    if (typing(e.target)) return;
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'q') qa.toggle();
    pos = e.key === code[pos] ? pos + 1 : e.key === code[0] ? 1 : 0;
    if (pos === code.length) { pos = 0; qa.toggle(); }
  });
}
