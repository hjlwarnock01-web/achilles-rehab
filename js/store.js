// localStorage persistence. The phone holds the data.
import { newState, dateKey } from './logic.js';

const KEY = 'achilles-rehab-v2';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newState(dateKey());
    return { ...newState(dateKey()), ...JSON.parse(raw) };
  } catch {
    return newState(dateKey());
  }
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function reset() {
  localStorage.removeItem(KEY);
}
