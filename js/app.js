// ============================================================
//  CONFIGURATION — edit these two things as needed
// ============================================================

/**
 * List every filename inside assets/photos/ here.
 * Add or remove filenames to update the photo stack.
 */
const PHOTOS = [
  '01_fishing.png',
  '02_pool.jpeg',
  '04_NBA.jpeg',
  '05_violin.jpeg',
  '06_cooking.jpeg',
  '07_working.jpeg',
  '08_majiang.png',
  '03_pokemon.jpeg',
  '09_yumaoqiu.jpeg',
];

/**
 * Notes keyed by filename.
 * Replace the placeholder strings with real notes later.
 * If a photo has no entry here, a default note is used.
 */
const NOTES = {
  '01_fishing.png':   '钓帝养成中... 🎣',
  '02_pool.jpeg':     '淡定从容的冷面黑马CK！🎱',
  '04_NBA.jpeg':      '声音超好听又超专业的NBA现场记者!！ 🏀',
  '05_violin.jpeg':   '想看宝贝半夜被拍醒拉梁祝哈哈 🎻',
  '06_cooking.jpeg':  '爆炒黄牛肉是世界上最好吃的菜！！ 🍳',
  '07_working.jpeg':  'GP顶梁柱，Tim的心肝大宝贝！  💻',
  '08_majiang.png':   '麻将之王降临！学吧！！ 🀄',
  '03_pokemon.jpeg':  '超级会抓小精灵，满手都是闪光的宝贝！ ✨',
  '09_yumaoqiu.jpeg': '运动天赋拉满，厉害又帅气的宝贝！ 🏸',
};

const DEFAULT_NOTE = '这一刻，永远珍藏 💗';

// ============================================================
//  PASSPHRASE CONFIG
// ============================================================
const QUESTIONS = [
  { clue: '💭 谁是世界上最好的宝贝？',               answer: ['王尘康']          },
  { clue: '💭 谁是世界上最幸福的宝贝？',              answer: ['王尘康', '吴东篱','你','我'] },
  { clue: '💭 宝贝能不能给我一个头皮的 ___',          answer: ['来袭']            },
];
let questionStep = 0;

// ============================================================
//  STATE
// ============================================================
let tapState = 0;     // 0 = waiting for first tap, 1 = enlarged (waiting for second tap)
let cards = [];       // DOM references ordered bottom → top

// ============================================================
//  BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', init);

// ============================================================
//  BGM
// ============================================================
const bgm = new Audio('assets/sounds/alwaysOnline.m4a');
bgm.loop = true;
bgm.volume = 0.5;

// iOS requires audio to start inside a user gesture — start on first tap
function startBgm() {
  bgm.play();
  document.removeEventListener('touchstart', startBgm);
  document.removeEventListener('click', startBgm);
}

function stopBgm() {
  bgm.pause();
  bgm.currentTime = 0;
}

function init() {
  document.addEventListener('touchstart', startBgm, { once: true });
  document.addEventListener('click', startBgm, { once: true });
  buildPhotoStack();
  bindGiftFlow();
  startStars();
}

