// =====================================================================
//  CRT renderer
//  The game draws into a native 375x246 raster (Crt.g), using raw
//  counter coordinates (blanking is translated away). present():
//    1. phosphor persistence: per-pixel exponential decay in a float
//       buffer, so moving objects leave a short fading tail; the
//       afterglow is tinted warmer (the slow yellow component of the
//       P4 white phosphor outlives the fast blue one)
//    2. horizontal bandwidth blur (video amplifier, soft left/right edges)
//    3. line-multiplying with an integer factor -> every raster line
//       becomes exactly k screen rows, so the scanline gaps are exact
//    4. scanline mask (gaussian beam profile)
//    5. bloom (glow of bright phosphor)
//    6. WebGL pass: barrel distortion of the curved tube face and the
//       grey-green black level of the glass (2D fallback without WebGL)
//  Vignette, glass reflections and the cabinet are CSS.
// =====================================================================

const Crt = (() => {
    const mk = (w, h) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    };

    const frame = mk(SCREEN.W, SCREEN.H);
    const g = frame.getContext('2d', { willReadFrequently: true });
    const phos = mk(SCREEN.W, SCREEN.H);
    const pg = phos.getContext('2d');
    const bloom = mk(SCREEN.W, SCREEN.H);
    const bg = bloom.getContext('2d');
    const hscale = mk(1, SCREEN.H);
    const hg = hscale.getContext('2d');
    const comp = mk(1, 1);                       // composed picture
    const dg = comp.getContext('2d', { alpha: false });

    const display = document.getElementById('pongCanvas');
    const gl = initGL(display);
    const out2d = gl ? null : display.getContext('2d', { alpha: false });

    const filterSupported = typeof bg.filter === 'string';
    let mask = null;
    let k = 3;

    const N = SCREEN.W * SCREEN.H;
    const glow = new Float32Array(N);
    const out = pg.createImageData(SCREEN.W, SCREEN.H);
    const hex = (s) => [1, 3, 5].map(i => parseInt(s.substr(i, 2), 16));
    const LIT = hex(COLORS.phosphor);
    const AFTER = hex(COLORS.afterglow);

    // the game draws with raw H/V counter values; the visible window of
    // the tube starts at SCREEN.VIEW_X / SCREEN.VBLANK
    g.setTransform(1, 0, 0, 1, -SCREEN.VIEW_X, -SCREEN.VBLANK);

    // ------------------------------------------------------- WebGL pass

    function initGL(canvas) {
        let ctx = null;
        try {
            ctx = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
        } catch (e) { ctx = null; }
        if (!ctx) return null;

        const vs = `
            attribute vec2 p;
            varying vec2 uv;
            void main() {
                uv = p * 0.5 + 0.5;
                gl_Position = vec4(p, 0.0, 1.0);
            }`;
        const fs = `
            precision mediump float;
            uniform sampler2D tex;
            uniform float curv;
            uniform vec3 glass;
            varying vec2 uv;
            void main() {
                vec2 c = uv * 2.0 - 1.0;
                c *= 1.0 + curv * (c.yx * c.yx);          // barrel distortion
                vec2 t = c * 0.5 + 0.5;
                if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) {
                    gl_FragColor = vec4(glass, 1.0);
                    return;
                }
                vec3 col = texture2D(tex, t).rgb;
                // black level of the glass, light adds on top of it
                col = glass + col * (1.0 - glass);
                gl_FragColor = vec4(col, 1.0);
            }`;
        const sh = (type, src) => {
            const s = ctx.createShader(type);
            ctx.shaderSource(s, src);
            ctx.compileShader(s);
            if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) throw new Error(ctx.getShaderInfoLog(s));
            return s;
        };
        try {
            const prog = ctx.createProgram();
            ctx.attachShader(prog, sh(ctx.VERTEX_SHADER, vs));
            ctx.attachShader(prog, sh(ctx.FRAGMENT_SHADER, fs));
            ctx.linkProgram(prog);
            if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) return null;
            ctx.useProgram(prog);

            const buf = ctx.createBuffer();
            ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
            ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
            const loc = ctx.getAttribLocation(prog, 'p');
            ctx.enableVertexAttribArray(loc);
            ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);

            const tex = ctx.createTexture();
            ctx.bindTexture(ctx.TEXTURE_2D, tex);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
            ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, true);

            const gb = CRT.glassBlack;
            ctx.uniform1f(ctx.getUniformLocation(prog, 'curv'), CRT.curvature);
            ctx.uniform3f(ctx.getUniformLocation(prog, 'glass'), gb * 0.9, gb * 1.05, gb);
            return ctx;
        } catch (e) {
            console.warn('WebGL CRT pass disabled:', e);
            return null;
        }
    }

    // ------------------------------------------------------- layout

    function buildMask(w, h) {
        const m = mk(w, h);
        const mg = m.getContext('2d');
        const beam = [];
        for (let r = 0; r < k; r++) {
            const d = (r + 0.5) / k - CRT.beamCenter;
            beam.push(Math.exp(-(d * d) / (2 * CRT.beamWidth * CRT.beamWidth)));
        }
        const max = Math.max(...beam);
        for (let r = 0; r < k; r++) {
            const a = (1 - beam[r] / max) * CRT.scanlineStrength;
            if (a < 0.01) continue;
            mg.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`;
            for (let y = r; y < h; y += k) mg.fillRect(0, y, w, 1);
        }
        return m;
    }

    // The cabinet's size depends on the canvas (the control column can be
    // taller than a small picture), so lay out a few times until stable.
    function resize() {
        for (let i = 0; i < 3; i++) {
            const before = k;
            layout();
            if (i > 0 && k === before) break;
        }
    }

    function layout() {
        const dpr = window.devicePixelRatio || 1;
        // overhead of the TV cabinet around the canvas (measured, CSS px)
        const tv = document.querySelector('.tv');
        let extraW = 0, extraH = 0;
        if (tv) {
            const t = tv.getBoundingClientRect(), d = display.getBoundingClientRect();
            extraW = t.width - d.width;
            extraH = t.height - d.height;
        }
        const availH = Math.max(100, window.innerHeight - extraH - 40) * dpr;
        const availW = Math.max(100, window.innerWidth - extraW - 40) * dpr;
        k = Math.max(1, Math.floor(Math.min(availH, availW / SCREEN.ASPECT) / SCREEN.H));
        const h = SCREEN.H * k;
        const w = Math.round(h * SCREEN.ASPECT);
        display.width = comp.width = w;
        display.height = comp.height = h;
        display.style.width = (w / dpr) + 'px';
        display.style.height = (h / dpr) + 'px';
        hscale.width = w;
        mask = buildMask(w, h);
        if (gl) gl.viewport(0, 0, w, h);
    }

    // ------------------------------------------------------- one field

    function present() {
        const W = comp.width, H = comp.height;

        // 1. phosphor persistence
        const src = g.getImageData(0, 0, SCREEN.W, SCREEN.H).data;
        const dst = out.data;
        const decay = CRT.persistence;
        for (let i = 0, j = 0; i < N; i++, j += 4) {
            const lit = src[j + 1] / 255;          // beam this field (0..1)
            const old = glow[i] * decay;           // what is left from before
            if (lit > 0) {
                dst[j]     = LIT[0] * lit;
                dst[j + 1] = LIT[1] * lit;
                dst[j + 2] = LIT[2] * lit;
            } else {
                dst[j]     = AFTER[0] * old;
                dst[j + 1] = AFTER[1] * old;
                dst[j + 2] = AFTER[2] * old;
            }
            dst[j + 3] = 255;
            glow[i] = lit > old ? lit : old;
        }
        pg.putImageData(out, 0, 0);

        // 2. horizontal-only smoothing (no vertical blending between lines)
        hg.imageSmoothingEnabled = true;
        hg.imageSmoothingQuality = 'high';
        hg.clearRect(0, 0, W, SCREEN.H);
        hg.drawImage(phos, 0, 0, W, SCREEN.H);

        // 3. each raster line -> k identical rows
        dg.globalCompositeOperation = 'source-over';
        dg.globalAlpha = 1;
        dg.imageSmoothingEnabled = false;
        dg.drawImage(hscale, 0, 0, W, H);

        // 4. scanlines
        dg.drawImage(mask, 0, 0);

        // 5. bloom
        if (filterSupported && CRT.bloom > 0) {
            bg.clearRect(0, 0, SCREEN.W, SCREEN.H);
            bg.filter = `blur(${CRT.bloomRadius}px)`;
            bg.drawImage(phos, 0, 0);
            bg.filter = 'none';
            dg.imageSmoothingEnabled = true;
            dg.globalCompositeOperation = 'lighter';
            dg.globalAlpha = CRT.bloom;
            dg.drawImage(bloom, 0, 0, W, H);
            dg.globalCompositeOperation = 'source-over';
            dg.globalAlpha = 1;
        }

        // 6. curved glass
        if (gl) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, comp);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        } else {
            out2d.drawImage(comp, 0, 0);
        }
    }

    // Converts a client Y coordinate to a V counter value
    function clientToLine(clientY) {
        const r = display.getBoundingClientRect();
        return SCREEN.VBLANK + (clientY - r.top) / r.height * SCREEN.H;
    }

    window.addEventListener('resize', resize);
    resize();

    return { g, present, resize, clientToLine, canvas: display };
})();
