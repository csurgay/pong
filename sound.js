// =====================================================================
//  Sound - raw square waves, like the original 491 / 246 Hz taps of the
//  vertical counter, gated for one field (or longer for a score).
// =====================================================================

const Sound = (() => {
    let ac = null;
    let master = null;

    // Browsers only allow audio after a user gesture (key / click / touch)
    function unlock() {
        if (!ac) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            ac = new AC();
            master = ac.createGain();
            master.gain.value = SOUND.volume;
            master.connect(ac.destination);
        }
        if (ac.state === 'suspended') ac.resume();
    }

    function play(name) {
        if (!SOUND.enabled || !ac || ac.state !== 'running') return;
        master.gain.value = SOUND.volume;
        const s = SOUND[name];
        const t = ac.currentTime;
        const o = ac.createOscillator();
        o.type = 'square';
        o.frequency.value = s.hz;
        o.connect(master);
        o.start(t);
        o.stop(t + s.ms / 1000);
    }

    return { unlock, play };
})();
