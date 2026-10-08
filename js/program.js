// The whole programme as a list of days. No equipment: a stair, a backpack
// with water bottles, the floor. Pure data + a day builder, no DOM.
//
// Slower than a standard Achilles plan on purpose: a levofloxacin-injured
// tendon stays fragile for 6–12 months, so tempo stays slow and jumping
// waits until the strength tests pass.

export const EX = {
  hold: {
    name: 'Calf hold',
    how: 'Both feet, hands on a wall. Rise halfway onto the balls of your feet and hold. Knees soft, weight over the big toes. Breathe.',
  },
  balance: {
    name: 'One-leg balance',
    how: 'Stand on one foot, soft knee. Too easy? Close your eyes, or stand on a folded towel.',
  },
  balance_hard: {
    name: 'One-leg balance, eyes closed',
    how: 'Stand on one foot, soft knee, eyes closed. Touch the wall if you wobble, then let go again.',
  },
  dl_raise: {
    name: 'Calf raises, both legs',
    how: 'Balls of both feet on a stair, heels hanging off. Rise all the way up over 3 seconds, lower over 3 seconds until the heels are just below the stair. Even weight on both feet.',
  },
  sl_raise_floor: {
    name: 'One-leg calf raises, floor',
    how: 'One foot on the floor, fingertips on a wall for balance only. Rise all the way up over 3 seconds, lower over 3. Right leg first. Can\'t get all the reps? Push up with both feet, lower on one.',
  },
  sl_raise_step: {
    name: 'One-leg calf raises, stair',
    how: 'Ball of one foot on a stair, heel hanging off. Up over 3 seconds, down over 3 until the heel is just below the stair. No bouncing at the bottom. Right leg first.',
  },
  sl_raise_bag: {
    name: 'One-leg calf raises, backpack',
    how: 'Same as the stair raise, wearing a backpack with water bottles in it. Up 3 seconds, hold 2, down 3. The last 2 reps should be hard but clean. Add one bottle a week if the mornings stay fine. Right leg first.',
  },
  bent_raise: {
    name: 'Bent-knee calf raises',
    how: 'One foot on a stair, knee bent a little and kept bent the whole time. Rise and lower slowly. This works the deep calf muscle you use on stairs. Right leg first.',
  },
  bent_raise_bag: {
    name: 'Bent-knee calf raises, backpack',
    how: 'One foot on a stair, knee bent a little the whole time, backpack on. Rise and lower slowly. Right leg first.',
  },
  tib: {
    name: 'Toe raises against a wall',
    how: 'Back against a wall, feet a step out in front. Lift both sets of toes as high as you can, lower slowly. A burn in the shins is normal.',
  },
  step_up: {
    name: 'Step-ups',
    how: 'Step up onto a stair, push through the whole foot. Lower yourself back down slowly, over 3 seconds.',
  },
  step_down: {
    name: 'Slow step-downs',
    how: 'Stand on a stair on one leg. Lower the other heel to the floor below over 3 seconds, tap, come back up. Knee points over your middle toes.',
  },
  split_squat: {
    name: 'Split squats',
    how: 'Long step, back heel up. Lower straight down until the back knee nearly touches the floor, then push up. Wear the backpack once it feels easy.',
  },
  walk: {
    name: 'Walk',
    how: 'Normal pace, flat ground. Stop if either Achilles hurts more than a little.',
  },
  stairs: {
    name: 'Stairs or hill walk',
    how: 'Walk up and down stairs or a hill at an easy pace. This is the thing that felt weak on the hike, built up a bit each week.',
  },
  pogo: {
    name: 'Pogo hops',
    how: 'Small, quick hops on both feet, knees almost straight, landing on the balls of the feet. Think of your ankles as springs. Keep them low.',
  },
  pogo_sl: {
    name: 'One-leg pogo hops',
    how: 'Same small quick hops on one foot. Stop the set as soon as the rhythm goes flat. Right leg first.',
  },
  land: {
    name: 'Jump onto a stair and stick it',
    how: 'Jump up onto one low stair, land quietly on both feet and hold still for 2 seconds. Step back down. Don\'t jump down.',
  },
  skip: {
    name: 'Skipping, no rope',
    how: 'Bounce on the balls of your feet like you\'re skipping rope. Low, light, steady.',
  },
  shadow: {
    name: 'Shadow boxing, footwork only',
    how: 'Punches and footwork, feet fairly flat, no bounce yet. Step, pivot on the whole foot, check kicks. No round kicks.',
  },
  shadow_bounce: {
    name: 'Shadow boxing with bounce',
    how: 'Your normal bouncing stance. Punches, teeps, knees. Round kicks only once you\'re back in class for 3 weeks.',
  },
  pivot: {
    name: 'Round-kick pivot drill',
    how: 'Pivot on the ball of your standing foot, slowly. Then add a slow round kick. Then normal speed. Only go faster if the next morning is fine.',
  },
  muay_thai: {
    name: 'Muay Thai class',
    how: 'Tell the coach your limits before class starts, not during.',
  },
  test_raise: {
    name: 'Test: one-leg heel raises',
    test: true,
    how: 'Fingertips on a wall for balance only. On one leg, go all the way up and down, about 1 second each way. Count until you can\'t get all the way up. Do the right leg, then the left.',
  },
  test_hop: {
    name: 'Test: one-leg hops',
    test: true,
    how: 'Small continuous hops on one foot. Count until the rhythm breaks or it starts to hurt. Right leg, then left.',
  },
  rest: {
    name: 'Rest day',
    how: 'Nothing to do. Walk around normally.',
  },
};

