// =====================================================================
//  Configuration screen - opened and closed with "c"
//
//  Drawn into the game raster and shown through the CRT, in the look of
//  the original: white blocks on black. A toggle is a box (filled = ON),
//  a slider runs on a dashed track like the net with a small paddle as
//  its knob, the cursor is the ball.
//
//  Mouse: click / drag.  Wheel: changes the item under the mouse (or the
//  selected one).  Keys: up/down select, left/right change, SPACE/ENTER
//  switch, TAB or 1-3 change page, C or ESC close.
//  The game is paused while the screen is open.
// =====================================================================

const ConfigUI = (() => {
    // ------------------------------------------------------- 5x7 font
    const GLYPHS = {
        'A': ['01110','10001','10001','11111','10001','10001','10001'],
        'B': ['11110','10001','10001','11110','10001','10001','11110'],
        'C': ['01110','10001','10000','10000','10000','10001','01110'],
        'D': ['11100','10010','10001','10001','10001','10010','11100'],
        'E': ['11111','10000','10000','11110','10000','10000','11111'],
        'F': ['11111','10000','10000','11110','10000','10000','10000'],
        'G': ['01110','10001','10000','10111','10001','10001','01111'],
        'H': ['10001','10001','10001','11111','10001','10001','10001'],
        'I': ['01110','00100','00100','00100','00100','00100','01110'],
        'J': ['00111','00010','00010','00010','00010','10010','01100'],
        'K': ['10001','10010','10100','11000','10100','10010','10001'],
        'L': ['10000','10000','10000','10000','10000','10000','11111'],
        'M': ['10001','11011','10101','10101','10001','10001','10001'],
        'N': ['10001','10001','11001','10101','10011','10001','10001'],
        'O': ['01110','10001','10001','10001','10001','10001','01110'],
        'P': ['11110','10001','10001','11110','10000','10000','10000'],
        'Q': ['01110','10001','10001','10001','10101','10010','01101'],
        'R': ['11110','10001','10001','11110','10100','10010','10001'],
        'S': ['01111','10000','10000','01110','00001','00001','11110'],
        'T': ['11111','00100','00100','00100','00100','00100','00100'],
        'U': ['10001','10001','10001','10001','10001','10001','01110'],
        'V': ['10001','10001','10001','10001','10001','01010','00100'],
        'W': ['10001','10001','10001','10101','10101','10101','01010'],
        'X': ['10001','10001','01010','00100','01010','10001','10001'],
        'Y': ['10001','10001','10001','01010','00100','00100','00100'],
        'Z': ['11111','00001','00010','00100','01000','10000','11111'],
        '0': ['01110','10001','10011','10101','11001','10001','01110'],
        '1': ['00100','01100','00100','00100','00100','00100','01110'],
        '2': ['01110','10001','00001','00010','00100','01000','11111'],
        '3': ['11111','00010','00100','00010','00001','10001','01110'],
        '4': ['00010','00110','01010','10010','11111','00010','00010'],
        '5': ['11111','10000','11110','00001','00001','10001','01110'],
        '6': ['00110','01000','10000','11110','10001','10001','01110'],
        '7': ['11111','00001','00010','00100','01000','01000','01000'],
        '8': ['01110','10001','10001','01110','10001','10001','01110'],
        '9': ['01110','10001','10001','01111','00001','00010','01100'],
        '.': ['00000','00000','00000','00000','00000','01100','01100'],
        '-': ['00000','00000','00000','11111','00000','00000','00000'],
        ':': ['00000','01100','01100','00000','01100','01100','00000'],
        '/': ['00000','00001','00010','00100','01000','10000','00000'],
        '%': ['11000','11001','00010','00100','01000','10011','00011'],
        '=': ['00000','00000','11111','00000','11111','00000','00000'],
        ' ': ['00000','00000','00000','00000','00000','00000','00000']
    };

    // bold: every pixel drawn 2 wide (black text on a lit box stays
    // readable through the CRT blur and bloom)
    function text(g, s, x, y, scale = 1, bold = false) {
        const adv = bold ? 7 : 6;
        for (const ch of String(s).toUpperCase()) {
            const gl = GLYPHS[ch] || GLYPHS[' '];
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 5; c++) {
                    if (gl[r][c] === '1') g.fillRect(x + c * scale, y + r * scale, scale * (bold ? 2 : 1), scale);
                }
            }
            x += adv * scale;
        }
    }
    const textW = (s, scale = 1, bold = false) => String(s).length * (bold ? 7 : 6) * scale - scale;

    // ------------------------------------------------------- layout
    const TABS = ['GAME', 'PLAYERS', 'SCREEN'];
    const WHITE = '#fff', DIM = '#8a8a8a', BLACK = '#000', FILL = '#c8c8c8';
    const X0 = SCREEN.VIEW_X, Y0 = SCREEN.VBLANK;
    const LEFT = X0 + 26;
    const CX = LEFT + 140;          // controls column
    const TRACK = 100;              // slider track length
    const ROW0 = Y0 + 55, ROWH = 16;

    let open = false;
    let tab = 0;
    let sel = 0;
    let regions = [];
    let dragging = null;
    let wheelAcc = 0;

    function items() {
        return SETTINGS.filter(s => s.tab === TABS[tab]).concat([
            { type: 'button', label: 'DEFAULTS', action: () => resetSettings() },
            { type: 'button', label: 'BACK', action: () => close() }
        ]);
    }

    function box(g, x, y, w, h, filled) {
        if (filled) {
            g.fillRect(x, y, w, h);
        } else {
            g.fillRect(x, y, w, 1);
            g.fillRect(x, y + h - 1, w, 1);
            g.fillRect(x, y, 1, h);
            g.fillRect(x + w - 1, y, 1, h);
        }
    }

    // a labelled button; inverse (black on white) when filled
    function button(g, label, x, y, filled, bright) {
        const w = textW(label, 1, filled) + 10, h = 11;
        g.fillStyle = filled ? (bright ? FILL : DIM) : (bright ? WHITE : DIM);
        box(g, x, y, w, h, filled);
        g.fillStyle = filled ? BLACK : (bright ? WHITE : DIM);
        text(g, label, x + 5, y + 2, 1, filled);
        return w;
    }

    function sliderPos(s) {
        return CX + Math.round((s.obj[s.key] - s.min) / (s.max - s.min) * TRACK);
    }

    // ------------------------------------------------------- drawing
    function draw(g) {
        regions = [];
        const list = items();
        if (sel >= list.length) sel = list.length - 1;

        g.fillStyle = WHITE;
        const title = 'CONFIGURATION';
        text(g, title, X0 + (SCREEN.W - textW(title, 2)) / 2, Y0 + 12, 2);

        // page tabs
        const widths = TABS.map((t, i) => textW(t, 1, i === tab) + 10);
        let tx = X0 + (SCREEN.W - (widths.reduce((a, b) => a + b, 0) + 8 * (TABS.length - 1))) / 2;
        TABS.forEach((t, i) => {
            const w = button(g, t, tx, Y0 + 36, i === tab, true);
            regions.push({ x: tx, y: Y0 + 36, w, h: 11, click: () => { tab = i; sel = 0; } });
            tx += w + 8;
        });

        // settings rows
        list.forEach((s, i) => {
            if (s.type === 'button') return;
            const y = ROW0 + i * ROWH;
            const active = i === sel;
            const row = { index: i, item: s };

            if (active) { g.fillStyle = WHITE; g.fillRect(LEFT, y + 1, 4, 4); }   // the ball as cursor
            g.fillStyle = active ? WHITE : DIM;
            text(g, s.label, LEFT + 9, y);

            const v = s.obj[s.key];
            if (s.type === 'toggle') {
                const w = button(g, v ? 'ON' : 'OFF', CX, y - 2, v, active);
                regions.push(Object.assign(row, { x: CX, y: y - 2, w, h: 11, click: () => setSetting(s, !s.obj[s.key]) }));
            } else if (s.type === 'choice') {
                let ox = CX;
                s.options.forEach(o => {
                    const w = button(g, String(o), ox, y - 2, v === o, active);
                    regions.push({ index: i, item: s, x: ox, y: y - 2, w, h: 11, click: () => setSetting(s, o) });
                    ox += w + 6;
                });
            } else {
                // track: solid up to the knob, dashed like the net after it
                const kx = sliderPos(s);
                g.fillStyle = active ? WHITE : DIM;
                g.fillRect(CX, y + 3, kx - CX, 1);
                for (let x = kx; x < CX + TRACK; x += 4) g.fillRect(x, y + 3, 2, 1);
                g.fillRect(CX + TRACK, y + 1, 1, 5);                      // end stop
                g.fillRect(CX, y + 1, 1, 5);
                g.fillStyle = WHITE;
                g.fillRect(kx - 2, y - 2, 4, 11);                         // paddle knob
                g.fillStyle = active ? WHITE : DIM;
                text(g, s.fmt ? s.fmt(v) : v, CX + TRACK + 8, y);
                regions.push(Object.assign(row, {
                    x: CX - 4, y: y - 3, w: TRACK + 8, h: 13,
                    drag: (rx) => setSetting(s, s.min + (rx - CX) / TRACK * (s.max - s.min))
                }));
            }
        });

        // DEFAULTS and BACK
        const btns = list.filter(s => s.type === 'button');
        const bw = btns.map(b => textW(b.label, 1, list.indexOf(b) === sel) + 10);
        let bx = X0 + (SCREEN.W - (bw.reduce((a, b) => a + b, 0) + 16 * (btns.length - 1))) / 2;
        const by = Y0 + 206;
        btns.forEach((b, j) => {
            const i = list.indexOf(b);
            const w = button(g, b.label, bx, by, i === sel, true);
            regions.push({ index: i, item: b, x: bx, y: by, w, h: 11, click: b.action });
            bx += w + 16;
        });
    }

    // ------------------------------------------------------- input

    // client coordinates -> raster coordinates, through the tube curvature
    function toRaster(clientX, clientY) {
        const r = Crt.canvas.getBoundingClientRect();
        let cx = (clientX - r.left) / r.width * 2 - 1;
        let cy = (clientY - r.top) / r.height * 2 - 1;
        const k = Crt.curvature();
        const fx = cx * (1 + k * cy * cy), fy = cy * (1 + k * cx * cx);
        return { x: X0 + (fx + 1) / 2 * SCREEN.W, y: Y0 + (fy + 1) / 2 * SCREEN.H };
    }

    function regionAt(p) {
        return regions.find(r => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
    }

    function step(s, dir) {
        if (!s) return;
        if (s.type === 'slider') setSetting(s, s.obj[s.key] + dir * s.step);
        else if (s.type === 'toggle') setSetting(s, dir > 0);
        else if (s.type === 'choice') {
            const i = s.options.indexOf(s.obj[s.key]);
            setSetting(s, s.options[Math.max(0, Math.min(s.options.length - 1, i + dir))]);
        }
    }

    function activate(s) {
        if (!s) return;
        if (s.type === 'toggle') setSetting(s, !s.obj[s.key]);
        else if (s.type === 'choice') {
            const i = s.options.indexOf(s.obj[s.key]);
            setSetting(s, s.options[(i + 1) % s.options.length]);
        } else if (s.type === 'button') s.action();
    }

    function handleKey(e) {
        if (!open) {
            if (e.key === 'c' || e.key === 'C') { openUI(); return true; }
            return false;
        }
        const list = items();
        switch (e.key) {
            case 'c': case 'C': case 'Escape': close(); break;
            case 'ArrowUp': sel = (sel + list.length - 1) % list.length; break;
            case 'ArrowDown': sel = (sel + 1) % list.length; break;
            case 'ArrowLeft': step(list[sel], -1); break;
            case 'ArrowRight': step(list[sel], 1); break;
            case ' ': case 'Enter': activate(list[sel]); break;
            case 'Tab': tab = (tab + (e.shiftKey ? TABS.length - 1 : 1)) % TABS.length; sel = 0; break;
            case '1': case '2': case '3': tab = +e.key - 1; sel = 0; break;
            default: return true;
        }
        e.preventDefault();
        return true;
    }

    function handleWheel(e) {
        const r = regionAt(toRaster(e.clientX, e.clientY));
        const target = r && r.item ? r.item : items()[sel];
        if (r && r.index !== undefined) sel = r.index;
        wheelAcc += e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        while (Math.abs(wheelAcc) >= 90) {
            const dir = wheelAcc > 0 ? -1 : 1;          // wheel up = more
            wheelAcc -= -dir * 90;
            step(target, dir);
        }
    }

    function handleDown(clientX, clientY) {
        const r = regionAt(toRaster(clientX, clientY));
        if (!r) return;
        if (r.index !== undefined) sel = r.index;
        if (r.drag) {
            dragging = r;
            r.drag(toRaster(clientX, clientY).x);
        } else if (r.click) {
            r.click();
        }
    }

    function handleMove(clientX, clientY) {
        if (dragging) dragging.drag(toRaster(clientX, clientY).x);
    }

    function handleUp() { dragging = null; }

    // the CONFIG key on the TV shows whether the screen is open
    function syncKey() {
        const k = document.querySelector('.key.config');
        if (k) k.classList.toggle('on', open);
    }
    function openUI() { open = true; sel = 0; syncKey(); }
    function close() { open = false; dragging = null; syncKey(); }
    function toggle() { if (open) close(); else openUI(); }

    return {
        isOpen: () => open,
        toggle,
        draw, handleKey, handleWheel, handleDown, handleMove, handleUp
    };
})();
