A version of the original Atari Pong (1972) arcade game, rebuilt to follow the TTL board's behaviour.

You can try it here: https://csurgay.com/pong

![image](https://github.com/user-attachments/assets/e62a3f93-6f24-44e9-b38d-ecf4a2370790)

## Faithful to the hardware

All coordinates are the raw H/V counter values of the board (H 0..454, V 0..261, blanking H<80, V<16).

- Paddles at 128H and 384H, 4 x 15; net at 256H, 1 pixel, 4 lines on / 4 off; ball 4 x 4
- Paddle decoded in 2-line segments -> vertical speed 3, 2, 1, 0 lines/frame up or down
- Horizontal speed 2, 3, 4 pixels/frame (MOVE pulse of 2, 3, 4 lines), steps after the 4th and 12th hit
- After a miss the ball is invisible for 1.7 s, then appears just right of the net, moving towards the player who missed
- Paddle: the board draws 15 lines (7493 line counter stops at 15) - here it is 18 lines on request, still split into 8 velocity segments; its 555 cannot make very short delays, so the paddle cannot reach the very top (the famous gap), but it does reach the bottom
- Score windows 128H..191H and 320H..383H at 32V..63V; 32H selects tens/units, digits drawn while 16H is high; middle bar at 44V..47V; 7448 shapes (6 and 9 without tails), no leading zero, game to 11 (PCB switch: 15)
- The tube's view is centred on the net, as the monitors were adjusted (paddles at 128H/384H are symmetric around 256H)
- Sounds: 491 Hz paddle hit, 246 Hz wall bounce (one field each), 242 ms 246 Hz score tone
- Attract mode: no bats, the last score stays on screen until the next coin, silent ball at maximum vertical speed bouncing off all four edges

## Optional walls

Dashed top and bottom walls (`WALLS` in `config.js`), as drawn by several 1970s Pong versions; the ball bounces off them. Set `WALLS.enabled = false` for the original arcade picture.

## CRT

Integer line scaling with a gaussian beam scanline mask, per-pixel phosphor afterglow (moving objects leave a short, warm fading tail), horizontal bandwidth blur, bloom, vignette.

Shown in a late-1960s style walnut table-top TV (CSS + SVG noise textures `wood.svg`, `cloth.svg`); the picture is bent by a WebGL pass like a curved tube face.

## Controls

- SPACE / ENTER / click: insert coin (start)
- Right paddle: mouse wheel with acceleration (slow turning is fine, fast spinning moves up to 2.5x further), the paddle glides after it (arrow keys and touch also work)
- Left paddle: computer

Parameters are in `config.js`. Sources: Dr. H. Holden, [Atari Pong E circuit analysis](https://www.pong-story.com/LAWN_TENNIS.pdf); Paul Falstad, [Pong circuit simulation](https://www.falstad.com/pong/); MAME [Pong netlist](https://github.com/mamedev/mame/blob/master/src/mame/atari/nl_pong.cpp).
