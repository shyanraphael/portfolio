import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Matter from 'matter-js';
import { cursorApi } from './core';
import { lite } from './env';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Query } = Matter;

/** The skill chips fall into the hero as real physical objects you can grab and throw. */
function initPhysics(hero: HTMLElement) {
  const field = hero.querySelector<HTMLElement>('.field');
  if (!field) return () => {};
  const chips = [...field.querySelectorAll<HTMLElement>('.pchip')];

  const engine = Engine.create({ gravity: { x: 0, y: 1.05 } });
  const thick = 300;
  let W = hero.clientWidth;
  let H = hero.clientHeight;

  const floor = Bodies.rectangle(W / 2, H + thick / 2, W * 4, thick, { isStatic: true });
  const left = Bodies.rectangle(-thick / 2, H / 2, thick, H * 6, { isStatic: true });
  const right = Bodies.rectangle(W + thick / 2, H / 2, thick, H * 6, { isStatic: true });
  Composite.add(engine.world, [floor, left, right]);

  const items = chips.map((el, i) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const body = Bodies.rectangle(
      w + Math.random() * Math.max(10, W - w * 2),
      -80 - i * 95,
      w, h,
      { chamfer: { radius: h / 2 }, restitution: 0.38, friction: 0.22, frictionAir: 0.012, density: 0.002, angle: (Math.random() - 0.5) * 0.9 },
    );
    return { el, body, w, h };
  });
  Composite.add(engine.world, items.map((i) => i.body));
  chips.forEach((c) => (c.style.opacity = '1'));

  /* grab and throw: mouse only, so touch scrolling still works */
  const mouse = Mouse.create(hero);
  const m = mouse as unknown as { element: HTMLElement; mousewheel: EventListener };
  m.element.removeEventListener('mousewheel', m.mousewheel);
  m.element.removeEventListener('DOMMouseScroll', m.mousewheel);
  m.element.removeEventListener('wheel', m.mousewheel);
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, damping: 0.1, render: { visible: false } } });
  Composite.add(engine.world, mc);
  hero.querySelectorAll('a, button').forEach((el) => el.addEventListener('mousedown', (e) => e.stopPropagation()));

  const bodies = items.map((i) => i.body);
  let hovering = false;
  hero.addEventListener('mousemove', () => {
    const hit = Query.point(bodies, mouse.position).length > 0 || !!mc.body;
    if (hit !== hovering) { hovering = hit; cursorApi.set(hit ? 'Drag' : null); }
  });
  hero.addEventListener('mouseleave', () => { hovering = false; cursorApi.set(null); });

  let active = true;
  ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (s) => { active = s.isActive; } });

  gsap.ticker.add((_t, dt) => {
    if (!active) return;
    Engine.update(engine, Math.min(dt, 32));
    for (const { el, body, w, h } of items) {
      el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
    }
  });

  let rt: number;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => {
      W = hero.clientWidth;
      H = hero.clientHeight;
      Body.setPosition(floor, { x: W / 2, y: H + thick / 2 });
      Body.setPosition(left, { x: -thick / 2, y: H / 2 });
      Body.setPosition(right, { x: W + thick / 2, y: H / 2 });
      for (const b of bodies) {
        if (b.position.x > W - 20) Body.setPosition(b, { x: W - 60, y: b.position.y - 30 });
      }
    }, 150);
  });

  /* when the page scrolls fast, the chips get a little shove */
  let last = window.scrollY;
  ScrollTrigger.create({
    trigger: hero, start: 'top bottom', end: 'bottom top',
    onUpdate: () => {
      const d = window.scrollY - last;
      last = window.scrollY;
      if (Math.abs(d) > 40) {
        const b = bodies[Math.floor(Math.random() * bodies.length)];
        Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * 0.02, y: -0.03 });
      }
    },
  });

  return () => {};
}

/* ---------- live snippet: a sample test and an endpoint type themselves out, one after the other ---------- */
const SNIPPETS = [
  {
    file: 'sample.spec.ts',
    code: "test('candidate list filters by skill', async ({ page }) => {\n  await page.goto('/candidates');\n  await page.getByLabel('Skill').selectOption('Playwright');\n  await expect(page.getByRole('row')).toHaveCount(3);\n});",
    result: '✓ 1 passed (1.1s)',
  },
  {
    file: 'SkillsEndpoint.cs',
    code: 'app.MapGet("/api/skills", async (Db db) =>\n{\n    var skills = await db.Skills.ToListAsync();\n    return Results.Ok(skills);\n});',
    result: '200 OK · 12 ms',
  },
];

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* one pass, so a keyword inside a string never gets coloured twice */
const highlight = (code: string) =>
  escHtml(code).replace(
    /(\/\/.*)|('[^']*'|"[^"]*")|\b(test|async|await|expect|page|const|var|return|app|Results)\b/g,
    (_m, c, s, k) => (c ? `<span class="c">${c}</span>` : s ? `<span class="s">${s}</span>` : `<span class="k">${k}</span>`),
  );

