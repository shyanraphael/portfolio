import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Matter from 'matter-js';
import { cursorApi } from './core';

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

  if (reduced) return { play() {} };

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
    .add(() => { initPhysics(hero); gsap.delayedCall(2.2, nextRole); }, '-=0.5');
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
