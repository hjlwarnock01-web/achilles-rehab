import { EX, buildDay, doseText, WARNING_SIGNS, LEVO_NOTES } from './program.js';
import {
  dateKey, rollover, answerFeel, isEasyToday, itemsToday, ticksToday, dayDone,
  tick, saveTest, setDay, latestTest,
} from './logic.js';
import { load, save, reset } from './store.js';

let state = load();
const app = document.getElementById('app');
const modal = document.getElementById('modal');
const sheet = modal.querySelector('.sheet');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => dateKey();

function commit() {
  save(state);
  render();
}

function refresh() {
  rollover(state, today());
  save(state);
  render();
}

// ---------- Home ----------

function render() {
  const t = today();
  const easy = isEasyToday(state, t);
  const d = buildDay(state.day);
  const items = itemsToday(state, t);
  const ticks = ticksToday(state, t);
  const done = dayDone(state, t);

  let html = '<header class="top">';
  if (easy) {
    html += `<div class="eyebrow">Day ${d.n} again tomorrow</div><h1>Easy day</h1>`;
    html += '<p class="sub">Your Achilles were sore, so today is light.</p>';
  } else {
    const stage = d.weeks ? `${d.block} · week ${d.week} of ${d.weeks}` : `${d.block} · week ${d.week}`;
    html += `<div class="eyebrow">${esc(stage)}</div><h1>Day ${d.n}</h1>`;
    if (d.toMuayThai > 0) {
      const w = Math.ceil(d.toMuayThai / 7);
      html += `<p class="sub">Muay Thai in ${w} week${w === 1 ? '' : 's'} if you pass your tests</p>`;
    }
  }
  html += '</header>';

  if (state.message) {
    html += `<div class="banner"><p>${esc(state.message)}</p><button class="btn small ghost" data-act="dismiss">OK</button></div>`;
  }
  if (easy && state.soreStreak >= 3) {
    html += '<div class="banner bad"><p>Sore three times in a row. Take two full days off. If it doesn\'t settle, see a physio.</p></div>';
  }

  if (state.askFeel) {
    html += `<div class="card ask">
      <h2>How are your Achilles this morning?</h2>
      <p class="sub">Compared with usual, after yesterday. If in doubt, pick Sore.</p>
      <div class="two">
        <button class="btn primary big-btn" data-act="fine">Fine</button>
        <button class="btn big-btn" data-act="sore">Sore</button>
      </div>
    </div>`;
  } else {
    html += '<ol class="list">';
    items.forEach((item, i) => {
      const ex = EX[item.ex];
      const on = !!ticks[i];
      html += `<li><button class="ex-row${on ? ' on' : ''}" data-open="${i}">
        <span class="num">${on ? '✓' : i + 1}</span>
        <span class="ex-txt"><span class="ex-name">${esc(ex.name)}</span>
        <span class="ex-dose">${esc(doseText(item))}</span></span>
        <span class="chev">›</span>
      </button></li>`;
    });
    html += '</ol>';
    if (done) {
      html += easy
        ? '<div class="done">Easy day done. Tomorrow you repeat the day you did.</div>'
        : `<div class="done">Day ${d.n} done ✓<br><span>See you tomorrow.</span></div>`;
    }
  }

  html += '<button class="more" data-act="more">More</button>';
  app.innerHTML = html;
}

app.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const t = today();
  if (b.dataset.open != null) return openItem(Number(b.dataset.open));
  const act = b.dataset.act;
  if (act === 'fine' || act === 'sore') { answerFeel(state, t, act); commit(); }
  if (act === 'dismiss') { state.message = null; commit(); }
  if (act === 'more') openMore();
});

// ---------- Sheet ----------

function openSheet(html) {
  sheet.innerHTML = html;
  modal.classList.add('open');
  sheet.scrollTop = 0;
}

function closeSheet() {
  stopTimer();
  modal.classList.remove('open');
  sheet.innerHTML = '';
}

modal.addEventListener('click', (e) => { if (e.target === modal) closeSheet(); });

// ---------- Exercise ----------

let current = null;

function openItem(i) {
  const t = today();
  const item = itemsToday(state, t)[i];
  const ex = EX[item.ex];
  const on = !!ticksToday(state, t)[i];
  current = { i, item, set: 0 };

  let html = `<div class="sheet-head"><h2>${esc(ex.name)}</h2><button class="x" data-act="close" aria-label="Close">×</button></div>`;
  const dose = doseText(item);
  if (dose) html += `<p class="dose">${esc(dose)}</p>`;
  if (item.note) html += `<p class="note">${esc(item.note)}</p>`;
  html += `<p class="how">${esc(ex.how)}</p>`;

  if (ex.test) {
    const last = latestTest(state, item.ex);
    html += `<div class="two inputs">
      <label>Right leg<input id="tR" type="number" inputmode="numeric" min="0" value="${last && on ? last.R : ''}"></label>
      <label>Left leg<input id="tL" type="number" inputmode="numeric" min="0" value="${last && on ? last.L : ''}"></label>
    </div>
    <button class="btn primary block" data-act="save-test">Save</button>`;
  } else {
    if (item.unit === 's') {
      html += `<div class="timer-box">
        <div class="set-label" id="setLabel"></div>
        <button class="timer" id="timer" data-act="timer">Start ${item.amount} s</button>
      </div>`;
    }
    html += on
      ? '<button class="btn block" data-act="undo">Not done yet</button>'
      : '<button class="btn primary block" data-act="done">Done</button>';
  }
  openSheet(html);
  updateSetLabel();
}

