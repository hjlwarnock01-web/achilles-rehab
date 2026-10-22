// Persistence. localStorage on this device; on the claude.ai page also the
// artifact's db, so the progress survives a cleared browser. Newest save wins.
import { newState, dateKey } from './logic.js';

const KEY = 'achilles-rehab-v2';
const DOC = 'rehab/state';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newState(dateKey());
    return { ...newState(dateKey()), ...JSON.parse(raw) };
  } catch {
    return newState(dateKey());
  }
}

let dbPromise = null;
function db() {
  if (!dbPromise) dbPromise = window.claude?.use ? window.claude.use('db').catch(() => null) : Promise.resolve(null);
  return dbPromise;
}

export function save(state) {
  state.savedAt = Date.now();
  const json = JSON.stringify(state);
  try { localStorage.setItem(KEY, json); } catch { /* storage blocked */ }
  db().then((d) => d && d.doc(DOC).set(JSON.parse(json))).catch(() => {});
}

// The db copy, if it is newer than `local`. Otherwise null.
export async function loadRemote(local) {
  try {
    const d = await db();
    if (!d) return null;
    const snap = await d.doc(DOC).get();
    if (!snap.exists) return null;
    const remote = snap.data();
    if ((remote.savedAt || 0) <= (local.savedAt || 0)) return null;
    return { ...newState(dateKey()), ...remote };
  } catch {
    return null;
  }
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