// sets × amount. unit: 'reps' | 's' | 'min'. each: per leg.
const it = (ex, sets, amount, unit = 'reps', extra = {}) => ({ ex, sets, amount, unit, ...extra });

const BLOCKS = [
  {
    name: 'Strength',
    weeks: 4,
    pattern: ['S', 'W', 'S', 'W', 'S', 'W', 'R'],
    gate: { test: 'test_raise', min: 20, sym: 20, at: 4 },
    days: {
      S: (w) => [
        it('hold', 2, 30, 's'),
        it('dl_raise', 3, 15),
        w <= 2 ? it('sl_raise_floor', 3, 8, 'reps', { each: true }) : it('sl_raise_step', 3, 10, 'reps', { each: true }),
        it('bent_raise', 3, 12, 'reps', { each: true }),
        it('tib', 2, 15),
        it('step_up', 2, 10, 'reps', { each: true }),
      ],
      W: () => [
        it('balance', 3, 30, 's', { each: true }),
        it('step_down', 2, 8, 'reps', { each: true }),
        it('walk', 1, 20, 'min'),
      ],
    },
  },
  {
    name: 'Heavy and slow',
    weeks: 6,
    pattern: ['H', 'W', 'H', 'W', 'H', 'U', 'R'],
    gate: { test: 'test_raise', min: 25, sym: 20, at: 4 },
    days: {
      H: () => [
        it('hold', 2, 30, 's'),
        it('sl_raise_bag', 4, 10, 'reps', { each: true }),
        it('bent_raise_bag', 3, 12, 'reps', { each: true }),
        it('split_squat', 3, 8, 'reps', { each: true }),
        it('tib', 2, 20),
      ],
      W: () => [
        it('balance_hard', 3, 30, 's', { each: true }),
        it('step_down', 3, 8, 'reps', { each: true }),
        it('walk', 1, 25, 'min'),
      ],
      U: (w) => [
        it('hold', 2, 30, 's'),
        it('stairs', 1, Math.min(10 + 5 * (w - 1), 30), 'min'),
      ],
    },
  },
  {
    name: 'Spring',
    weeks: 4,
    pattern: ['P', 'H', 'F', 'P', 'H', 'K', 'R'],
    gate: { test: 'test_hop', min: 20, sym: 20, at: 3 },
    days: {
      P: (w) => [
        it('hold', 2, 30, 's'),
        it('pogo', 3, 20),
        ...(w >= 2 ? [it('pogo_sl', 3, 10, 'reps', { each: true })] : []),
        it('land', 3, 5),
        it('tib', 2, 20),
      ],
      H: () => [
        it('sl_raise_bag', 3, 8, 'reps', { each: true }),
        it('bent_raise_bag', 3, 10, 'reps', { each: true }),
        it('split_squat', 2, 8, 'reps', { each: true }),
      ],
      F: () => [
        it('balance_hard', 2, 30, 's', { each: true }),
        it('shadow', 3, 3, 'min'),
        it('step_down', 2, 8, 'reps', { each: true }),
      ],
      K: (w) => [
        it('hold', 2, 30, 's'),
        it('skip', 4, 30 + 10 * (w - 1), 's'),
        it('stairs', 1, 15, 'min'),
      ],
    },
  },
];

