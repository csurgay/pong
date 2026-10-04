// =====================================================================
//  Ball - 4 pixels x 4 lines
//  Vertical speed: latched from the paddle segment that was hit
//  Horizontal speed: 3 steps chosen by the speed counter (counts 4 and 12)
// =====================================================================

const ball = {
    x: BALL.serveX,
    y: SCREEN.VBLANK + SCREEN.H / 2,
    vx: BALL.speeds[0],
    vy: BALL.attractVy,
    visible: true
};

let hitCount = 0;   // speed counter (7493 F1), cleared on every miss and coin
let rallyHits = 0;  // the player's returns in this rally (for the computer)

function speedLevel() {
    if (hitCount >= BALL.counterSteps[1]) return 3;
    if (hitCount >= BALL.counterSteps[0]) return 2;
    return 1;
}

function ballSpeed() {
    return BALL.speeds[speedLevel() - 1];
}

// Vertical motion; it bounces at the edge of the playfield (VBLANK on
// the original board, or the dashed walls when they are enabled)
function moveBallVertical(silent) {
    const top = FIELD.top;
    const bottom = FIELD.bottom - BALL.size;
    ball.y += ball.vy;
    if (ball.y <= top) {
        ball.y = 2 * top - ball.y;
        ball.vy = Math.abs(ball.vy);
        if (!silent) Sound.play('wall');
    } else if (ball.y >= bottom) {
        ball.y = 2 * bottom - ball.y;
        ball.vy = -Math.abs(ball.vy);
        if (!silent) Sound.play('wall');
    }
}

// Coincidence of ball and paddle video = HIT. dirAway: +1 for the left
// paddle, -1 for the right one. As on the board, every field with
// coincidence is a hit (the direction flip-flop is simply set again).
function checkPaddleHit(p, dirAway) {
    const bx = Math.floor(ball.x), by = Math.floor(ball.y);
    const px = p.x, py = Math.floor(p.y);
    if (bx + BALL.size <= px || bx >= px + PADDLE.width) return false;
    if (by + BALL.size <= py || by >= py + PADDLE.height) return false;

    // The paddle line counter at the first coincident line is latched;
    // its bits B,C,D (one of 8 segments) give the vertical speed.
    const line = Math.max(by, py) - py;
    const n = PADDLE.segments.length;
    const seg = Math.min(n - 1, Math.floor(line * n / PADDLE.height));
    ball.vy = PADDLE.segments[seg];

    // the hit sound clocks the speed counter, which stops at 12
    hitCount = Math.min(BALL.counterSteps[1], hitCount + BALL.countsPerHit);
    ball.vx = dirAway * ballSpeed();
    Sound.play('paddle');
    return true;
}

function drawBall(g) {
    if (!ball.visible) return;
    g.fillRect(Math.floor(ball.x), Math.floor(ball.y), BALL.size, BALL.size);
}
