// =====================================================================
//  Settings: everything the Configuration screen ("c") can change.
//  Each entry points at a property of the objects in config.js, so the
//  game reads the new value immediately. Values are saved in the
//  browser (localStorage) and loaded at start-up.
//
//  types:  toggle  - on / off
//          choice  - one of a few options
//          slider  - number between min and max, in steps
// =====================================================================

// extra parameters used by the settings
PADDLE.topGap = 6;          // lines the paddle cannot reach at the top
SOUND.enabled = true;

const pct = (v) => Math.round(v * 100) + '%';

const SETTINGS = [
    // ------------------------------------------------------------ GAME
    { tab: 'GAME', label: 'POINTS TO WIN', obj: SCORE, key: 'winning', type: 'choice', options: [11, 15] },
    { tab: 'GAME', label: 'WALLS', obj: WALLS, key: 'enabled', type: 'toggle' },
    { tab: 'GAME', label: 'WALL DISTANCE', obj: WALLS, key: 'inset', type: 'slider', min: 0, max: 24, step: 1,
      fmt: v => v + ' LINES' },
    { tab: 'GAME', label: 'PADDLE HEIGHT', obj: PADDLE, key: 'height', type: 'slider', min: 8, max: 32, step: 1,
      fmt: v => v + (v === 15 ? ' ORIG' : ' LINES') },
    { tab: 'GAME', label: 'GAP AT THE TOP', obj: PADDLE, key: 'topGap', type: 'slider', min: 0, max: 20, step: 1,
      fmt: v => v + ' LINES' },
    { tab: 'GAME', label: 'SPEED COUNTS/HIT', obj: BALL, key: 'countsPerHit', type: 'slider', min: 1, max: 8, step: 1,
      fmt: v => v + (v === 8 ? ' ORIG' : '') },
    { tab: 'GAME', label: 'SERVE DELAY', obj: BALL, key: 'serveDelay', type: 'slider', min: 0.5, max: 3, step: 0.1,
      fmt: v => v.toFixed(1) + ' S' },
    { tab: 'GAME', label: 'FINAL SCORE SHOWN', obj: SCORE, key: 'showInAttract', type: 'toggle' },

    // ------------------------------------------------------------ PLAYERS
    { tab: 'PLAYERS', label: 'COMPUTER MISSES', obj: AI, key: 'missAfter', type: 'slider', min: 0, max: 15, step: 1,
      fmt: v => v === 0 ? 'NEVER' : 'AFTER ' + v },
    { tab: 'PLAYERS', label: 'COMPUTER MISSES STEEP', obj: AI, key: 'missSteep', type: 'toggle' },
    { tab: 'PLAYERS', label: 'COMPUTER SPEED', obj: AI, key: 'maxSpeed', type: 'slider', min: 1, max: 6, step: 0.5,
      fmt: v => v.toFixed(1) },
    { tab: 'PLAYERS', label: 'COMPUTER REACTION', obj: AI, key: 'reactionFrames', type: 'slider', min: 1, max: 20, step: 1,
      fmt: v => v + ' FIELDS' },
    { tab: 'PLAYERS', label: 'COMPUTER AIM ERROR', obj: AI, key: 'error', type: 'slider', min: 0, max: 10, step: 0.5,
      fmt: v => v.toFixed(1) },
    { tab: 'PLAYERS', label: 'WHEEL STEP', obj: PADDLE, key: 'wheelSensitivity', type: 'slider', min: 0.02, max: 0.15, step: 0.01,
      fmt: v => Math.round(v * 100) + ' LINES' },
    { tab: 'PLAYERS', label: 'WHEEL ACCELERATION', obj: PADDLE, key: 'wheelMaxGain', type: 'slider', min: 1, max: 4, step: 0.1,
      fmt: v => v <= 1 ? 'OFF' : v.toFixed(1) + 'X' },
    { tab: 'PLAYERS', label: 'PADDLE GLIDE', obj: PADDLE, key: 'smoothing', type: 'slider', min: 0.1, max: 1, step: 0.05,
      fmt: v => v >= 1 ? 'OFF' : pct(1 - v) },
    { tab: 'PLAYERS', label: 'ARROW KEY SPEED', obj: PADDLE, key: 'keySpeed', type: 'slider', min: 1, max: 8, step: 1,
      fmt: v => v + ' LINES' },

    // ------------------------------------------------------------ SCREEN
    { tab: 'SCREEN', label: 'SCANLINES', obj: CRT, key: 'scanlineStrength', type: 'slider', min: 0, max: 1, step: 0.05, fmt: pct, crt: true },
    { tab: 'SCREEN', label: 'BEAM WIDTH', obj: CRT, key: 'beamWidth', type: 'slider', min: 0.12, max: 0.5, step: 0.01, fmt: pct, crt: true },
    { tab: 'SCREEN', label: 'AFTERGLOW', obj: CRT, key: 'persistence', type: 'slider', min: 0, max: 0.85, step: 0.01, fmt: pct },
    { tab: 'SCREEN', label: 'BLOOM', obj: CRT, key: 'bloom', type: 'slider', min: 0, max: 1.5, step: 0.05, fmt: pct },
    { tab: 'SCREEN', label: 'CURVATURE', obj: CRT, key: 'curvature', type: 'slider', min: 0, max: 0.1, step: 0.005,
      fmt: v => (v * 100).toFixed(1) + '%', crt: true },
    { tab: 'SCREEN', label: 'GLASS BLACK LEVEL', obj: CRT, key: 'glassBlack', type: 'slider', min: 0, max: 0.12, step: 0.005,
      fmt: v => (v * 100).toFixed(1) + '%', crt: true },
    { tab: 'SCREEN', label: 'SOUND', obj: SOUND, key: 'enabled', type: 'toggle' },
    { tab: 'SCREEN', label: 'VOLUME', obj: SOUND, key: 'volume', type: 'slider', min: 0, max: 0.3, step: 0.01,
      fmt: v => Math.round(v / 0.3 * 100) + '%' }
];

