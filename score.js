// =====================================================================
//  Score and net
//  Digits come from a 7448 BCD-to-7-segment decoder: this chip draws
//  6 without its top bar and 9 without its bottom bar.
//  Tens digit: only a "1" from a flip-flop, blank below 10 (no leading 0).
//  32H selects tens/units, 64H selects the left/right score.
//  Segment timing (MAME netlist): a = 32V..35V, g = 44V..47V,
//  d = 60V..63V, f/b = 32V..47V, e/c = 48V..63V.
// =====================================================================

let leftScore = 0;
let rightScore = 0;

const DIGIT_SEGMENTS = [
    'abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg',
    'acdfg', 'cdefg', 'abc', 'abcdefg', 'abcfg'
];

function drawDigit(g, n, x, y) {
    const w = SCORE.digitW, h = SCORE.digitH, s = SCORE.stroke;
    const half = h / 2;
    const rects = {
        a: [0, 0, w, s],
        b: [w - s, 0, s, half],
        c: [w - s, half, s, half],
        d: [0, h - s, w, s],
        e: [0, half, s, half],
        f: [0, 0, s, half],
        g: [0, half - s, w, s]       // 44V..47V: bottom of the upper half
    };
    for (const seg of DIGIT_SEGMENTS[n]) {
        const r = rects[seg];
        g.fillRect(x + r[0], y + r[1], r[2], r[3]);
    }
}

function drawNumber(g, value, tensX) {
    if (value >= 10) drawDigit(g, 1, tensX, SCORE.top);
    drawDigit(g, value % 10, tensX + SCORE.digitStep, SCORE.top);
}

function drawScore(g) {
    drawNumber(g, leftScore, SCORE.leftTensX);
    drawNumber(g, rightScore, SCORE.rightTensX);
}

// 256H, gated by 4V: four lines on, four lines off
function drawNet(g) {
    const d = NET.dashLines;
    // with walls the net only spans the playfield between them
    const y0 = WALLS.enabled ? FIELD.top : SCREEN.VBLANK;
    const y1 = WALLS.enabled ? FIELD.bottom : SCREEN.VTOTAL;
    for (let y = y0; y < y1; y += 2 * d) {
        g.fillRect(NET.x, y, NET.width, Math.min(d, y1 - y));
    }
}

// Optional dashed top and bottom walls across the whole picture
function drawWalls(g) {
    if (!WALLS.enabled) return;
    const x0 = SCREEN.HBLANK, x1 = SCREEN.HTOTAL;
    const period = WALLS.dash + WALLS.gap;
    for (let x = x0 + WALLS.phase; x < x1; x += period) {
        const w = Math.min(WALLS.dash, x1 - x);
        g.fillRect(x, FIELD.top - WALLS.thickness, w, WALLS.thickness);
        g.fillRect(x, FIELD.bottom, w, WALLS.thickness);
    }
}
