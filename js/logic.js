// State transitions. Pure functions over a plain state object. No DOM.
//
// Flow: open the app → today's day → tap each exercise → day done.
// Next calendar day: if yesterday was training, one tap "Fine" or "Sore".
//   Fine → next day.  Sore → easy day today, then repeat the same day.
// Block ends check the test: not passed → repeat the block's last week.
// Heavy block tests weekly: passed → skip to the next block early.
import { buildDay } from './program.js';

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function newState(today) {
  return {
    v: 2,
    day: 1,
    ticks: {},          // item index -> true, for the current day
    doneDate: null,     // date the current day was finished
    askFeel: false,     // waiting for Fine/Sore about the last training day
    easyDate: null,     // date that is an easy day
    easyTicks: {},
    soreStreak: 0,
    tests: [],          // { date, day, type, L, R }
    message: null,      // one-off note shown at the top
    startDate: today,
  };
}

export const EASY_DAY = [
  { ex: 'hold', sets: 4, amount: 30, unit: 's' },
  { ex: 'balance', sets: 2, amount: 30, unit: 's', each: true },
  { ex: 'walk', sets: 1, amount: 15, unit: 'min' },
];

export function latestTest(state, type) {
  for (let i = state.tests.length - 1; i >= 0; i--) if (state.tests[i].type === type) return state.tests[i];
  return null;
}

export function gatePasses(state, gate) {
  const t = latestTest(state, gate.test);
  if (!t) return { ok: false, why: 'No test logged.' };
  const L = Number(t.L);
  const R = Number(t.R);
  if (!(L >= gate.min && R >= gate.min)) {
    return { ok: false, why: `You need ${gate.min} on each leg. Last test: right ${R}, left ${L}.` };
  }
  const hi = Math.max(L, R);
  const gap = Math.round((Math.abs(L - R) / hi) * 100);
  if (gap > gate.sym) {
    return { ok: false, why: `The legs need to be within ${gate.sym}% of each other. Last test: right ${R}, left ${L}.` };
  }
  return { ok: true, why: '' };
}

function advance(state) {
  const d = buildDay(state.day);
  if (d.gate) {
    const g = gatePasses(state, d.gate);
    if (d.skipTo) {
      // Weekly test inside a block: pass → skip ahead, miss → carry on.
      state.ticks = {};
      if (g.ok) {
        state.day = d.skipTo;
        state.message = 'Test passed. Skipping ahead to the jump training.';
      } else {
        state.day += 1;
        state.message = `${g.why} Keep going, test again next week.`;
      }
      return state;
    }
    if (!g.ok) {
      state.day = d.repeatFrom;
      state.message = `Not quite ready for the next stage. ${g.why} Repeating the last week.`;
      state.ticks = {};
      return state;
    }
    state.message = `Test passed. On to the next stage.`;
  }
  state.day += 1;
  state.ticks = {};
  return state;
}

// Call every time the app opens or the date may have changed.
export function rollover(state, today) {
  if (state.easyDate && state.easyDate < today) {
    state.easyDate = null;
    state.easyTicks = {};
  }
  if (state.doneDate && state.doneDate < today) {
    const d = buildDay(state.day);
    state.doneDate = null;
    if (d.rest) {
      advance(state);
    } else {
      state.askFeel = true;
    }
  }
  return state;
}

export function answerFeel(state, today, feel) {
  if (!state.askFeel) return state;
  state.askFeel = false;
  if (feel === 'fine') {
    state.soreStreak = 0;
    advance(state);
  } else {
    state.soreStreak += 1;
    state.easyDate = today;
    state.easyTicks = {};
    state.ticks = {}; // repeat the same day after the easy day
  }
  return state;
}

export function isEasyToday(state, today) {
  return state.easyDate === today;
}

export function itemsToday(state, today) {
  if (isEasyToday(state, today)) return EASY_DAY;
  return buildDay(state.day).items;
}

export function ticksToday(state, today) {
  return isEasyToday(state, today) ? state.easyTicks : state.ticks;
}

export function dayDone(state, today) {
  const items = itemsToday(state, today);
  const t = ticksToday(state, today);
  return items.every((_, i) => t[i]);
}

export function tick(state, today, i, on = true) {
  const t = ticksToday(state, today);
  if (on) t[i] = true; else delete t[i];
  if (!isEasyToday(state, today)) {
    state.doneDate = dayDone(state, today) ? today : null;
  }
  return state;
}

export function saveTest(state, today, type, L, R) {
  state.tests.push({ date: today, day: state.day, type, L: Number(L), R: Number(R) });
  return state;
}

export function setDay(state, n) {
  state.day = Math.max(1, Math.floor(Number(n) || 1));
  state.ticks = {};
  state.doneDate = null;
  state.askFeel = false;
  state.easyDate = null;
  return state;
}
