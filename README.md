# Pong

A browser version of the original **Atari Pong (1972)** arcade game, rebuilt
to follow the TTL board as closely as possible and shown on an emulated
black-and-white CRT in a late-1960s style wooden table-top TV.

You can try it here: https://csurgay.com/pong

<img width="1284" height="880" alt="image" src="https://github.com/user-attachments/assets/2954c582-4dfc-447c-b0ca-f929ef11bada" />

![image](https://github.com/user-attachments/assets/e62a3f93-6f24-44e9-b38d-ecf4a2370790)

## Controls

| Action | Input |
|---|---|
| Insert coin (start a game) | SPACE, ENTER or click on the screen |
| Right paddle (you) | Mouse wheel; arrow keys and touch also work |
| Left paddle | Computer |
| Configuration screen | C, or the CONFIG key on the TV (the game pauses while it is open) |
| New game | the RESET key on the TV (starts again from 0 : 0 at any time) |

The mouse wheel works like the original knob: slow turning moves the paddle
finely (about 6 lines per notch), fast spinning accelerates up to 2.5x, and
the paddle glides after the wheel instead of jumping.

## Configuration screen

Press **C** or the **CONFIG** key on the TV to open the Configuration screen. It is drawn by the
game itself, through the CRT, in the look of the original: white blocks on
black, a toggle is a box (filled = ON), a slider runs on a dashed track
like the net with a small paddle as its knob, and the selected line is
marked with the ball.

| Page | Settings |
|---|---|
| GAME | points to win (11 / 15), walls on/off, wall distance, paddle height (15 = original), gap at the top, speed counts per hit (8 = original), serve delay, final score shown after the game |
| PLAYERS | computer misses after N returns (or never), computer misses steep balls (on/off), computer speed, reaction, aim error, wheel step, wheel acceleration, paddle glide, arrow key speed |
| SCREEN | scanlines, beam width, afterglow, bloom, curvature, glass black level, sound on/off, volume |

- Mouse: click a box, drag a slider. Wheel: changes the item under the
  mouse (or the selected one), one step per notch.
- Keys: up/down select, left/right change, SPACE/ENTER switch,
  TAB or 1-3 change the page, C or ESC close.
- **DEFAULTS** restores the values of `config.js`.
- Changes take effect immediately (screen settings can be watched live on
  the Configuration screen itself) and are remembered by the browser.

## How the game is checked against the original

The reference is the **MAME netlist of Pong** (`nl_pong.cpp`), a gate-level
transcription of the Atari schematic, cross-checked with Dr. H. Holden's
circuit analysis and Paul Falstad's circuit simulation. All coordinates in
the code are raw counter values of the board: `x` is the horizontal
counter (0-454, one step per 7.16 MHz pixel clock), `y` is the vertical
counter (0-261, one step per scan line).

✓ = same as the board, ≈ = same behaviour with a simplification or an
estimate, ✗ = deliberate change (see the next section).

### Video timing and picture

| Item | Original board (netlist) | This game | |
|---|---|---|---|
| Line / field | H counter 0-454, V counter 0-261, 60 Hz | same, one simulation step per field | ✓ |
| Horizontal blanking | latch set by HRESET, cleared at 16H·64H → H 0-79 | visible from H 80 | ✓ |
| Vertical blanking | latch set by VRESET, cleared by 16V → V 0-15 | visible from V 16 | ✓ |
| Net | 256H delayed by one clock (F3B) → 1 pixel wide at H 256, gated by 4V: 4 lines on / 4 off | same | ✓ |
| Paddle columns | 128H·H3A → H 128-131 (left), with 256H → H 384-387 (right) | same | ✓ |
| Paddle height | 7493 line counter (B8 / A8) counts 0-14 and stops at 15 → 15 lines | **20 lines** (adjustable) | ✗ |
| Paddle range | 555 one-shot triggered at 256V, its delay sets the top line; very short delays do not work → the paddle cannot reach the top, it does reach the bottom | same; size of the top gap estimated (6 lines, adjustable) | ≈ |
| Ball | horizontal ball counter 508-511, vertical 252-255 → 4 × 4 | same | ✓ |
| Score digits | 7448 decoder, window 128H-191H (left) and 320H-383H (right), 32H selects tens/units, digit drawn while 16H is high, lines 32V-63V, middle bar at 44V-47V | same | ✓ |
| Digit shapes | 7448: 6 without top bar, 9 without bottom bar; tens digit is only a "1", blank below 10 | same | ✓ |

### Ball motion

| Item | Original board (netlist) | This game | |
|---|---|---|---|
| Hit | coincidence of paddle video and ball video (HIT1, HIT2); every coincident field is a hit | same | ✓ |
| Vertical speed | at a hit, latches A5B / A5A / B5A store the inverted paddle counter bits B, C, D; XOR with the bounce flag H2X; 7483 adder makes a load value 7-13; 10 = no motion | paddle split into 8 segments → −3, −2, −1, 0, 0, +1, +2, +3 lines per field (derived from the gates) | ✓ |
| Top / bottom bounce | H2X toggles when the ball video meets VBLANK | same; with the optional walls the ball bounces off the walls | ✓ / ✗ |
| Horizontal speed | ball counter reloaded with 138 (still), 137 / 139 (right / left) on the lines where MOVE is active; MOVE (H2A, H2B) lasts 2, 3 or 4 lines | 2, 3 or 4 pixels per field | ✓ |
| Speed counter | 7493 F1, steps at counts 4 and 12, stops at 12, cleared by MISS and by the coin (SRST) | same | ✓ |
| Speed counter clock | clocked by the 491 Hz hit sound (vpos16 gated by C2A for one field) → about 8 counts per hit: the ball speeds up after the 1st hit and reaches top speed after the 2nd | default **3 counts per hit** (gentler: speeds up after the 2nd and 4th hit); 8 = original, adjustable | ✗ |
| Direction | flip-flop H3B: set by the hits, toggled by SC in attract mode; a miss or a coin does not change it | same | ✓ |

### Game flow

| Item | Original board (netlist) | This game | |
|---|---|---|---|
| Miss | ball video during HBLANK (E6C), ignored in attract mode | same | ✓ |
| Scoring | the player the ball was moving away from scores (L / R gate the two 7490 counters) | same | ✓ |
| Serve | 555 F4 (330 kΩ, 4.7 µF) → 1.7 s; the ball counter is held reset (ball invisible), released at the next PAD1; the ball reappears just right of the net and keeps moving towards the player who missed; vertical motion and speed latches are kept | same (the release waits for PAD1, which is less than one field, so it is not modelled) | ≈ |
| Game end | StopG: tens digit = 1 and units bit 0 = 1 → **11**; switch SW1 → 15 | 11 (`SCORE.winning`) | ✓ |
| Attract mode | StopG → ATTRACT: speed latches cleared → maximum vertical speed, the ball reverses at the left/right edges, no scoring, sound muted (C1B), paddles blanked (H3 flip-flop, per Holden) | same | ✓ |
| Final score | the score video is not gated by ATTRACT → the result stays on screen until the next coin | same | ✓ |
| Last point | ATTRACT starts at once and mutes the sound → the last point is silent | same | ✓ |
| First serve | the coin clears the score, starts the serve timer; the direction is the attract ball's, the latches are still cleared → steep (±3) serve | same | ✓ |
| Power-on | score counters start in a random state | 0 : 0 | ≈ |

### Sound

| Sound | Original board (netlist) | This game | |
|---|---|---|---|
| Paddle hit | vpos16 → 491 Hz square, one field (C2A) | same | ✓ |
| Wall bounce | vpos32 → 246 Hz, one field (F3), silent during the serve | same | ✓ |
| Miss / score | vpos32 → 246 Hz, 555 G4 (220 kΩ, 1 µF) → 242 ms | same | ✓ |
| Attract mode | all sounds muted | same | ✓ |

## Deliberate changes

The defaults are set for a slightly easier game and a more vintage picture
(stronger curvature, greyer glass, more bloom and afterglow). The
Configuration screen can set the original values back.


- **Paddle height: 20 lines** instead of 15, for easier play with a mouse
  wheel. The 8 velocity segments are scaled with it (`PADDLE.height`).
- **Dashed top and bottom walls**, as drawn by several 1970s Pong versions;
  the ball bounces off them and the net is clipped to the playfield.
  `WALLS.enabled = false` restores the original picture.
- **Computer opponent** on the left; the original was a 2-player game.
- **Mouse wheel** instead of the potentiometer knob (which gave an absolute
  position), with acceleration and smoothing.
- **Picture centred on the net.** The board starts the picture at H 80, so
  the net at H 256 is slightly left of centre; the monitors were adjusted
  so the playfield looked centred, and the paddles at H 128 / H 384 are
  symmetric around the net.

## The computer opponent

The left paddle is played by the computer, like a good human player:

- it predicts where the ball will arrive (including bounces) and re-checks
  every 5 fields,
- its paddle speed is limited (4 lines per field) and its aim has a small
  error that grows with the ball speed,
- it hits with a random part of the paddle, so its returns vary in angle.

**It misses on purpose after your 4th return in a rally.** The rally
counter counts your returns since the last serve; once it reaches 4, the
computer moves its paddle just past the ball on the side with more room,
so it looks like a near miss. Before that it can still miss now and then,
mostly when the ball slips through the gap at the top.

In 30 simulated games against a strong automatic player, 90 % of the
computer's misses came exactly after the 4th return.

**Optionally it also misses every steep ball** (vertical speed 3 lines per
field, the return from a paddle edge): switch on *COMPUTER MISSES STEEP* on
the Configuration screen. It then moves its paddle to the side the ball is
moving away from, so the steep ball cannot run into it. The served ball
is always steep (the velocity latches are still cleared), so the first
ball after a serve is always returned. Off by default.

Settings (`AI` in `config.js`): `missAfter` (0 = never miss on purpose), `missSteep`,
`maxSpeed`, `reactionFrames`, `error`.

## CRT emulation

- the game is drawn into a native 375 × 246 raster, then scaled by an
  integer factor so every scan line becomes exactly k screen rows
- gaussian beam profile → scanlines
- per-pixel phosphor afterglow: moving objects leave a short, warm fading
  tail (`CRT.persistence`, `COLORS.afterglow`)
- horizontal bandwidth blur, bloom, vignette
- WebGL pass: barrel distortion of the curved tube face and the grey-green
  black level of the glass (`CRT.curvature`, `CRT.glassBlack`); without
  WebGL the picture stays flat
- fixed 60 Hz simulation, independent of the monitor's refresh rate

The TV is pure CSS with two SVG noise textures (`wood.svg`, `cloth.svg`).

## Files

| File | Contents |
|---|---|
| `config.js` | all parameters, with the board values and their sources |
| `settings.js` | what the Configuration screen can change, ranges, saving |
| `configui.js` | the Configuration screen (pixel font, pages, toggles, sliders, input) |
| `ball.js` | ball, hit detection, speed counter |
| `paddle.js` | paddles, computer player |
| `score.js` | score digits, net, walls |
| `main.js` | game flow, input, main loop |
| `sound.js` | square-wave sounds |
| `crt.js` | CRT renderer |
| `index.html`, `styles.css`, `wood.svg`, `cloth.svg` | the TV |

## Sources

- MAME, [Pong netlist (nl_pong.cpp)](https://github.com/mamedev/mame/blob/master/src/mame/atari/nl_pong.cpp)
- Dr. H. Holden, [Atari Pong E circuit analysis](https://www.pong-story.com/LAWN_TENNIS.pdf)
- Paul Falstad, [Pong circuit simulation](https://www.falstad.com/pong/)
