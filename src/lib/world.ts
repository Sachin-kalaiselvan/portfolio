/**
 * The 3D world lives at /world (built from world-folio/). The page only needs
 * to know whether to send a first-time visitor there, and how to get back.
 */
const KEY = 'builders-world:v1';

type Mode = '3d' | '2d' | null;

function read(): { mode: Mode } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { mode: v.mode === '3d' || v.mode === '2d' ? v.mode : null };
  } catch {
    return { mode: null };
  }
}

function write(mode: Mode) {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    localStorage.setItem(KEY, JSON.stringify({ ...v, mode }));
  } catch {
    /* storage can be unavailable */
  }
}

/** Spawn names the world understands (see world-folio/sources/Game/Game.js). */
export type WorldSpawn = 'landing' | 'projects' | 'lab' | 'career' | 'social';

export function enterWorld(spawn: WorldSpawn = 'landing') {
  write('3d');
  window.location.href = spawn === 'landing' ? '/world/' : `/world/?spawn=${spawn}`;
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2'));
  } catch {
    return false;
  }
}

/**
 * Runs once on load. "?page" (the world's "View as page" link) means stay on
 * the page from now on. Otherwise a first visit to the home page on a capable
 * device goes to the world.
 */
export function routeFirstVisit() {
  const url = new URL(window.location.href);
  if (url.searchParams.has('page')) {
    write('2d');
    url.searchParams.delete('page');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    return;
  }
  if (url.pathname !== '/' || url.hash) return;
  if (read().mode === '2d') return;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData || !hasWebGL()) return;
  window.location.replace('/world/');
}
