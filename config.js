// Display configuration
const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 500;
const BACKGROUND_COLOR = '#000';
const PLAY_AREA_COLOR = '#111';
const ELEMENT_COLOR = 'white';

// Game area configuration
const GAME_AREA = {
    x: 63,                    // Left margin
    y: 0,                     // Top margin
    width: 625,               // Playable width
    height: CANVAS_HEIGHT     // Playable height
};

// Ball configuration
const BALL_CONFIG = {
    size: 9,                  // Ball size in pixels
    initialSpeed: 6,          // Base ball speed
    serveDistance: 50         // Distance from paddle when serving
};

// Paddle configuration
const PADDLE_CONFIG = {
    width: 10,               // Paddle width
    height: 63,              // Paddle height
    speed: 8,                // Paddle movement speed
    margin: 10,              // Distance from game area edge
    hitAngleUpperLimit: 6,   // Maximum angle when hitting upper/lower thirds
    hitAngleMiddleLimit: 2   // Maximum angle when hitting middle third
};

// Scoring configuration
const SCORE_CONFIG = {
    winning: 15,             // Points needed to win
    yPosition: 60,           // Vertical position of score display
    segmentWidth: 30,        // Width of score segment
    segmentHeight: 30,       // Height of score segment
    segmentGap: 8            // Gap between segments
};

// Timing configuration
const TIMING = {
    serveDelay: 1000,       // Delay before serving (milliseconds)
    aiMissThreshold: 7      // Rally count when AI starts missing
};

// Center line configuration
const CENTER_LINE = {
    width: 10,              // Width of center line segments
    height: 10,             // Height of center line segments
    gap: 20                 // Gap between segments
};
