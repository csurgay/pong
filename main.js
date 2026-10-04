// =====================================================================
//  Game flow, input and the fixed 60 Hz loop
//
//  attract : no bats, no score, silent ball bouncing off all four edges
//            at maximum vertical speed
//  serve   : after a miss the ball is invisible for 1.7 s (its vertical
//            motion keeps running), then it reappears just right of the
//            net, moving towards the player who missed, at the slowest
//            speed
//  play    : normal game, first to 11 points
//
//  Controls: SPACE / ENTER / click = coin, mouse wheel = right paddle,
//            C = Configuration screen (the game pauses while it is open)
// =====================================================================

let mode = 'attract';
let serveTimer = 0;
let serveDir = 1;

const keys = { ArrowUp: false, ArrowDown: false };

// ----------------------------------------------------------- game flow

// RESET key: a new game from 0 : 0 at any time
function resetGame() {
    Sound.unlock();
    if (ConfigUI.isOpen()) ConfigUI.toggle();
    mode = 'attract';
    insertCoin();
}

function insertCoin() {
    Sound.unlock();
    if (mode !== 'attract') return;
    leftScore = 0;
    rightScore = 0;
    // The direction flip-flop is not touched by the coin: the first serve
    // goes the way the attract-mode ball was moving. The vertical-velocity
    // latches are cleared during attract (= maximum vertical speed) and
    // stay so until the first hit, so the first serve keeps that steep angle.
    serveDir = Math.sign(ball.vx) || 1;
    startServe();
}

function startServe() {
    mode = 'serve';
    serveTimer = BALL.serveDelay;
    ball.visible = false;
    hitCount = 0;
}

function serve() {
    mode = 'play';
    hitCount = 0;
    rallyHits = 0;
    ball.x = BALL.serveX;
    ball.vx = serveDir * ballSpeed();
    ball.visible = true;
}

function point(scorer) {
    if (scorer === 'left') leftScore++; else rightScore++;
    // the ball is served towards the player who missed (the direction
    // flip-flop is not changed by a miss)
    serveDir = scorer === 'left' ? 1 : -1;
    if (leftScore >= SCORE.winning || rightScore >= SCORE.winning) {
        // StopG -> ATTRACT at once, which also mutes the sound (C1B):
        // the final point is silent
        enterAttract(true);
    } else {
        Sound.play('score');
        startServe();
    }
}

// Attract mode: the velocity latches are cleared (maximum vertical speed)
// and the ball reverses at the left/right edges. At game over the ball
// simply bounces back from the edge where it was missed.
function enterAttract(atGameOver) {
    mode = 'attract';
    hitCount = 0;
    if (atGameOver) {
        const left = SCREEN.HBLANK, right = SCREEN.HTOTAL - BALL.size;
        ball.x = Math.max(left, Math.min(right, ball.x));
        ball.vx = -Math.sign(ball.vx) * BALL.speeds[0];
    } else {                                   // power-on
        ball.x = BALL.serveX;
        ball.vx = (Math.random() < 0.5 ? -1 : 1) * BALL.speeds[0];
    }
    ball.vy = (ball.vy < 0 ? -1 : 1) * BALL.attractVy;
    ball.visible = true;
}

// ----------------------------------------------------------- one field

function step() {
    updatePaddles();

    const left = SCREEN.HBLANK;
    const right = SCREEN.HTOTAL - BALL.size;

    if (mode === 'attract') {
        moveBallVertical(true);
        ball.x += ball.vx;
        if (ball.x <= left) { ball.x = 2 * left - ball.x; ball.vx = Math.abs(ball.vx); }
        else if (ball.x >= right) { ball.x = 2 * right - ball.x; ball.vx = -Math.abs(ball.vx); }
        return;
    }

    if (mode === 'serve') {
        moveBallVertical(true);
        serveTimer -= 1 / SCREEN.FPS;
        if (serveTimer <= 0) serve();
        return;
    }

    // play
    moveBallVertical(false);
    ball.x += ball.vx;
    const towardsRight = ball.vx > 0;
    if (!checkPaddleHit(leftPaddle, 1)) {
        if (checkPaddleHit(rightPaddle, -1) && towardsRight) rallyHits++;
    }

    // a miss is the ball video meeting horizontal blanking
    if (ball.x < left) point('right');
    else if (ball.x > right) point('left');
}