function initSnippet(reduced: boolean) {
  const out = document.getElementById('snip-code');
  const file = document.getElementById('snip-file');
  if (!out || !file) return { start() {} };
  let idx = 0;

  const render = (s: (typeof SNIPPETS)[number], n: number, done: boolean) => {
    out.innerHTML = highlight(s.code.slice(0, n)) + (done ? `\n\n<span class="ok">${escHtml(s.result)}</span>` : '');
  };

  const play = () => {
    const s = SNIPPETS[idx];
    file.textContent = s.file;
    const o = { n: 0 };
    gsap.timeline({ onComplete: () => { idx = (idx + 1) % SNIPPETS.length; play(); } })
      .to(o, { n: s.code.length, duration: s.code.length * 0.026, ease: 'none', onUpdate: () => render(s, Math.floor(o.n), false) })
      .add(() => render(s, s.code.length, true))
      .to({}, { duration: 3.4 })
      .to(o, { n: 0, duration: 0.5, ease: 'power1.in', onUpdate: () => render(s, Math.floor(o.n), false) });
  };

  return {
    start() {
      if (reduced) { file.textContent = SNIPPETS[0].file; render(SNIPPETS[0], SNIPPETS[0].code.length, true); return; }
      play();
    },
  };
}

/* ---------- orb: a wireframe icosahedron (and a smaller one inside) turning in 3D, leaning toward the cursor ---------- */
function initOrb(hero: HTMLElement, reduced: boolean) {
  const cv = document.getElementById('orb') as HTMLCanvasElement | null;
  if (!cv || lite) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  const t = (1 + Math.sqrt(5)) / 2;
  const verts = ([[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]] as number[][])
    .map((v) => { const l = Math.hypot(v[0], v[1], v[2]); return v.map((x) => x / l); });
  const edges: [number, number][] = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(verts[i][0] - verts[j][0], verts[i][1] - verts[j][1], verts[i][2] - verts[j][2]);
      if (d < 1.06) edges.push([i, j]);
    }
  }

  let size = 0;
  let dpr = 1;
  const fit = () => {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = r.width;
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
  };
  fit();
  new ResizeObserver(() => { fit(); if (reduced) draw(0); }).observe(cv);

  let accent = '#2b45f2';
  let spark = '#e8480c';
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    accent = cs.getPropertyValue('--accent').trim() || accent;
    spark = cs.getPropertyValue('--spark').trim() || spark;
  };
  readColors();
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const target = { x: 0, y: 0 };
  const lean = { x: 0, y: 0 };
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5;
      target.y = (e.clientY - r.top) / r.height - 0.5;
    });
  }

  function draw(time: number) {
    lean.x += (target.x - lean.x) * 0.06;
    lean.y += (target.y - lean.y) * 0.06;
    const w = cv!.width;
    ctx!.clearRect(0, 0, w, cv!.height);
    ctx!.lineCap = 'round';
    const layers = [
      { s: 0.4, speed: 1, color: accent, alpha: 0.85, width: 1.6 },
      { s: 0.22, speed: -1.5, color: spark, alpha: 0.7, width: 1.4 },
    ];
    for (const L of layers) {
      const ay = time * 0.22 * L.speed + lean.x * 1.6;
      const ax = time * 0.15 * L.speed + lean.y * 1.6;
      const pts = verts.map(([x, y, z]) => {
        const x1 = x * Math.cos(ay) + z * Math.sin(ay);
        const z1 = -x * Math.sin(ay) + z * Math.cos(ay);
        const y2 = y * Math.cos(ax) - z1 * Math.sin(ax);
        const z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
        const persp = 3 / (3 - z2);
        return { x: w / 2 + x1 * L.s * w * persp, y: cv!.height / 2 + y2 * L.s * w * persp, z: z2 };
      });
      ctx!.strokeStyle = L.color;
      ctx!.lineWidth = L.width * dpr;
      for (const [i, j] of edges) {
        ctx!.globalAlpha = L.alpha * (0.35 + 0.65 * ((pts[i].z + pts[j].z + 2) / 4)); // far edges fade, near ones glow
        ctx!.beginPath();
        ctx!.moveTo(pts[i].x, pts[i].y);
        ctx!.lineTo(pts[j].x, pts[j].y);
        ctx!.stroke();
      }
      ctx!.fillStyle = L.color;
      for (const p of pts) {
        ctx!.globalAlpha = L.alpha * (0.5 + 0.5 * ((p.z + 1) / 2));
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 2.6 * dpr, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    ctx!.globalAlpha = 1;
  }

  if (reduced) { draw(0.6); return; }
  let visible = true;
  ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (s) => { visible = s.isActive; } });
  gsap.ticker.add((time) => { if (visible) draw(time); });
}

