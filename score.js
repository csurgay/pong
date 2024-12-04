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
