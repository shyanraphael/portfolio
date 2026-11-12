import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import type { Core } from './core';
import { lite } from './env';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MotionPathPlugin);

const $ = <T extends HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ============================================================
   Interactions that work with or without scroll animation
   ============================================================ */

/** Skills: grouped into category cards; hovering a skill shows which projects use it. */
function initSkills(reduced: boolean) {
  const grid = $('#skill-grid');
  if (!grid) return;
  const items = $$('.skill', grid);

  /* water: hover a bubble and a wave travels through the other bubbles, rocking each one as it passes, then calming */
  if (!reduced && !lite) {
    const bubbles = items.map((el) => {
      const pill = el.querySelector('.skill-name') as HTMLElement;
      return {
        pill, cx: 0, cy: 0,
        setX: gsap.quickSetter(pill, 'x', 'px') as (v: number) => void,
        setY: gsap.quickSetter(pill, 'y', 'px') as (v: number) => void,
      };
    });
    type Wave = { ox: number; oy: number; t0: number };
    let waves: Wave[] = [];
    let running = false;
    let lastWave = 0;
    const SPEED = 620; // px per second the wave travels
    const REACH = 760; // px before it has faded out completely
    const AMP = 10; // px a bubble rocks at most
    const LIFE = 2.4; // seconds a wave lives

    const step = () => {
      const now = performance.now() / 1000;
      waves = waves.filter((w) => now - w.t0 < LIFE);
      for (const b of bubbles) {
        let dx = 0;
        let dy = 0;
        for (const w of waves) {
          const vx = b.cx - w.ox;
          const vy = b.cy - w.oy;
          const d = Math.hypot(vx, vy);
          if (d < 1 || d > REACH) continue;
          const tau = now - w.t0 - d / SPEED; // time since the wave front reached this bubble
          if (tau < 0) continue;
          const env = Math.exp(-tau * 2.6) * (1 - d / REACH);
          const disp = Math.sin(tau * 17) * env * AMP; // in and out along the line from the source, like a surface wave
          dx += (vx / d) * disp;
          dy += (vy / d) * disp;
        }
        b.setX(dx);
        b.setY(dy);
      }
      if (!waves.length) { gsap.ticker.remove(step); running = false; }
    };

    const splash = (origin: HTMLElement) => {
      const now = performance.now();
      if (now - lastWave < 260) return;
      lastWave = now;
      /* resting centre of every bubble (the pills sit at their rest position when no wave is passing) */
      for (const b of bubbles) {
        const r = b.pill.getBoundingClientRect();
        const tx = (gsap.getProperty(b.pill, 'x') as number) || 0;
        const ty = (gsap.getProperty(b.pill, 'y') as number) || 0;
        b.cx = r.left + r.width / 2 - tx;
        b.cy = r.top + r.height / 2 - ty;
      }
      const o = origin.querySelector('.skill-name')!.getBoundingClientRect();
      waves.push({ ox: o.left + o.width / 2, oy: o.top + o.height / 2, t0: now / 1000 });
      if (!running) { running = true; gsap.ticker.add(step); }
    };
    items.forEach((el) => el.addEventListener('pointerenter', () => splash(el)));
  }

  /* hover or focus a skill: related skills light up, and the hint names the projects */
  const hint = $('#skill-hint');
  const idleText = hint?.textContent ?? '';
  const titles = new Map<string, string>();
  try {
    for (const p of JSON.parse(document.getElementById('project-data')?.textContent || '[]')) titles.set(p.id, p.title);
  } catch { /* no project data: hint just stays generic */ }
  const ids = (el: HTMLElement) => (el.dataset.proj ?? '').split(' ').filter(Boolean);

  function clearFocus() {
    grid!.classList.remove('has-focus');
    items.forEach((i) => i.classList.remove('rel', 'self'));
    if (hint) hint.textContent = idleText;
  }

  function focusSkill(el: HTMLElement) {
    const mine = ids(el);
    grid!.classList.add('has-focus');
    const related = items.filter((i) => i !== el && i.style.display !== 'none' && ids(i).some((p) => mine.includes(p)));
    items.forEach((i) => { i.classList.toggle('self', i === el); i.classList.toggle('rel', related.includes(i)); });
    if (hint) {
      const nm = el.querySelector('.skill-name')?.textContent ?? '';
      hint.innerHTML = mine.length
        ? `<b>${nm}</b> is used in: ${mine.map((id) => titles.get(id) ?? id).join(', ')}.`
        : `<b>${nm}</b> isn’t tied to one of the projects below, but it’s part of how I work.`;
    }
  }

  items.forEach((el) => {
    el.addEventListener('pointerenter', () => focusSkill(el));
    el.addEventListener('focus', () => focusSkill(el));
    el.addEventListener('click', () => focusSkill(el));
    el.addEventListener('blur', clearFocus);
  });
  grid.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') clearFocus(); });
}

