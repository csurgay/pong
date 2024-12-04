const leftPaddle = {
    x: GAME_AREA.x + PADDLE_CONFIG.margin,
    y: CANVAS_HEIGHT / 2 - PADDLE_CONFIG.height / 2,
    speed: PADDLE_CONFIG.speed
};

const rightPaddle = {
    x: GAME_AREA.x + GAME_AREA.width - PADDLE_CONFIG.width - PADDLE_CONFIG.margin,
    y: CANVAS_HEIGHT / 2 - PADDLE_CONFIG.height / 2,
    speed: PADDLE_CONFIG.speed
};

// Paddle velocity tracking
let leftPaddleVelocity = 0;
let rightPaddleVelocity = 0;
let lastLeftPaddleY = 0;
let lastRightPaddleY = 0;

function drawPaddle(x, y) {
    ctx.fillStyle = ELEMENT_COLOR;
    ctx.fillRect(x, y, PADDLE_CONFIG.width, PADDLE_CONFIG.height);
}

// Update movePaddles function to include AI
function movePaddles() {
    // Store previous positions to calculate velocity
    lastLeftPaddleY = leftPaddle.y;
    lastRightPaddleY = rightPaddle.y;

    // AI for left paddle with intentional miss after 7 human hits
    const paddleCenter = leftPaddle.y + PADDLE_CONFIG.height/2;
    let ballPrediction = ball.y;
    
    // Only move if ball is coming towards AI
    if (ball.speedX < 0) {
        if (rallyCount >= 7) {
            // Intentionally miss
            ballPrediction = Math.random() > 0.5 ? -50 : canvas.height + 50;
        } else {
            // Normal AI behavior with some randomness
            ballPrediction += (Math.random() * 30 - 15);
        }

        if (Math.random() > 0.1) {
            if (paddleCenter < ballPrediction - 10) {
                leftPaddle.y += leftPaddle.speed * (Math.random() * 0.8 + 0.2);
            } else if (paddleCenter > ballPrediction + 10) {
                leftPaddle.y -= leftPaddle.speed * (Math.random() * 0.8 + 0.2);
            }
        }
    }
    
    // Keep AI paddle within bounds
    if (leftPaddle.y < 0) leftPaddle.y = 0;
    if (leftPaddle.y > canvas.height - PADDLE_CONFIG.height) {
        leftPaddle.y = canvas.height - PADDLE_CONFIG.height;
    }

    // Right paddle (human player)
    if (keys.ArrowUp && rightPaddle.y > 0) {
        rightPaddle.y -= rightPaddle.speed;
    }
    if (keys.ArrowDown && rightPaddle.y < canvas.height - PADDLE_CONFIG.height) {
        rightPaddle.y += rightPaddle.speed;
    }

    // Calculate paddle velocities
    leftPaddleVelocity = leftPaddle.y - lastLeftPaddleY;
    rightPaddleVelocity = rightPaddle.y - lastRightPaddleY;
}