SETTINGS.forEach(s => { s.id = s.label; });

const SETTINGS_DEFAULTS = SETTINGS.map(s => s.obj[s.key]);
const SETTINGS_KEY = 'pong-settings-v2';   // v2: new, easier / more vintage defaults

// Values that depend on the settings
function applySettings() {
    const w = WALLS.enabled ? WALLS.inset + WALLS.thickness : 0;
    FIELD.top = SCREEN.VBLANK + w;
    FIELD.bottom = SCREEN.VTOTAL - w;
    PADDLE.minY = FIELD.top + PADDLE.topGap;
    PADDLE.maxY = FIELD.bottom - PADDLE.height;
    if (typeof Crt !== 'undefined') Crt.updateParams();
}

function setSetting(s, value) {
    if (s.type === 'slider') {
        value = Math.round((value - s.min) / s.step) * s.step + s.min;
        value = Math.max(s.min, Math.min(s.max, value));
        value = parseFloat(value.toFixed(4));
    }
    s.obj[s.key] = value;
    applySettings();
    saveSettings();
}

function resetSettings() {
    SETTINGS.forEach((s, i) => { s.obj[s.key] = SETTINGS_DEFAULTS[i]; });
    applySettings();
    saveSettings();
}

function saveSettings() {
    try {
        const o = {};
        SETTINGS.forEach(s => { o[s.id] = s.obj[s.key]; });
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(o));
    } catch (e) { /* storage not available: settings last for this visit */ }
}

function loadSettings() {
    try {
        const o = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        SETTINGS.forEach((s, i) => {
            if (o[s.id] !== undefined && typeof o[s.id] === typeof SETTINGS_DEFAULTS[i]) s.obj[s.key] = o[s.id];
        });
        // the default glass black level changed from 6.5 % to 9.5 %: an
        // untouched old default is moved to the new one
        if (o['GLASS BLACK LEVEL'] === 0.065) CRT.glassBlack = 0.095;
    } catch (e) { /* ignore */ }
    applySettings();
}

loadSettings();