/** Test runner: a sample suite that runs, catches a flaky test, retries and reports. */
function initTests() {
  const rows = $$('.t-row', $('#runner-list')!);
  const btn = $('#run');
  const label = $('#run-label');
  const prog = $('#run-prog');
  const summary = $('#run-summary');
  const count = $('#run-count');
  const clock = $('#run-clock');
  if (!rows.length || !btn || !label || !prog || !summary || !count || !clock) return { autorun() {} };

  let running = false;
  let ran = false;

  const icon = (row: HTMLElement, which: 'idle' | 'spin' | 'ok' | 'no') => {
    (['idle', 'spin', 'ok', 'no'] as const).forEach((k) => {
      gsap.set($(`.${k}`, row), { opacity: k === which ? 1 : 0 });
    });
    if (which === 'ok' || which === 'no') {
      gsap.fromTo($(`.${which} .dr`, row), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.45, ease: 'power2.out' });
    }
  };
  const setState = (row: HTMLElement, s: string) => { row.dataset.state = s; };
  const fmt = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  rows.forEach((r) => icon(r, 'idle'));

  function run() {
    if (running) return;
    running = true;
    ran = true;
    label.textContent = 'Running…';
    summary.textContent = 'Running 6 tests…';
    count.textContent = '';
    gsap.set(prog, { scaleX: 0 });
    rows.forEach((r) => {
      setState(r, 'idle');
      icon(r, 'idle');
      $('.t-time', r)!.textContent = '—';
    });

    const t0 = performance.now();
    const tick = () => { clock.textContent = fmt(performance.now() - t0); };
    gsap.ticker.add(tick);

    let passed = 0;
    let flaky = 0;
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.ticker.remove(tick);
        tick();
        running = false;
        label.textContent = 'Run again';
        summary.innerHTML = `<strong>${passed} passed</strong>${flaky ? ` · ${flaky} flaky, recovered on retry` : ''}`;
        const o = { v: 0 };
        gsap.to(o, { v: passed, duration: 0.8, ease: 'power2.out', onUpdate: () => { count.textContent = `${Math.round(o.v)}/${rows.length}`; } });
      },
    });

    rows.forEach((row) => {
      const ms = Number(row.dataset.ms);
      const isFlaky = row.dataset.flaky === '1';
      const dur = ms / 1000 * 0.55;
      tl.add(() => { setState(row, 'running'); icon(row, 'spin'); });
      if (isFlaky) {
        tl.to({}, { duration: dur * 0.9 });
        tl.add(() => { setState(row, 'fail'); icon(row, 'no'); });
        tl.to({}, { duration: 0.9 });
        tl.add(() => { setState(row, 'running'); icon(row, 'spin'); $('.t-note', row)!.textContent = 'Retry 1 of 1…'; });
        tl.to({}, { duration: dur * 0.7 });
        tl.add(() => { flaky += 1; });
      } else {
        tl.to({}, { duration: dur });
      }
      tl.add(() => {
        setState(row, 'pass');
        icon(row, 'ok');
        passed += 1;
        $('.t-time', row)!.textContent = fmt(ms);
        gsap.to(prog, { scaleX: passed / rows.length, duration: 0.5, ease: 'power3.out' });
        gsap.fromTo(row, { backgroundColor: 'color-mix(in srgb, var(--ok) 16%, transparent)' }, { backgroundColor: 'transparent', duration: 0.9 });
      });
    });
  }

  btn.addEventListener('click', run);
  return { autorun() { if (!ran) run(); } };
}

