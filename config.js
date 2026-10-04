// =====================================================================
//  PONG (Atari, 1972) - hardware-faithful parameters
//
//  All coordinates are the RAW COUNTER VALUES of the original board:
//    x = horizontal counter (0..454, 7.16 MHz pixel clock)
//    y = vertical counter   (0..261, one scan line each)
//  The first 80 H counts and the first 16 lines are blanking, so the
//  visible picture is H 80..454 x V 16..261 (375 x 246).
//
//  Sources:
//    Dr. H. Holden, "Atari Pong E circuit analysis"
//      https://www.pong-story.com/LAWN_TENNIS.pdf
//    Paul Falstad, Pong circuit simulation
//      https://www.falstad.com/pong/
// =====================================================================

const SCREEN = {
    HBLANK: 80,          // H 0..79 blanked
    HTOTAL: 455,         // H counter 0..454
    VBLANK: 16,          // V 0..15 blanked
    VTOTAL: 262,         // V counter 0..261
    W: 375,              // visible width  (455 - 80)
    VIEW_X: 69,          // left edge of the tube's view: the picture is
                         // centred on the net (256 - 187), as the
                         // monitors were adjusted; the paddles at 128H
                         // and 384H are symmetric around it
    H: 246,              // visible height (262 - 16)
    FPS: 60,             // one field = one simulation step
    ASPECT: 4 / 3        // shown on a 4:3 tube (non-square pixels)
};

const COLORS = {
    phosphor: '#eef2ff', // slightly bluish white of a B/W TV phosphor
    afterglow: '#ffe6b4',// warmer tint of the decaying afterglow
    black: '#000'
};

// Net: displayed when the H counter hits 256, on/off every 4 lines (4V)
const NET = { x: 256, width: 1, dashLines: 4 };

// Top and bottom boundary lines. Not on the Atari arcade board (there the
// ball bounces off the edge of the picture), but several 1970s Pong
// versions drew dashed walls. With walls on, the ball bounces off them.
const WALLS = {
    enabled: true,
    thickness: 4,        // lines, as thick as the ball
    inset: 10,           // lines between the picture edge and the wall
    dash: 8,             // pixels lit
    gap: 8,              // pixels dark
    phase: 0             // horizontal offset of the dash pattern
};

// Playfield: where the ball bounces vertically
const FIELD = {
    top: SCREEN.VBLANK + (WALLS.enabled ? WALLS.inset + WALLS.thickness : 0),
    bottom: SCREEN.VTOTAL - (WALLS.enabled ? WALLS.inset + WALLS.thickness : 0)
};

const PADDLE = {
    width: 4,            // 4 pixels
    height: 20,          // original board: 15 lines (7493 counter stops at 15);
                         // made longer here for easier play
    leftX: 128,          // starts at 128H
    rightX: 384,         // starts at 256H + 128H
    // Paddle 555 one-shots are triggered at 256V; their delay sets the
    // paddle's top line. Very short delays (low control voltage) do not
    // work, so the paddle cannot reach the top: a ball hugging the top
    // edge can sneak past. Long delays have no such limit - the paddle
    // reaches the bottom edge.
    minY: FIELD.top + 8,         // top gap: size estimated
    maxY: FIELD.bottom - 20,     // reaches the bottom of the field
    // Paddle line counter bits B,C,D: the paddle is split into 8 equal
    // segments (2 lines each on the 15-line original), top->bottom
    // -> vertical load value 13..7, 10 = no vertical motion.
    // Stored here as lines/frame (negative = up).
    segments: [-3, -2, -1, 0, 0, 1, 2, 3],
    wheelSensitivity: 0.06,  // mouse wheel: lines per wheel pixel (1 notch ~ 6 lines)
    // Wheel acceleration: slow turning stays fine, fast spinning moves
    // the paddle further per notch (speed measured in wheel pixels/s)
    wheelAccelStart: 700,    // below this speed: no acceleration (a single notch)
    wheelAccelRange: 800,    // every further 800 px/s adds 1x
    wheelMaxGain: 2.5,       // at most 2.5x (~15 lines per notch)
    keySpeed: 3,             // arrow keys: lines per frame
    smoothing: 0.5           // the paddle glides towards the wheel position
                             // (fraction of the distance per field)
};

const BALL = {
    size: 4,                     // 4 pixels x 4 lines
    speeds: [2, 3, 4],           // pixels/frame: MOVE pulse lasts 2, 3 or 4 lines
    // Speed counter (7493 F1): MOVE gets longer at counts 4 and 12, and the
    // counter stops at 12. It is clocked by the 491 Hz hit sound, which
    // runs for one field per hit -> about 8 counts per hit. So the ball
    // speeds up after the 1st hit and reaches top speed after the 2nd.
    counterSteps: [4, 12],
    countsPerHit: 3,             // original: 8; 3 = gentler speed-up (2nd and 4th hit)
    attractVy: 3,                // attract mode: maximum vertical speed
    serveDelay: 1.7,             // serve 555 timer, seconds, ball invisible
    serveX: 258                  // ball reappears just right of the net
};

const SCORE = {
    winning: 11,         // PCB switch: 11 or 15
    top: 32,             // digits occupy lines 32V..63V
    digitW: 16,          // horizontal segments are 16H long
    digitH: 32,
    stroke: 4,           // vertical segments are 4H wide, like the paddle
    // Score window: left 128H..191H, right 320H..383H (256H,128H,64H).
    // 32H selects tens/units, the digit itself is drawn while 16H is high
    // (FE strokes at 16..19, BC strokes at 28..31 within each 32H slot).
    leftTensX: 144,
    rightTensX: 336,
    digitStep: 32,
    showInAttract: true  // the score video is not gated by ATTRACT: the final
                         // score stays on screen until the next coin
};

const SOUND = {
    volume: 0.12,
    paddle: { hz: 491, ms: 16 },   // 16V tap, one field
    wall:   { hz: 246, ms: 16 },   // 32V tap, one field
    score:  { hz: 246, ms: 242 }   // 32V tap, 555 one-shot 242 ms
};

const CRT = {
    persistence: 0.5,    // afterglow kept per field (0..1): short tail of ~4 fields
    scanlineStrength: 0.9,
    beamCenter: 0.32,    // where the beam sits inside one line (0..1)
    beamWidth: 0.22,     // gaussian sigma of the beam, in line heights
    bloom: 0.75,         // strength of the glow around bright objects
    bloomRadius: 1.3,    // in native pixels
    curvature: 0.06,     // barrel distortion of the curved tube face (WebGL)
    glassBlack: 0.095    // black level of the grey-green tube glass
};

// Computer player on the left (the original was 2-player only).
// Tuned to play like a decent human: limited knob speed, reaction
// delay and aiming error that grows with the ball speed.
const AI = {
    maxSpeed: 4,         // lines/frame
    reactionFrames: 5,   // how often it re-estimates the ball
    error: 3,            // aiming error in lines, multiplied by speed level
    idleSpeed: 1,
    missAfter: 4,        // after the player's 4th return in a rally the
                         // computer deliberately misses (0 = never)
    missSteep: false     // ON: the computer misses every steep ball
                         // (vertical speed 3 lines/field, hit with a paddle edge)
};