const MT_DAYS = {
  M: (classes) => [
    it('hold', 2, 30, 's', { note: 'before class' }),
    ...(classes >= 2 ? [it('pivot', 2, 10, 'reps', { each: true })] : []),
    it('muay_thai', 1, classes === 1 ? 45 : 60, 'min', {
      note: classes === 1 ? 'No jumping drills, no sparring, no round kicks yet.'
        : classes === 2 ? 'Round kicks on the bag are fine now. No sparring yet.'
          : 'Sparring is fine if your mornings have been fine.',
    }),
  ],
  H: () => [
    it('sl_raise_bag', 3, 8, 'reps', { each: true }),
    it('bent_raise_bag', 3, 10, 'reps', { each: true }),
    it('split_squat', 2, 8, 'reps', { each: true }),
  ],
  P: () => [
    it('pogo', 3, 25),
    it('pogo_sl', 3, 12, 'reps', { each: true }),
    it('skip', 5, 60, 's'),
  ],
  K: () => [
    it('hold', 2, 30, 's'),
    it('shadow_bounce', 4, 3, 'min'),
  ],
};

const MT_PATTERNS = {
  1: ['M', 'H', 'P', 'R', 'H', 'K', 'R'],
  2: ['M', 'H', 'P', 'M', 'H', 'K', 'R'],
  3: ['M', 'H', 'M', 'P', 'M', 'H', 'R'],
};

// First day of each block (1-based).
export const BLOCK_STARTS = (() => {
  const out = [];
  let d = 1;
  for (const b of BLOCKS) { out.push(d); d += b.weeks * 7; }
  out.push(d); // Muay Thai
  return out;
})();

export const MUAY_THAI_DAY = BLOCK_STARTS[BLOCK_STARTS.length - 1];

// Build day n (1-based). Returns { n, block, week, weeks, items, rest, gate, repeatFrom }.
export function buildDay(n) {
  n = Math.max(1, Math.floor(n));
  let start = 1;
  for (const b of BLOCKS) {
    const len = b.weeks * 7;
    if (n < start + len) {
      const idx = n - start;
      const week = Math.floor(idx / 7) + 1;
      const key = b.pattern[idx % 7];
      const lastWeek = week === b.weeks;
      let items = key === 'R' ? [] : b.days[key](week);
      // Baseline test on day 1, gate test in the block's last week.
      if (n === 1) items = [it('test_raise', 1, 1, 'test'), ...items];
      if (lastWeek && idx % 7 === b.gate.at) items = [it(b.gate.test, 1, 1, 'test'), ...items];
      const isBlockEnd = idx === len - 1;
      return {
        n, block: b.name, week, weeks: b.weeks, key,
        rest: key === 'R',
        items: key === 'R' ? [it('rest', 1, 1, 'rest')] : items,
        gate: isBlockEnd ? b.gate : null,
        repeatFrom: isBlockEnd ? start + (b.weeks - 1) * 7 : null,
      };
    }
    start += len;
  }
  // Muay Thai: open-ended. 1 class/wk for 3 weeks, 2 for 3 weeks, then 3.
  const idx = n - start;
  const week = Math.floor(idx / 7) + 1;
  const classes = week <= 3 ? 1 : week <= 6 ? 2 : 3;
  const key = MT_PATTERNS[classes][idx % 7];
  return {
    n, block: 'Muay Thai', week, weeks: null, key, classes,
    rest: key === 'R',
    items: key === 'R' ? [it('rest', 1, 1, 'rest')] : MT_DAYS[key](classes),
    gate: null,
    repeatFrom: null,
  };
}

export function doseText(item) {
  if (item.unit === 'test') return 'Count each leg';
  if (item.unit === 'rest') return '';
  const leg = item.each ? ' each leg' : '';
  if (item.unit === 'min') return item.sets > 1 ? `${item.sets} × ${item.amount} min` : `${item.amount} min`;
  if (item.unit === 's') return `${item.sets} × ${item.amount} s${leg}`;
  return `${item.sets} × ${item.amount}${leg}`;
}

export const WARNING_SIGNS = [
  'A pop or snap, or a feeling like someone kicked the back of your leg.',
  'Suddenly you can\'t rise onto your toes on one leg.',
  'Sharp pain that doesn\'t ease within a few minutes of stopping.',
  'A dent or gap you can feel in the tendon.',
];

export const LEVO_NOTES = [
  'Levofloxacin can leave tendons fragile for 6 to 12 months. That is why this plan is slow.',
  'Never get a steroid injection near the Achilles.',
  'Tell every doctor about the reaction before they prescribe an antibiotic.',
];