/** Project sheet: the card grows into a full panel and shrinks back. */
function initSheet(core: Core | null) {
  const sheet = $('#sheet');
  const scrim = $('#scrim');
  const closeBtn = $('#sheet-close');
  const dataEl = document.getElementById('project-data');
  if (!sheet || !scrim || !closeBtn || !dataEl) return;
  const projects: { id: string; title: string; kind: string; detail: string; stack: string[]; links: { label: string; href: string }[]; cover: string }[] = JSON.parse(dataEl.textContent || '[]');

  let origin: HTMLElement | null = null;
  let openId: string | null = null;

  const targetRect = () => {
    const w = Math.min(880, innerWidth - 24);
    const h = Math.min(innerHeight * 0.88, 800);
    return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
  };

  function open(card: HTMLElement) {
    const p = projects.find((x) => x.id === card.dataset.project);
    if (!p || openId) return;
    openId = p.id;
    origin = card;
    $('#sheet-art')!.innerHTML = p.cover;
    $('#sheet-kind')!.textContent = p.kind;
    $('#sheet-title')!.textContent = p.title;
    $('#sheet-detail')!.textContent = p.detail;
    $('#sheet-stack')!.innerHTML = p.stack.map((s) => `<li class="chip">${s}</li>`).join('');
    $('#sheet-links')!.innerHTML = p.links
      .map((l) => `<a class="btn" href="${l.href}" target="_blank" rel="noopener noreferrer">${l.label}</a>`).join('')
      + `<a class="btn ghost" href="/projects/${p.id}/" data-full="${p.id}">Full case study</a>`;
    $('#sheet-links [data-full]')!.addEventListener('click', () => {
      /* name the sheet's artwork so the browser morphs it into the next page's artwork */
      $('#sheet-art')!.style.viewTransitionName = `art-${p.id}`;
    });
    sheet!.classList.add('open');
    core?.lenis.stop();

    const r = card.getBoundingClientRect();
    const t = targetRect();
    gsap.set(sheet, { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: 26 });
    gsap.set('#sheet-art, .sheet-body > *, #sheet-close', { opacity: 0 });
    gsap.to(scrim, { opacity: 1, duration: 0.4, onStart: () => { scrim!.style.pointerEvents = 'auto'; } });
    gsap.timeline()
      .to(sheet, { ...t, borderRadius: 28, duration: 0.75, ease: 'power4.inOut' })
      .to('#sheet-art, #sheet-close', { opacity: 1, duration: 0.4 }, '-=0.3')
      .fromTo('.sheet-body > *', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out' }, '-=0.3');
    gsap.fromTo('#sheet-art .d', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, stagger: 0.06, ease: 'power2.inOut', delay: 0.5 });
    const sBus = $('#sheet-art .bus');
    const sRoute = $('#sheet-art .route');
    if (sBus && sRoute) {
      gsap.to(sBus, { motionPath: { path: sRoute as unknown as SVGPathElement, align: sRoute as unknown as SVGPathElement, alignOrigin: [0.5, 0.5] }, duration: 5, repeat: -1, ease: 'none' });
    }
    closeBtn!.focus({ preventScroll: true });
  }

  function close() {
    if (!openId || !origin) return;
    const r = origin.getBoundingClientRect();
    const card = origin;
    gsap.timeline({ onComplete: () => { sheet!.classList.remove('open'); openId = null; core?.lenis.start(); card.focus({ preventScroll: true }); } })
      .to('#sheet-art, .sheet-body > *, #sheet-close', { opacity: 0, duration: 0.25 })
      .to(sheet, { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: 26, duration: 0.6, ease: 'power4.inOut' }, '-=0.1')
      .to(scrim, { opacity: 0, duration: 0.4, onComplete: () => { scrim!.style.pointerEvents = 'none'; } }, '-=0.5');
  }

  $$('.pcard').forEach((c) => {
    c.addEventListener('click', () => open(c));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); } });
  });
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/** Contact: copy the email with a burst of confetti. */
function initContact() {
  const btn = $('#mail');
  const text = $('#mail-text');
  if (!btn || !text) return;
  const email = btn.dataset.email!;
  const colors = ['#ff8d57', '#8b9bff', '#3fdca6', '#ffffff'];
  let busy = false;

  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(email); } catch { /* clipboard blocked: still show feedback */ }
    if (busy) return;
    busy = true;
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.className = 'burst';
      s.style.background = colors[i % colors.length];
      btn.appendChild(s);
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
      const d = 70 + Math.random() * 90;
      gsap.fromTo(s, { x: 0, y: 0, scale: 1, opacity: 1 }, {
        x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 0, rotate: Math.random() * 360, duration: 0.9 + Math.random() * 0.4,
        ease: 'power3.out', onComplete: () => s.remove(),
      });
    }
    gsap.timeline({ onComplete: () => { busy = false; } })
      .to(text, { yPercent: -120, opacity: 0, duration: 0.25, ease: 'power2.in' })
      .add(() => { text.textContent = 'Copied. Talk soon!'; })
      .fromTo(text, { yPercent: 120 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power3.out' })
      .to(text, { yPercent: -120, opacity: 0, duration: 0.25, ease: 'power2.in' }, '+=1.4')
      .add(() => { text.textContent = email; })
      .fromTo(text, { yPercent: 120 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  });
}

/* ============================================================
   Scroll-driven choreography (skipped when reduced motion is on)
   ============================================================ */

/** Wrap each word of an element (keeping inline children like counters whole) so it can light up on scroll. */
function wordify(el: HTMLElement) {
  const out: HTMLElement[] = [];
  const nodes = [...el.childNodes];
  el.textContent = '';
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const tok of (node.textContent ?? '').split(/(\s+)/)) {
        if (!tok) continue;
        if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(' ')); continue; }
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = tok;
        el.appendChild(s);
        out.push(s);
      }
    } else if (node instanceof HTMLElement) {
      node.classList.add('w');
      el.appendChild(node);
      out.push(node);
    }
  }
  return out;
}

