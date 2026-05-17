// ─── AUDIO ────────────────────────────────────────────────────────
// Procedural SFX via Web Audio API + background music

let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSFX(type, freq = 440, dur = 0.12, vol = 0.25) {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const dist = ac.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) curve[i] = (i / 128 - 1) * 3;
    dist.curve = curve;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.1, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(dist).connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch (e) { /* ignore audio errors */ }
}

export function playShoot()  { playSFX('sawtooth', 200, 0.08, 0.3); }
export function playHit()    { playSFX('square', 120, 0.1, 0.2); }
export function playDie()    { playSFX('sawtooth', 80, 0.4, 0.35); }
export function playPickup() { playSFX('sine', 880, 0.15, 0.2); }
export function playEmpty()  { playSFX('square', 60, 0.05, 0.15); }

// ─── BACKGROUND MUSIC ─────────────────────────────────────────────
let musicEl = null;

export function startMusic() {
  if (!musicEl) {
    musicEl = new Audio('assets/hell-keep.mp3');
    musicEl.loop = true;
    musicEl.volume = 0.4;
  }
  musicEl.currentTime = 0;
  musicEl.play().catch(() => {});
}

export function stopMusic() {
  if (musicEl) {
    musicEl.pause();
    musicEl.currentTime = 0;
  }
}

export function pauseMusic() {
  if (musicEl) musicEl.pause();
}

export function resumeMusic() {
  if (musicEl) musicEl.play().catch(() => {});
}
