/** Lite mode turns off the heaviest effects (physics, cursor ripple, big tile grid) on weaker devices.
 *  It switches on automatically for low-end hardware or data-saver, and can be forced from the command palette. */
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

function readPref(): 'on' | 'off' | null {
  try {
    const v = localStorage.getItem('lite');
    return v === 'on' || v === 'off' ? v : null;
  } catch {
    return null;
  }
}

const pref = readPref();
const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || !!nav.connection?.saveData;

export const lite = pref ? pref === 'on' : weak;
if (lite) document.documentElement.classList.add('lite');

export function setLite(on: boolean) {
  try { localStorage.setItem('lite', on ? 'on' : 'off'); } catch { /* storage blocked: fine */ }
  location.reload();
}