// ============================================================
//  STAR TWINKLE ANIMATION
// ============================================================
function startStars() {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);

  const W = () => canvas.offsetWidth;
  const H = () => canvas.offsetHeight;

  function makeStar() {
    return {
      x:       Math.random() * W(),
      y:       Math.random() * H(),
      r:       2.2 + Math.random() * 4.0,
      phase:   Math.random() * Math.PI * 2,   // twinkle phase offset
      speed:   0.02 + Math.random() * 0.04,   // twinkle speed
      // occasional 4-point sparkle vs plain circle
      sparkle: Math.random() < 0.35,
    };
  }

  const STAR_COUNT = 55;
  const stars = Array.from({ length: STAR_COUNT }, makeStar);

  function drawSparkle(x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(255, 215, 100, ${alpha * 0.45})`;
    ctx.lineWidth = r * 0.5;
    ctx.beginPath();
    // 4-point cross
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * r * 2.2, y + Math.sin(angle) * r * 2.2);
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    stars.forEach(s => {
      s.phase += s.speed;
      const alpha = (Math.sin(s.phase) + 1) / 2; // 0 → 1 → 0

      if (s.sparkle) {
        drawSparkle(s.x, s.y, s.r, alpha * 0.9);
      }
      // Core dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 100, ${alpha * 0.45})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ============================================================
//  PHOTO STACK
// ============================================================
function buildPhotoStack() {
  const stack = document.getElementById('photo-stack');
  stack.innerHTML = '';
  cards = [];

  // Slight random offsets give a natural stacked-photos feel
  const offsets = generateOffsets(PHOTOS.length);

  PHOTOS.forEach((filename, i) => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.dataset.filename = filename;
    card.dataset.index = i;

    const img = document.createElement('img');
    img.src = `assets/photos/${filename}`;
    img.alt = '';
    img.draggable = false;
    card.appendChild(img);

    // Stack offset (lower index = deeper in stack = rendered first = behind)
    const { rotate, tx, ty } = offsets[i];
    card.style.transform = `rotate(${rotate}deg) translate(${tx}px, ${ty}px)`;
    card.style.zIndex = i;

    stack.appendChild(card);
    cards.push(card);
  });

  // Mark the top card
  markTopCard();

  // Single tap handler on the stack container
  stack.addEventListener('click', handleStackTap);
}

function generateOffsets(count) {
  // Deterministic-ish spread so every photo is visibly offset
  return Array.from({ length: count }, (_, i) => {
    const step = i - Math.floor(count / 2);
    return {
      rotate: step * 4.5 + (i % 2 === 0 ? 1.5 : -1.5),
      tx:     step * 3,
      ty:     step * 1.5,
    };
  });
}

function markTopCard() {
  cards.forEach(c => c.classList.remove('top'));
  const top = currentTopCard();
  if (top) top.classList.add('top');
}

function currentTopCard() {
  // Walk backwards to find the first non-faded card
  for (let i = cards.length - 1; i >= 0; i--) {
    if (!cards[i].classList.contains('fading') && !cards[i].classList.contains('gone')) {
      return cards[i];
    }
  }
  return null;
}

function handleStackTap(e) {
  if (tapState !== 0) return;   // ignore if already enlarged

  // Hide tap hint on first interaction
  document.getElementById('tap-hint').classList.add('hidden');

  const top = currentTopCard();
  if (!top) return;

  // First tap: enlarge + show note
  enlargeCard(top);
}

function enlargeCard(card) {
  tapState = 1;
  card.classList.add('enlarged');
  playPhotoOpen();

  // Inject note directly inside the card, below the image
  const filename = card.dataset.filename;
  const note = NOTES[filename] || DEFAULT_NOTE;
  const noteEl = document.createElement('div');
  noteEl.className = 'inline-note';
  noteEl.innerHTML = `<p>${note}</p><span>→</span>`;
  card.appendChild(noteEl);

  // Second tap: anywhere on the enlarged card dismisses it
  card.addEventListener('click', handleSecondTap, { once: true });
}

function handleSecondTap() {
  if (tapState !== 1) return;

  const card = document.querySelector('.photo-card.enlarged');
  if (!card) return;

  // Remove inline note
  const noteEl = card.querySelector('.inline-note');
  if (noteEl) noteEl.remove();

  // Fade card away
  card.classList.remove('enlarged');
  card.classList.add('fading');
  tapState = 0;

  // After fade completes, mark gone and check if stack is empty
  setTimeout(() => {
    card.classList.add('gone');
    card.style.display = 'none';
    markTopCard();
    checkStackDone();
  }, 420);
}

function checkStackDone() {
  const remaining = cards.filter(c => !c.classList.contains('gone'));
  if (remaining.length === 0) {
    revealMessage();
  }
}

// ============================================================
//  SCREEN TRANSITIONS
// ============================================================
function revealMessage() {
  setTimeout(() => {
    document.getElementById('screen-photos').classList.remove('active');
    document.getElementById('screen-message').classList.add('active');
  }, 300);
}

function revealGiftCard() {
  document.getElementById('screen-message').classList.remove('active');
  document.getElementById('screen-gift').classList.add('active');
  stopBgm();
  setTimeout(() => new Audio('assets/sounds/anmo.m4a').play(), 500);
  startPetals();
}

// ============================================================
//  PETAL ANIMATION
// ============================================================
function startPetals() {
  const canvas = document.getElementById('petal-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);

  const W = () => canvas.offsetWidth;
  const H = () => canvas.offsetHeight;

  // Petal colors — pink tones
  const COLORS = [
    'rgba(232,140,165,0.82)',
    'rgba(247,190,205,0.75)',
    'rgba(210,100,135,0.70)',
    'rgba(255,210,220,0.80)',
    'rgba(240,160,180,0.72)',
  ];

  // Each petal is an ellipse drawn rotated
  function makePetal() {
    return {
      x:       Math.random() * W(),
      y:       Math.random() * -H(),        // start above screen
      vx:      (Math.random() - 0.5) * 0.8, // gentle horizontal drift
      vy:      0.6 + Math.random() * 1.0,   // fall speed
      angle:   Math.random() * Math.PI * 2,
      spin:    (Math.random() - 0.5) * 0.04,
      rx:      4 + Math.random() * 5,       // petal width radius
      ry:      2 + Math.random() * 3,       // petal height radius
      color:   COLORS[Math.floor(Math.random() * COLORS.length)],
      sway:    Math.random() * Math.PI * 2, // phase for horizontal sway
      swaySpd: 0.01 + Math.random() * 0.02,
    };
  }

  const PETAL_COUNT = 38;
  const petals = Array.from({ length: PETAL_COUNT }, makePetal);
  // Spread initial y positions so they don't all arrive at once
  petals.forEach(p => { p.y = Math.random() * H(); });

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    petals.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();

      // Update
      p.sway += p.swaySpd;
      p.x    += p.vx + Math.sin(p.sway) * 0.5;
      p.y    += p.vy;
      p.angle += p.spin;

      // Recycle when off-screen
      if (p.y > H() + 20) {
        p.y  = -20;
        p.x  = Math.random() * W();
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ============================================================
//  GIFT / PASSPHRASE FLOW
// ============================================================
function bindGiftFlow() {
  document.getElementById('gift-btn').addEventListener('click', openPassphraseModal);
  document.getElementById('passphrase-submit').addEventListener('click', checkPassphrase);

  // Also allow Enter key
  document.getElementById('passphrase-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkPassphrase();
  });
}

function openPassphraseModal() {
  playGiftOpen();
  questionStep = 0;
  loadQuestion();
  document.getElementById('modal-passphrase').classList.remove('hidden');
  setTimeout(() => document.getElementById('passphrase-input').focus(), 350);
}

function loadQuestion() {
  const q = QUESTIONS[questionStep];
  document.getElementById('passphrase-input').value = '';
  document.getElementById('passphrase-error').classList.add('hidden');
  document.querySelector('#modal-passphrase .modal-clue').textContent = q.clue;
}

function checkPassphrase() {
  const val = document.getElementById('passphrase-input').value.trim();
  const input = document.getElementById('passphrase-input');
  const error = document.getElementById('passphrase-error');
  const q = QUESTIONS[questionStep];

  if (q.answer.includes(val)) {
    playSuccess();
    questionStep++;
    if (questionStep < QUESTIONS.length) {
      // Advance to next question
      loadQuestion();
      setTimeout(() => input.focus(), 100);
      return;
    }
    document.getElementById('modal-passphrase').classList.add('hidden');
    revealGiftCard();
  } else {
    playError();
    error.classList.remove('hidden');
    input.classList.remove('shake');
    void input.offsetWidth;
    input.classList.add('shake');
  }
}
