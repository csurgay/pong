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

// Initialize game objects with configuration
const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    size: BALL_CONFIG.size,
    speedX: BALL_CONFIG.initialSpeed,
    speedY: BALL_CONFIG.initialSpeed
};

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

// Keyboard state
const keys = {
    ArrowUp: false,
    ArrowDown: false
};

document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function drawBall() {
    ctx.fillStyle = 'white';
    // Draw square instead of circle
    ctx.fillRect(ball.x - ball.size/2, ball.y - ball.size/2, ball.size, ball.size);
}

function drawPaddle(x, y) {
    ctx.fillStyle = ELEMENT_COLOR;
    ctx.fillRect(x, y, PADDLE_CONFIG.width, PADDLE_CONFIG.height);
}

function drawScore() {
    ctx.fillStyle = ELEMENT_COLOR;
    ctx.textAlign = 'center';
    
    // Format scores with leading zeros
    const leftScoreFormatted = String(leftScore).padStart(2, '0');
    const rightScoreFormatted = String(rightScore).padStart(2, '0');
    
    // Draw left score - draw each digit separately
    drawSegmentedNumber(parseInt(leftScoreFormatted[0]), GAME_AREA.x + (GAME_AREA.width / 4) - 25, SCORE_CONFIG.yPosition);
    drawSegmentedNumber(parseInt(leftScoreFormatted[1]), GAME_AREA.x + (GAME_AREA.width / 4) + 25, SCORE_CONFIG.yPosition);
    
    // Draw right score - draw each digit separately
    drawSegmentedNumber(parseInt(rightScoreFormatted[0]), GAME_AREA.x + (GAME_AREA.width * 3/4) - 25, SCORE_CONFIG.yPosition);
    drawSegmentedNumber(parseInt(rightScoreFormatted[1]), GAME_AREA.x + (GAME_AREA.width * 3/4) + 25, SCORE_CONFIG.yPosition);
    
    // Draw the center line
    for(let i = 0; i < GAME_AREA.height; i += CENTER_LINE.gap) {
        ctx.fillRect(GAME_AREA.x + (GAME_AREA.width/2) - CENTER_LINE.width/2, i, CENTER_LINE.width, CENTER_LINE.height);
    }
}

function drawSegmentedNumber(num, x, y) {
    const segmentWidth = 30;
    const segmentHeight = 30;
    const gap = 8;
    
    // Define segments for each number (0-9)
    const segments = {
        0: [1,1,1,1,1,1,0], // top, topRight, bottomRight, bottom, bottomLeft, topLeft, middle
        1: [0,1,1,0,0,0,0],
        2: [1,1,0,1,1,0,1],
        3: [1,1,1,1,0,0,1],
        4: [0,1,1,0,0,1,1],
        5: [1,0,1,1,0,1,1],
        6: [1,0,1,1,1,1,1],
        7: [1,1,1,0,0,0,0],
        8: [1,1,1,1,1,1,1],
        9: [1,1,1,1,0,1,1]
    };

    const drawSegment = (x, y, horizontal) => {
        if (horizontal) {
            ctx.fillRect(x, y, segmentWidth, gap);
        } else {
            ctx.fillRect(x, y, gap, segmentHeight);
        }
    };

    const segs = segments[num];
    
    // Draw segments
    if (segs[0]) drawSegment(x - segmentWidth/2, y, true);                    // top
    if (segs[1]) drawSegment(x + segmentWidth/2 - gap, y, false);            // topRight
    if (segs[2]) drawSegment(x + segmentWidth/2 - gap, y + segmentHeight, false); // bottomRight
    if (segs[3]) drawSegment(x - segmentWidth/2, y + segmentHeight*2, true); // bottom
    if (segs[4]) drawSegment(x - segmentWidth/2, y + segmentHeight, false);  // bottomLeft
    if (segs[5]) drawSegment(x - segmentWidth/2, y, false);                  // topLeft
    if (segs[6]) drawSegment(x - segmentWidth/2, y + segmentHeight, true);   // middle
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

gameLoop();
