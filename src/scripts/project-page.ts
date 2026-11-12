import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { initTheme } from './theme';

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);

initTheme();

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduced) {
  /* the artwork is morphed in by the page transition; its lines draw once it lands */
  gsap.fromTo('.pj-art .d', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, stagger: 0.07, ease: 'power2.inOut', delay: 0.25 });
  gsap.from('.pj-body > *', { y: 28, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 0.3 });
  gsap.from('.pj-next', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.7 });

  const bus = document.querySelector('.pj-art .bus');
  const route = document.querySelector('.pj-art .route');
  if (bus && route) {
    gsap.to(bus, {
      motionPath: { path: route as unknown as SVGPathElement, align: route as unknown as SVGPathElement, alignOrigin: [0.5, 0.5] },
      duration: 5, repeat: -1, ease: 'none',
    });
  }
}
