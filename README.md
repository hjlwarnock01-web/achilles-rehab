# Achilles Rebuild

Phone-first PWA for a staged Achilles tendon rebuild after a fluoroquinolone
(levofloxacin) injury, with the end goal of training Muay Thai again.

No build step. Vanilla JS modules, localStorage only, service worker for offline.

## Run locally

```
npm run serve        # python -m http.server 8124
```

Open http://localhost:8124 on the laptop, or on the phone over Wi-Fi using the
laptop's LAN address. Modules do not load from `file://`, so always use a server.

## Tests

```
npm test
```

Pure-logic tests in `tests/` cover the protocol integrity, flare detection, the
progression criteria (including the "too few mornings logged" denominator) and
phase moves.

## Layout

- `js/protocol.js` — the plan: exercises, tests, five phases, weekly maps, criteria.
- `js/logic.js` — dates, flares, criteria evaluation, phase moves. No DOM.
- `js/store.js` — localStorage, export/import.
- `js/app.js` — rendering, session runner, timers.
- `tools/make_icons.py` — regenerates the icons (pure Python).

## Release

Bump `?v=` on the CSS and JS tags in `index.html` and `CACHE` in `sw.js` together.