/** The letters of the name lean away from the pointer as it passes close by. */
function initCharReact(hero: HTMLElement, chars: Element[]) {
  const setters = chars.map((c) => ({
    y: gsap.quickTo(c, 'skewX', { duration: 0.5, ease: 'power3' }),
    r: gsap.quickTo(c, 'rotation', { duration: 0.5, ease: 'power3' }),
  }));
  const radius = 190;
  hero.addEventListener('mousemove', (e) => {
    chars.forEach((c, i) => {
      const b = c.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2);
      const dy = e.clientY - (b.top + b.height / 2);
      const d = Math.hypot(dx, dy);
      const k = d < radius ? 1 - d / radius : 0;
      setters[i].y(-k * 16 * Math.sign(dx || 1)); // skew away from the pointer (the name sits in a mask, so no vertical travel)
      setters[i].r(-k * 7 * Math.sign(dx || 1));
      void dy;
    });
  });
  hero.addEventListener('mouseleave', () => setters.forEach((s) => { s.y(0); s.r(0); }));
}

export function initHero(reduced: boolean) {
  const hero = document.getElementById('top') as HTMLElement;
  const name = hero.querySelector('.hero-name') as HTMLElement;

  /* the dot grid lights up around the pointer */
  const dots = hero.querySelector<HTMLElement>('.dots');
  if (dots && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      dots.style.setProperty('--mx', `${e.clientX - r.left}px`);
      dots.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }

  const snippet = initSnippet(reduced);
  initOrb(hero, reduced);
  if (reduced) { snippet.start(); return { play() {} }; }

  /* the facts count up when the intro reaches them */
  const counters = [...hero.querySelectorAll<HTMLElement>('[data-hcount]')];
  counters.forEach((el) => { el.textContent = '0'; });
  const countUp = () => counters.forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: Number(el.dataset.hcount), duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
  });

  const split1 = SplitText.create(name.querySelector('.l1') as HTMLElement, { type: 'chars' });
  const split2 = SplitText.create(name.querySelector('.l2') as HTMLElement, { type: 'chars' });
  const chars = [...split1.chars, ...split2.chars];
  gsap.set(chars, { yPercent: 115, rotate: 7 });

  /* the role line scrambles from one title to the next */
  const swap = document.getElementById('swap');
  const roles: string[] = swap ? JSON.parse(swap.dataset.roles ?? '[]') : [];
  let ri = 0;
  const nextRole = () => {
    if (!swap || roles.length < 2) return;
    ri = (ri + 1) % roles.length;
    gsap.to(swap, {
      duration: 1.1,
      scrambleText: { text: roles[ri], chars: 'abcdefghijklmnopqrstuvwxyz', speed: 0.6, revealDelay: 0.1 },
    });
    gsap.delayedCall(3.4, nextRole);
  };

  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
  intro
    .to(chars, { yPercent: 0, rotate: 0, duration: 1.25, stagger: 0.045 })
    .to('[data-hero-in]', { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, '-=0.8')
    .from('.nav-inner', { y: -40, opacity: 0, duration: 0.8 }, '-=1')
    .add(() => {
      if (!lite) initPhysics(hero);
      gsap.delayedCall(2.2, nextRole);
      snippet.start();
      countUp();
      if (!lite && window.matchMedia('(pointer: fine)').matches) {
        initCharReact(hero, chars);
        /* the role line drifts a little toward the pointer */
        const role = hero.querySelector('.hero-role');
        if (role) {
          const rx = gsap.quickTo(role, 'x', { duration: 0.7, ease: 'power3' });
          hero.addEventListener('mousemove', (e) => rx((e.clientX / innerWidth - 0.5) * 22));
          hero.addEventListener('mouseleave', () => rx(0));
        }
        /* the portrait and the disc behind it slide a little in opposite directions: depth */
        const img = hero.querySelector('.hero-portrait img');
        const disc = hero.querySelector('.portrait-disc');
        if (img && disc) {
          const ix = gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power3' });
          const dx = gsap.quickTo(disc, 'x', { duration: 0.8, ease: 'power3' });
          hero.addEventListener('mousemove', (e) => { const k = e.clientX / innerWidth - 0.5; ix(k * -20); dx(k * 16); });
          hero.addEventListener('mouseleave', () => { ix(0); dx(0); });
        }
      }
    }, '-=0.5');
  gsap.set('[data-hero-in]', { y: 24 });

  /* hero stays pinned while the next section slides over it */
  ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
  gsap.to('.hero-copy', {
    yPercent: -10, scale: 0.9, opacity: 0.2, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.cover', {
    borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'none',
    scrollTrigger: { trigger: '.cover', start: 'top 60%', end: 'top top', scrub: true },
  });

  return { play: () => intro.play() };
}
