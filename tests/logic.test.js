import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EX, buildDay, doseText, BLOCK_STARTS, MUAY_THAI_DAY } from '../js/program.js';
import {
  newState, rollover, answerFeel, tick, dayDone, itemsToday, saveTest, isEasyToday, setDay, gatePasses,
} from '../js/logic.js';

const D1 = '2026-10-08';
const D2 = '2026-10-09';
const D3 = '2026-10-10';

function finishDay(s, date) {
  itemsToday(s, date).forEach((_, i) => tick(s, date, i, true));
}

test('every day for a year builds, and every item is a known exercise with a dose', () => {
  for (let n = 1; n <= 365; n++) {
    const d = buildDay(n);
    assert.ok(d.items.length > 0, `day ${n} empty`);
    for (const it of d.items) {
      assert.ok(EX[it.ex], `day ${n}: unknown ${it.ex}`);
      if (it.unit !== 'test' && it.unit !== 'rest') assert.ok(doseText(it).length > 0);
    }
  }
});

test('block layout: strength 1–28, heavy 29–70, spring 71–98, Muay Thai from 99', () => {
  assert.deepEqual(BLOCK_STARTS, [1, 29, 71, 99]);
  assert.equal(MUAY_THAI_DAY, 99);
  assert.equal(buildDay(1).block, 'Strength');
  assert.equal(buildDay(29).block, 'Heavy and slow');
  assert.equal(buildDay(71).block, 'Spring');
  assert.equal(buildDay(99).block, 'Muay Thai');
});

test('day 1 starts with the baseline heel-raise test', () => {
  assert.equal(buildDay(1).items[0].ex, 'test_raise');
  assert.notEqual(buildDay(3).items[0].ex, 'test_raise');
});

test('each block has its gate test in the last week and a gate on its last day', () => {
  assert.equal(buildDay(26).items[0].ex, 'test_raise');
  assert.ok(buildDay(28).gate);
  assert.equal(buildDay(28).repeatFrom, 22);
  assert.equal(buildDay(68).items[0].ex, 'test_raise');
  assert.equal(buildDay(70).repeatFrom, 64);
  assert.equal(buildDay(95).items[0].ex, 'test_hop');
  assert.equal(buildDay(98).repeatFrom, 92);
  assert.equal(buildDay(27).gate, null);
});

test('no plyo on consecutive days in the spring block', () => {
  for (let n = 71; n < 98; n++) {
    assert.ok(!(buildDay(n).key === 'P' && buildDay(n + 1).key === 'P'), `plyo on ${n} and ${n + 1}`);
  }
});

test('Muay Thai ramps 1 → 2 → 3 classes a week', () => {
  const count = (start) => [...Array(7)].filter((_, i) => buildDay(start + i).key === 'M').length;
  assert.equal(count(99), 1);
  assert.equal(count(99 + 21), 2);
  assert.equal(count(99 + 42), 3);
  assert.equal(count(99 + 200), 3);
});

test('stairs walk grows 10 → 30 min and stops at 30', () => {
  const mins = [];
  for (let n = 29; n <= 70; n++) {
    const s = buildDay(n).items.find((i) => i.ex === 'stairs');
    if (s) mins.push(s.amount);
  }
  assert.deepEqual(mins, [10, 15, 20, 25, 30, 30]);
});

test('tapping every exercise finishes the day; un-tapping un-finishes it', () => {
  const s = newState(D1);
  assert.equal(dayDone(s, D1), false);
  finishDay(s, D1);
  assert.equal(dayDone(s, D1), true);
  assert.equal(s.doneDate, D1);
  tick(s, D1, 0, false);
  assert.equal(s.doneDate, null);
});

test('same day: nothing moves. Next day: asks Fine/Sore, Fine → day 2', () => {
  const s = newState(D1);
  finishDay(s, D1);
  rollover(s, D1);
  assert.equal(s.day, 1);
  assert.equal(s.askFeel, false);
  rollover(s, D2);
  assert.equal(s.askFeel, true);
  assert.equal(s.day, 1);
  answerFeel(s, D2, 'fine');
  assert.equal(s.day, 2);
  assert.deepEqual(s.ticks, {});
});

test('unfinished day stays the same day tomorrow, no question', () => {
  const s = newState(D1);
  tick(s, D1, 0, true);
  rollover(s, D2);
  assert.equal(s.day, 1);
  assert.equal(s.askFeel, false);
  assert.equal(s.ticks[0], true);
});

test('Sore → easy day today, then the same day repeats', () => {
  const s = newState(D1);
  s.day = 3;
  finishDay(s, D1);
  rollover(s, D2);
  answerFeel(s, D2, 'sore');
  assert.equal(isEasyToday(s, D2), true);
  assert.equal(itemsToday(s, D2)[0].ex, 'hold');
  finishDay(s, D2);
  assert.equal(s.doneDate, null, 'easy day must not mark the programme day done');
  rollover(s, D3);
  assert.equal(isEasyToday(s, D3), false);
  assert.equal(s.day, 3);
  assert.equal(s.askFeel, false);
  assert.equal(s.soreStreak, 1);
});

test('a rest day moves on by itself the next day, no question', () => {
  const s = newState(D1);
  s.day = 7;
  assert.equal(buildDay(7).rest, true);
  finishDay(s, D1);
  rollover(s, D2);
  assert.equal(s.askFeel, false);
  assert.equal(s.day, 8);
});

test('gate: failing the test repeats the last week, passing moves to the next block', () => {
  const run = (L, R) => {
    const s = newState(D1);
    s.day = 28;
    saveTest(s, D1, 'test_raise', L, R);
    finishDay(s, D1);
    rollover(s, D2);
    return s;
  };
  assert.equal(run(25, 22).day, 29);
  const low = run(25, 18);
  assert.equal(low.day, 22);
  assert.match(low.message, /20 on each leg/);
  const lopsided = run(30, 22); // 27% gap
  assert.equal(lopsided.day, 22);
  assert.match(lopsided.message, /within 20%/);
});

test('gate uses the LATEST test, and no test means not passed', () => {
  const s = newState(D1);
  const gate = buildDay(28).gate;
  assert.equal(gatePasses(s, gate).ok, false);
  saveTest(s, D1, 'test_raise', 25, 25);
  assert.equal(gatePasses(s, gate).ok, true);
  saveTest(s, D1, 'test_raise', 25, 12);
  assert.equal(gatePasses(s, gate).ok, false);
});

test('setDay jumps and clears the in-progress state', () => {
  const s = newState(D1);
  tick(s, D1, 0, true);
  setDay(s, 40);
  assert.equal(s.day, 40);
  assert.deepEqual(s.ticks, {});
  setDay(s, -5);
  assert.equal(s.day, 1);
});
