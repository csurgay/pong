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
//  Controls: SPACE / ENTER / click = coin, mouse wheel = right paddle
// =====================================================================

let mode = 'attract';
let serveTimer = 0;
let serveDir = 1;

const keys = { ArrowUp: false, ArrowDown: false };

// ----------------------------------------------------------- game flow

function insertCoin() {
    Sound.unlock();
    if (mode !== 'attract') return;
    leftScore = 0;
    rightScore = 0;
    serveDir = Math.random() < 0.5 ? -1 : 1;
    startServe();
}

function startServe() {
    mode = 'serve';
    serveTimer = BALL.serveDelay;
    ball.visible = false;
    hits = 0;
}

function serve() {
    mode = 'play';
    hits = 0;
    ball.x = BALL.serveX;
    ball.vx = serveDir * ballSpeed();
    ball.visible = true;
}

function point(scorer) {
    Sound.play('score');
    if (scorer === 'left') leftScore++; else rightScore++;
    // the ball is served towards the player who missed
    serveDir = scorer === 'left' ? 1 : -1;
    if (leftScore >= SCORE.winning || rightScore >= SCORE.winning) {
        enterAttract();
    } else {
        startServe();
    }
}

function enterAttract() {
    mode = 'attract';
    ball.x = BALL.serveX;
    ball.vx = (Math.random() < 0.5 ? -1 : 1) * BALL.speeds[0];
    ball.vy = (Math.random() < 0.5 ? -1 : 1) * BALL.attractVy;
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
    if (!checkPaddleHit(leftPaddle, 1)) checkPaddleHit(rightPaddle, -1);

    // a miss is the ball video meeting horizontal blanking
    if (ball.x < left) point('right');
    else if (ball.x > right) point('left');
}

function render() {
    const g = Crt.g;
    g.fillStyle = COLORS.black;
    g.fillRect(SCREEN.VIEW_X, SCREEN.VBLANK, SCREEN.W, SCREEN.H);
    g.fillStyle = '#fff';             // beam on; the CRT stage tints it

    drawNet(g);
    drawWalls(g);
    if (mode !== 'attract' || SCORE.showInAttract) drawScore(g);
    if (mode !== 'attract') drawPaddles(g);
    drawBall(g);

    Crt.present();
}

// ----------------------------------------------------------- input

document.addEventListener('keydown', (e) => {
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

Crt.canvas.addEventListener('mousedown', insertCoin);

// Touch: the finger's height is the right paddle's position, a tap is a coin
function handleTouch(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    rightTarget = Crt.clientToLine(t.clientY) - PADDLE.height / 2;
}
Crt.canvas.addEventListener('touchstart', (e) => { insertCoin(); handleTouch(e); }, { passive: false });
Crt.canvas.addEventListener('touchmove', handleTouch, { passive: false });

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
        step();
        acc -= STEP;
        stepped = true;
    }
    if (stepped) render();
    requestAnimationFrame(loop);
}

enterAttract();
render();
requestAnimationFrame(loop);