function initScroll() {
  /* headings: lines mask, characters rise */
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines,chars', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.chars, {
        yPercent: 110, rotate: 5, duration: 1, ease: 'power4.out', stagger: 0.018,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      }),
    });
  });

  /* generic reveal */
  $$('[data-reveal]').forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* marquees: speed and lean follow scroll velocity */
  const lenisVel = () => (window as unknown as { __lenis?: { velocity: number } }).__lenis?.velocity ?? 0;
  $$('.marquee-track').forEach((track) => {
    const reverse = track.dataset.dir === '-1';
    const pct = 100 / Number(track.dataset.copies ?? 3);
    const loop = reverse
      ? gsap.fromTo(track, { xPercent: -pct }, { xPercent: 0, ease: 'none', duration: 36, repeat: -1 })
      : gsap.to(track, { xPercent: -pct, ease: 'none', duration: 32, repeat: -1 });
    const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' });
    let dir = 1;
    let speed = 1;
    gsap.ticker.add(() => {
      const v = lenisVel();
      if (Math.abs(v) > 0.05) dir = v > 0 ? 1 : -1;
      speed += (dir * (1 + Math.min(Math.abs(v) * 0.35, 10)) - speed) * 0.08;
      loop.timeScale(speed);
      skewTo(gsap.utils.clamp(-12, 12, -v * 0.5));
    });
  });

  /* about: the statement lights up word by word; counters run when they appear */
  const st = $('[data-words]');
  if (st) {
    const words = wordify(st);
    gsap.to(words, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 82%', end: 'bottom 50%', scrub: true } });
  }
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); }, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  /* giant background words drift sideways */
  $$('.bgword').forEach((w) => {
    gsap.fromTo(w, { xPercent: 6 }, { xPercent: -34, ease: 'none', scrollTrigger: { trigger: w.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* skills lab: chips pop in the first time it appears */
  gsap.from('.cat-card', {
    y: 60, opacity: 0, rotate: 2, duration: 0.9, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '#skill-grid', start: 'top 85%', once: true },
  });
  gsap.from('.skill', {
    y: 14, opacity: 0, scale: 0.85, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.02, delay: 0.25,
    scrollTrigger: { trigger: '#skill-grid', start: 'top 85%', once: true },
  });

  /* experience: each card scales back as the next one stacks on top */
  const cards = $$('.xp-card');
  cards.forEach((card) => {
    gsap.to(card, { '--bar': 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 85%', end: 'top 35%', scrub: true } });
  });
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: 0.93 - i * 0.01, '--dim': 0.6, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top 80%', end: 'top 20%', scrub: true },
    });
  });

  /* projects: pinned horizontal scroll on desktop */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const section = $('.work');
    const rail = $('.rail');
    if (!section || !rail) return;
    const distance = () => rail.scrollWidth - window.innerWidth + 64;
    const slide = gsap.to(rail, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: section, pin: true, scrub: 1, start: 'top top', anticipatePin: 1, end: () => '+=' + distance(), invalidateOnRefresh: true },
    });
    gsap.to('.work-bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), scrub: true, invalidateOnRefresh: true } });
    $$('.pcard').forEach((card) => {
      gsap.fromTo(card, { scale: 0.9, opacity: 0.4 }, {
        scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left 98%', end: 'left 62%', scrub: true },
      });
    });
  });
  mm.add('(max-width: 767px)', () => {
    $$('.pcard').forEach((card) => {
      gsap.from(card, { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%', once: true } });
    });
  });

  /* project covers: lines draw in, hover replays, the bus actually drives its route */
  $$('.pcard').forEach((card) => {
    const lines = $$('.d', card);
    const draw = () => gsap.fromTo(lines, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, stagger: 0.07, ease: 'power2.inOut', overwrite: true });
    gsap.set(lines, { drawSVG: '0%' });
    ScrollTrigger.create({ trigger: card, start: 'top 95%', once: true, onEnter: draw });
    if (finePointer) card.addEventListener('mouseenter', draw);
    const bus = $('.bus', card);
    const route = $('.route', card);
    if (bus && route) {
      gsap.to(bus, { motionPath: { path: route as unknown as SVGPathElement, align: route as unknown as SVGPathElement, alignOrigin: [0.5, 0.5] }, duration: 5, repeat: -1, ease: 'none' });
    }
  });

  /* contact: the lime-free blue panel unfolds as it arrives */
  gsap.fromTo('.contact', { scale: 0.92, borderTopLeftRadius: '5rem', borderTopRightRadius: '5rem' }, {
    scale: 1, borderTopLeftRadius: '0rem', borderTopRightRadius: '0rem', ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top 98%', end: 'top 30%', scrub: true },
  });
}

export function initSections(core: Core | null, reduced: boolean) {
  if (core) (window as unknown as { __lenis?: unknown }).__lenis = core.lenis;
  initSkills(reduced);
  const tests = initTests();
  initSheet(core);
  initContact();

  if (reduced) {
    $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count ?? ''; });
    return;
  }

  initScroll();
  /* run the sample suite once, the first time it scrolls into view */
  ScrollTrigger.create({ trigger: '.runner', start: 'top 70%', once: true, onEnter: () => tests.autorun() });
}
