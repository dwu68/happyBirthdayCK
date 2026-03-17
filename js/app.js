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
  '08_majiang.png':   '麻将之王宝贝！学吧！！ 🀄',
  '03_pokemon.jpeg':  '超级会抓小精灵，满手都是闪光的宝贝！ ✨',
  '09_yumaoqiu.jpeg': '打球巨帅的宝贝！！ 🏸',
};

const DEFAULT_NOTE = '这一刻，永远珍藏 💗';

// ============================================================
//  PASSPHRASE CONFIG
// ============================================================
const CORRECT_ANSWER = '来袭';

// ============================================================
//  STATE
// ============================================================
let photoIndex = 0;   // index into the shuffled stack (bottom → top)
let tapState = 0;     // 0 = waiting for first tap, 1 = enlarged (waiting for second tap)
let cards = [];       // DOM references ordered bottom → top

// ============================================================
//  BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  buildPhotoStack();
  bindGiftFlow();
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

  const top = currentTopCard();
  if (!top) return;

  // First tap: enlarge + show note
  enlargeCard(top);
}

function enlargeCard(card) {
  tapState = 1;
  card.classList.add('enlarged');

  // Inject note directly inside the card, below the image
  const filename = card.dataset.filename;
  const note = NOTES[filename] || DEFAULT_NOTE;
  const noteEl = document.createElement('div');
  noteEl.className = 'inline-note';
  noteEl.innerHTML = `<p>${note}</p><span>再轻触一下继续 →</span>`;
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
  document.getElementById('passphrase-input').value = '';
  document.getElementById('passphrase-error').classList.add('hidden');
  document.getElementById('modal-passphrase').classList.remove('hidden');
  setTimeout(() => document.getElementById('passphrase-input').focus(), 350);
}

function checkPassphrase() {
  const val = document.getElementById('passphrase-input').value.trim();
  const input = document.getElementById('passphrase-input');
  const error = document.getElementById('passphrase-error');

  if (val === CORRECT_ANSWER) {
    document.getElementById('modal-passphrase').classList.add('hidden');
    revealGiftCard();
  } else {
    error.classList.remove('hidden');
    input.classList.remove('shake');
    // Force reflow to restart animation
    void input.offsetWidth;
    input.classList.add('shake');
  }
}
