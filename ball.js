// Initialize game objects with configuration
const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    size: BALL_CONFIG.size,
    speedX: BALL_CONFIG.initialSpeed,
    speedY: BALL_CONFIG.initialSpeed
};

// Simplify resetBall to just reset position
function resetBall() {
    if (lastScorer === 'right') {
        // Serve from left side
        ball.x = GAME_AREA.x + 50;
        ball.speedX = Math.abs(ball.speedX); // Force ball to go right
        lastScorer = 'left';
    } else {
        // Serve from right side
        ball.x = GAME_AREA.x + GAME_AREA.width - 50;
        ball.speedX = -Math.abs(ball.speedX); // Force ball to go left
        lastScorer = 'right';
    }
    
    // Randomize Y position near the serving paddle
    ball.y = Math.random() * (GAME_AREA.height - 100) + 50;
    ball.speedY = Math.random() * 10 - 5;
}

// Add new function for ball angle adjustment
function adjustBallAngle(hitLocation, paddleVelocity) {
    let baseSpeed;
    
    // Middle third
    if (hitLocation > 0.33 && hitLocation < 0.66) {
        baseSpeed = Math.random() * 4 - 2; // Smaller angle
    }
    // Upper third
    else if (hitLocation <= 0.33) {
        baseSpeed = -Math.random() * 6 - 3; // Smaller extreme upward angle
    }
    // Lower third
    else {
        baseSpeed = Math.random() * 6 + 3; // Smaller extreme downward angle
    }

    // Add paddle velocity influence (scaled down to not be too extreme)
    ball.speedY = baseSpeed + (paddleVelocity * 0.5);
}

function drawBall() {
    ctx.fillStyle = 'white';
    // Draw square instead of circle
    ctx.fillRect(ball.x - ball.size/2, ball.y - ball.size/2, ball.size, ball.size);
}

function moveBall() {
    if (gameOver || isWaitingToServe) return;
    
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Top and bottom collisions
    if (ball.y + ball.size/2 > GAME_AREA.height || ball.y - ball.size/2 < 0) {
        ball.speedY = -ball.speedY;
    }

    // Paddle collisions
    if (ball.speedX < 0) {
        if (ball.x - ball.size/2 < leftPaddle.x + PADDLE_CONFIG.width && 
            ball.x - ball.size/2 > leftPaddle.x && 
            ball.y + ball.size/2 > leftPaddle.y && 
            ball.y - ball.size/2 < leftPaddle.y + PADDLE_CONFIG.height) {
            
            const hitLocation = (ball.y - leftPaddle.y) / PADDLE_CONFIG.height;
            adjustBallAngle(hitLocation, leftPaddleVelocity);
            ball.speedX = -ball.speedX;
        }
    } else {
        if (ball.x + ball.size/2 > rightPaddle.x && 
            ball.x + ball.size/2 < rightPaddle.x + PADDLE_CONFIG.width && 
            ball.y + ball.size/2 > rightPaddle.y && 
            ball.y - ball.size/2 < rightPaddle.y + PADDLE_CONFIG.height) {
            
            const hitLocation = (ball.y - rightPaddle.y) / PADDLE_CONFIG.height;
            adjustBallAngle(hitLocation, rightPaddleVelocity);
            ball.speedX = -ball.speedX;
            rallyCount++;
        }
    }

    // Scoring
    if (ball.x < GAME_AREA.x) {
        rightScore++;
        if (rightScore >= SCORE_CONFIG.winning) {
            gameOver = { hasShownFinal: false };
        } else {
            lastScorer = 'right';
            startServeDelay();
        }
    } else if (ball.x > GAME_AREA.x + GAME_AREA.width) {
        leftScore++;
        if (leftScore >= SCORE_CONFIG.winning) {
            gameOver = { hasShownFinal: false };
        } else {
            lastScorer = 'left';
            startServeDelay();
        }
    }
}

