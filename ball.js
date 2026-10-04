// =====================================================================
//  Ball - 4 pixels x 4 lines
//  Vertical speed: latched from the paddle segment that was hit
//  Horizontal speed: 3 steps chosen by the hit counter (after 4 and 12 hits)
// =====================================================================

const ball = {
    x: BALL.serveX,
    y: SCREEN.VBLANK + SCREEN.H / 2,
    vx: BALL.speeds[0],
    vy: BALL.attractVy,
    visible: true
};

let hits = 0; // hit counter, cleared on every miss

function ballSpeed() {
    if (hits >= BALL.speedUpHits[1]) return BALL.speeds[2];
    if (hits >= BALL.speedUpHits[0]) return BALL.speeds[1];
    return BALL.speeds[0];
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

// Coincidence of ball and paddle video. dirAway: +1 for the left paddle,
// -1 for the right one. Returns true on a hit.
function checkPaddleHit(p, dirAway) {
    if (Math.sign(ball.vx) === dirAway) return false;   // already moving away

    const bx = Math.floor(ball.x), by = Math.floor(ball.y);
    const px = p.x, py = Math.floor(p.y);
    if (bx + BALL.size <= px || bx >= px + PADDLE.width) return false;
    if (by + BALL.size <= py || by >= py + PADDLE.height) return false;

    // The paddle line counter at the first coincident line selects the
    // segment; the vertical speed is latched from it.
    const line = Math.max(by, py) - py;
    const n = PADDLE.segments.length;
    const seg = Math.min(n - 1, Math.floor(line * n / PADDLE.height));
    ball.vy = PADDLE.segments[seg];

    hits++;
    ball.vx = dirAway * ballSpeed();
    Sound.play('paddle');
    return true;
}

function drawBall(g) {
    if (!ball.visible) return;
    g.fillRect(Math.floor(ball.x), Math.floor(ball.y), BALL.size, BALL.size);
}
