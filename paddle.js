// =====================================================================
//  Paddles
//  Left:  computer
//  Right: mouse wheel (arrow keys and touch also work)
// =====================================================================

const PADDLE_HOME = SCREEN.VBLANK + (SCREEN.H - PADDLE.height) / 2;

const leftPaddle  = { x: PADDLE.leftX,  y: PADDLE_HOME };
const rightPaddle = { x: PADDLE.rightX, y: PADDLE_HOME };
let rightTarget = PADDLE_HOME;   // where the wheel / keys / finger put the knob

const ai = { think: 0, aimY: SCREEN.VBLANK + SCREEN.H / 2 };

function clampPaddle(p) {
    if (p.y < PADDLE.minY) p.y = PADDLE.minY;
    if (p.y > PADDLE.maxY) p.y = PADDLE.maxY;
}

// Where will the ball's centre be when it reaches x? (with bounces)
function predictBallY(targetX) {
    const frames = Math.abs(ball.x - targetX) / Math.abs(ball.vx);
    const top = FIELD.top;
    const span = FIELD.bottom - BALL.size - top;
    let y = ball.y - top + ball.vy * frames;
    y = ((y % (2 * span)) + 2 * span) % (2 * span);
    if (y > span) y = 2 * span - y;
    return top + y + BALL.size / 2;
}

function moveToward(p, targetCenter, maxStep) {
    const d = targetCenter - (p.y + PADDLE.height / 2);
    p.y += Math.max(-maxStep, Math.min(maxStep, d));
}

function aiMove(p) {
    const incoming = mode === 'play' && ball.vx < 0;
    if (!incoming) {
        ai.think = 0;
        moveToward(p, SCREEN.VBLANK + SCREEN.H / 2, AI.idleSpeed);
        return;
    }
    if (--ai.think <= 0) {
        ai.think = AI.reactionFrames;
        const level = hits >= BALL.speedUpHits[1] ? 3 : hits >= BALL.speedUpHits[0] ? 2 : 1;
        const err = (Math.random() + Math.random() - 1) * AI.error * level;
        // aim with a random part of the paddle -> varied return angles
        const offset = (Math.random() - 0.5) * (PADDLE.height - 3);
        ai.aimY = predictBallY(p.x + PADDLE.width) + err - offset;
    }
    moveToward(p, ai.aimY, AI.maxSpeed);
}

function updatePaddles() {
    if (keys.ArrowUp)   rightTarget -= PADDLE.keySpeed;
    if (keys.ArrowDown) rightTarget += PADDLE.keySpeed;
    rightTarget = Math.max(PADDLE.minY, Math.min(PADDLE.maxY, rightTarget));
    // the paddle glides after the knob instead of jumping
    const d = rightTarget - rightPaddle.y;
    rightPaddle.y = Math.abs(d) < 0.05 ? rightTarget : rightPaddle.y + d * PADDLE.smoothing;
    aiMove(leftPaddle);
    clampPaddle(leftPaddle);
    clampPaddle(rightPaddle);
}

function drawPaddles(g) {
    g.fillRect(leftPaddle.x,  Math.floor(leftPaddle.y),  PADDLE.width, PADDLE.height);
    g.fillRect(rightPaddle.x, Math.floor(rightPaddle.y), PADDLE.width, PADDLE.height);
}
