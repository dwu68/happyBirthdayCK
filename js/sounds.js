// ============================================================
//  SOUND EFFECTS — generated via Web Audio API, no files needed
// ============================================================

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone({ freq = 440, type = 'sine', gain = 0.18, attack = 0.01, decay = 0.15, sustain = 0, release = 0.25 }) {
  const c = getCtx();
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  env.gain.setValueAtTime(0, c.currentTime);
  env.gain.linearRampToValueAtTime(gain, c.currentTime + attack);
  env.gain.linearRampToValueAtTime(gain * sustain, c.currentTime + attack + decay);
  env.gain.linearRampToValueAtTime(0, c.currentTime + attack + decay + release);
  osc.connect(env);
  env.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + attack + decay + release + 0.05);
}

function playPhotoOpen() {
  new Audio('assets/sounds/photo-click.mp3').play();
}

function playPhotoDismiss() {
  const c = getCtx();
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, c.currentTime);
  osc.frequency.linearRampToValueAtTime(330, c.currentTime + 0.25);
  env.gain.setValueAtTime(0.12, c.currentTime);
  env.gain.linearRampToValueAtTime(0, c.currentTime + 0.28);
  osc.connect(env);
  env.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.3);
}

function playSuccess() {
  new Audio('assets/sounds/correct-answer.mp3').play();
}

function playGiftOpen() {
  const c = getCtx();
  // Sparkle: quick rising glitter
  [880, 1108, 1318, 1760].forEach((freq, i) => {
    setTimeout(() => {
      playTone({ freq, type: 'sine', gain: 0.10, attack: 0.005, decay: 0.06, sustain: 0, release: 0.22 });
    }, i * 55);
  });
}

function playError() {
  new Audio('assets/sounds/wrong-answer.mp3').play();
}
