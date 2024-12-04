const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game state variables
let leftScore = 0;
let rightScore = 0;
let gameOver = false;
let lastScorer = 'right';
let rallyCount = 0;
let isWaitingToServe = false;
let serveTimeout = null;

// Keyboard state
const keys = {
    ArrowUp: false,
    ArrowDown: false
};

document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Add touch event listeners
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    console.log(touch.clientY);
    if (touch.clientY < canvas.height / 2) {
        keys.ArrowDown = false;
        keys.ArrowUp = true; // Simulate ArrowUp
    } else {
        keys.ArrowUp = false;
        keys.ArrowDown = true; // Simulate ArrowDown
    }
});

canvas.addEventListener('touchend', () => {
    keys.ArrowUp = false; // Reset ArrowUp
    keys.ArrowDown = false; // Reset ArrowDown
});

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game area background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(GAME_AREA.x, GAME_AREA.y, GAME_AREA.width, GAME_AREA.height);
    
    // Update ball position
    moveBall();

    // Update paddle positions
    movePaddles();

    // Draw the paddles
    drawPaddle(leftPaddle.x, leftPaddle.y);
    drawPaddle(rightPaddle.x, rightPaddle.y);

    // Draw the ball
    drawBall();

    // Draw the score
    drawScore();
}

// Main game loop
function gameLoop() {
    // Always clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PLAY_AREA_COLOR;
    ctx.fillRect(GAME_AREA.x, GAME_AREA.y, GAME_AREA.width, GAME_AREA.height);
    
    // Always draw paddles
    ctx.fillStyle = ELEMENT_COLOR;
    drawPaddle(leftPaddle.x, leftPaddle.y);
    drawPaddle(rightPaddle.x, rightPaddle.y);
    
    // Always draw score
    drawScore();
    
    if (!gameOver) {
        // Game is running
        if (!isWaitingToServe) {
            drawBall();
        }
        movePaddles();
        moveBall();
    } else {
        // Game is over - draw final state
        ctx.font = '30px "Courier New"';
        ctx.fillStyle = ELEMENT_COLOR;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_AREA.x + (GAME_AREA.width/2), GAME_AREA.height/2);
    }
    
    requestAnimationFrame(gameLoop);
}

// Add new function for serve delay
function startServeDelay() {
    isWaitingToServe = true;
    rallyCount = 0; // Reset rally count on score
    clearTimeout(serveTimeout);
    serveTimeout = setTimeout(() => {
        isWaitingToServe = false;
        resetBall();
    }, 1000); // 1 second delay
}

gameLoop();