function render() {
    const g = Crt.g;
    g.fillStyle = COLORS.black;
    g.fillRect(SCREEN.VIEW_X, SCREEN.VBLANK, SCREEN.W, SCREEN.H);
    g.fillStyle = '#fff';             // beam on; the CRT stage tints it

    if (ConfigUI.isOpen()) {
        ConfigUI.draw(g);
        Crt.present();
        return;
    }

    drawNet(g);
    drawWalls(g);
    if (mode !== 'attract' || SCORE.showInAttract) drawScore(g);
    if (mode !== 'attract') drawPaddles(g);
    drawBall(g);

    Crt.present();
}

// ----------------------------------------------------------- input

document.addEventListener('keydown', (e) => {
    Sound.unlock();
    if (ConfigUI.handleKey(e)) return;
    if (e.key in keys) { keys[e.key] = true; e.preventDefault(); }
    if (e.key === ' ' || e.key === 'Enter') { insertCoin(); e.preventDefault(); }
    Sound.unlock();
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

window.addEventListener('blur', () => { keys.ArrowUp = keys.ArrowDown = false; });

// Mouse wheel turns the right player's knob, with acceleration:
// the wheel speed is the amount turned in the last 150 ms
const wheelHistory = [];   // [time, |delta|]
const WHEEL_WINDOW = 150;  // ms

window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (ConfigUI.isOpen()) { ConfigUI.handleWheel(e); return; }
    let d = e.deltaY;
    if (e.deltaMode === 1) d *= 16;              // lines
    else if (e.deltaMode === 2) d *= SCREEN.H;   // pages

    const now = performance.now();
    wheelHistory.push([now, Math.abs(d)]);
    while (wheelHistory.length && now - wheelHistory[0][0] > WHEEL_WINDOW) wheelHistory.shift();
    const rate = wheelHistory.reduce((s, h) => s + h[1], 0) / (WHEEL_WINDOW / 1000);   // px/s
    const gain = Math.min(PADDLE.wheelMaxGain,
        1 + Math.max(0, rate - PADDLE.wheelAccelStart) / PADDLE.wheelAccelRange);

    rightTarget += d * PADDLE.wheelSensitivity * gain;
    rightTarget = Math.max(PADDLE.minY, Math.min(PADDLE.maxY, rightTarget));
}, { passive: false });

// the CONFIG key on the TV
const configKey = document.querySelector('.key.config');
if (configKey) configKey.addEventListener('click', () => { Sound.unlock(); ConfigUI.toggle(); });

// the RESET key on the TV (a momentary push-button)
const resetKey = document.querySelector('.key.reset');
if (resetKey) {
    resetKey.addEventListener('mousedown', () => resetKey.classList.add('pressed'));
    window.addEventListener('mouseup', () => resetKey.classList.remove('pressed'));
    resetKey.addEventListener('click', resetGame);
}

Crt.canvas.addEventListener('mousedown', (e) => {
    if (ConfigUI.isOpen()) ConfigUI.handleDown(e.clientX, e.clientY);
    else insertCoin();
});
window.addEventListener('mousemove', (e) => ConfigUI.handleMove(e.clientX, e.clientY));
window.addEventListener('mouseup', () => ConfigUI.handleUp());

// Touch: the finger's height is the right paddle's position, a tap is a coin
function handleTouch(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    rightTarget = Crt.clientToLine(t.clientY) - PADDLE.height / 2;
}
Crt.canvas.addEventListener('touchstart', (e) => {
    if (ConfigUI.isOpen()) {
        e.preventDefault();
        const t = e.touches[0];
        if (t) ConfigUI.handleDown(t.clientX, t.clientY);
        return;
    }
    insertCoin();
    handleTouch(e);
}, { passive: false });
Crt.canvas.addEventListener('touchmove', (e) => {
    if (ConfigUI.isOpen()) {
        e.preventDefault();
        const t = e.touches[0];
        if (t) ConfigUI.handleMove(t.clientX, t.clientY);
        return;
    }
    handleTouch(e);
}, { passive: false });
Crt.canvas.addEventListener('touchend', () => ConfigUI.handleUp());

// ----------------------------------------------------------- loop
// Fixed 60 Hz simulation, independent of the monitor refresh rate.

const STEP = 1 / SCREEN.FPS;
let last = performance.now();
let acc = 0;

function loop(now) {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    let stepped = false;
    while (acc >= STEP) {
        if (!ConfigUI.isOpen()) step();     // paused while configuring
        acc -= STEP;
        stepped = true;
    }
    if (stepped) render();
    requestAnimationFrame(loop);
}

enterAttract();
render();
requestAnimationFrame(loop);