function totalSets(item) {
  return item.sets * (item.each ? 2 : 1);
}

function updateSetLabel() {
  const el = document.getElementById('setLabel');
  if (!el || !current) return;
  const { item, set } = current;
  const n = totalSets(item);
  if (set >= n) { el.textContent = 'All sets done'; return; }
  let s = `Set ${Math.floor(set / (item.each ? 2 : 1)) + 1} of ${item.sets}`;
  if (item.each) s += set % 2 === 0 ? ' · right leg' : ' · left leg';
  el.textContent = s;
}

sheet.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const t = today();
  const act = b.dataset.act;
  if (act === 'close') return closeSheet();
  if (act === 'done') { tick(state, t, current.i, true); closeSheet(); commit(); }
  if (act === 'undo') { tick(state, t, current.i, false); closeSheet(); commit(); }
  if (act === 'timer') toggleTimer();
  if (act === 'save-test') {
    const R = document.getElementById('tR').value;
    const L = document.getElementById('tL').value;
    if (R === '' || L === '') { document.getElementById(R === '' ? 'tR' : 'tL').focus(); return; }
    saveTest(state, t, current.item.ex, L, R);
    tick(state, t, current.i, true);
    closeSheet();
    commit();
  }
  if (act === 'set-day') {
    const n = Number(document.getElementById('dayIn').value);
    if (n >= 1) { setDay(state, n); closeSheet(); commit(); }
  }
  if (act === 'reset') {
    if (confirm('Start again from day 1? This deletes everything.')) {
      reset();
      state = load();
      closeSheet();
      commit();
    }
  }
});

// ---------- Timer ----------

let timer = null;
let wakeLock = null;

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

let audio = null;
function beep(freq = 880, ms = 180) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = freq;
    g.gain.value = 0.2;
    o.connect(g); g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + ms / 1000);
  } catch { /* no audio */ }
}

function toggleTimer() {
  const el = document.getElementById('timer');
  if (!el || !current) return;
  if (timer) {
    stopTimer();
    el.textContent = `Start ${current.item.amount} s`;
    el.classList.remove('running');
    return;
  }
  if (current.set >= totalSets(current.item)) current.set = 0;
  beep(660, 120); // also unlocks audio on iOS
  if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { wakeLock = w; }).catch(() => {});
  let left = current.item.amount;
  el.textContent = `${left}`;
  el.classList.add('running');
  timer = setInterval(() => {
    left -= 1;
    if (left <= 3 && left > 0) beep(660, 80);
    if (left <= 0) {
      stopTimer();
      beep(990, 400);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      current.set += 1;
      updateSetLabel();
      const finished = current.set >= totalSets(current.item);
      el.classList.remove('running');
      el.textContent = finished ? 'Done ✓' : `Next set · ${current.item.amount} s`;
      return;
    }
    el.textContent = `${left}`;
  }, 1000);
}

// ---------- More ----------

function openMore() {
  let html = '<div class="sheet-head"><h2>More</h2><button class="x" data-act="close" aria-label="Close">×</button></div>';

  const tests = state.tests.slice().reverse();
  html += '<h3>Your test results</h3>';
  if (!tests.length) html += '<p class="sub">None yet. The first one is on day 5.</p>';
  else {
    html += '<table><tr><th>Day</th><th>Test</th><th>Right</th><th>Left</th></tr>';
    for (const r of tests) {
      html += `<tr><td>${r.day}</td><td>${r.type === 'test_hop' ? 'Hops' : 'Heel raises'}</td><td>${r.R}</td><td>${r.L}</td></tr>`;
    }
    html += '</table>';
  }

  html += '<h3>Stop and see a doctor if</h3><ul>' + WARNING_SIGNS.map((w) => `<li>${esc(w)}</li>`).join('') + '</ul>';
  html += '<h3>About levofloxacin</h3><ul>' + LEVO_NOTES.map((w) => `<li>${esc(w)}</li>`).join('') + '</ul>';

  html += `<h3>Change day</h3>
    <div class="two inputs"><input id="dayIn" type="number" inputmode="numeric" min="1" value="${state.day}">
    <button class="btn" data-act="set-day">Go</button></div>
    <button class="btn danger block" data-act="reset">Start again from day 1</button>`;
  openSheet(html);
}

// ---------- Boot ----------

refresh();
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
setInterval(() => { if (!timer) refresh(); }, 60 * 1000);

if ('serviceWorker' in navigator) {
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (local) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  } else {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
