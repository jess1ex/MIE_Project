// ══════════════════════════════════════════════════════════════
//  SPEEDY BEDMAS — script.js
// ══════════════════════════════════════════════════════════════

// ▼▼▼  PASTE YOUR APPS SCRIPT WEB APP URL HERE  ▼▼▼
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1E_VmoF8JbComMX_PTo0aOsjr0TAS_fDK1pchNyQjby4/edit?gid=275621255#gid=275621255';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


// ══════════════════════════════════════════════════════════════
//  CONDITION — randomised once per page load
//  50% of visitors get 'frequent', 50% get 'delayed'
// ══════════════════════════════════════════════════════════════

const CONDITION = Math.random() < 0.5 ? 'frequent' : 'delayed';

// Show the assigned feedback type number on the intro checklist
document.getElementById('feedback-type-label').textContent =
  CONDITION === 'frequent' ? '1 (every 10 seconds)' : '2 (last 10 seconds only)';


// ══════════════════════════════════════════════════════════════
//  QUESTION BANK — 100 fixed questions, seeded for consistency
//  Rules: 3 numbers, up to 3 operations, multiplication capped
//  at 2-digit × 1-digit
// ══════════════════════════════════════════════════════════════

const QUESTIONS = (function () {
  function seededRng(seed) {
    let s = seed >>> 0;
    return () => {
      s = Math.imul(1664525, s) + 1013904223 >>> 0;
      return s / 0x100000000;
    };
  }

  const rng     = seededRng(286);
  const ri      = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const pick    = arr => arr[Math.floor(rng() * arr.length)];

  // ── Type A: a ± b ± c  (pure addition/subtraction) ──────────
  function typeA() {
    const a = ri(10, 60), b = ri(10, 30), c = ri(10, 20);
    const op1 = pick(['+', '−']), op2 = pick(['+', '−']);
    const mid = op1 === '+' ? a + b : a - b;
    const ans = op2 === '+' ? mid + c : mid - c;
    if (ans < 0) return typeA();
    return { display: `${a} ${op1} ${b} ${op2} ${c}`, answer: ans };
  }

  // ── Type B: a ± b × c  (one multiplication, order of ops) ───
  // b is 2-digit, c is 1-digit (cap rule)
  function typeB() {
    const a  = ri(10, 60);
    const b  = ri(10, 19);   // 2-digit
    const c  = ri(2, 9);     // 1-digit
    const op = pick(['+', '−']);
    const ans = op === '+' ? a + b * c : a - b * c;
    if (ans < 0) return typeB();
    return { display: `${a} ${op} ${b} × ${c}`, answer: ans };
  }

  // ── Type C: (a ± b) × c  (brackets first, then multiply) ────
  // result of bracket is 2-digit, c is 1-digit
  function typeC() {
    const c   = ri(2, 9);
    const op  = pick(['+', '−']);
    const a   = ri(10, 30);
    const b   = ri(10, 20);
    const mid = op === '+' ? a + b : a - b;
    if (mid <= 9 || mid > 99) return typeC();  // keep bracket result 2-digit
    const ans = mid * c;
    return { display: `(${a} ${op} ${b}) × ${c}`, answer: ans };
  }

  // ── Type D: a ÷ b ± c  (exact division, then add/subtract) ──
  function typeD() {
    const b   = ri(2, 9);
    const res = ri(2, 12);
    const a   = b * res;          // guarantees integer result
    const c   = ri(10, 30);
    const op  = pick(['+', '−']);
    const ans = op === '+' ? res + c : res - c;
    if (ans < 0) return typeD();
    return { display: `${a} ÷ ${b} ${op} ${c}`, answer: ans };
  }

  // ── Type E: a × b ÷ c  (multiply then divide exactly) ───────
  // a is 2-digit, b is 1-digit
  function typeE() {
    const c   = ri(2, 9);
    const res = ri(2, 12);
    const a   = c * res;           // a divisible by c, but could be > 2 digits
    if (a < 10 || a > 99) return typeE();
    const b   = ri(2, 9);          // 1-digit
    const ans = (a * b) / c;       // = res × b, always integer
    return { display: `${a} × ${b} ÷ ${c}`, answer: ans };
  }

  // 20 of each type, shuffled
  const types    = [typeA, typeB, typeC, typeD, typeE];
  const typeList = [];
  for (const t of types) for (let i = 0; i < 20; i++) typeList.push(t);

  for (let i = typeList.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [typeList[i], typeList[j]] = [typeList[j], typeList[i]];
  }

  return typeList.map(fn => fn());
})();


// ══════════════════════════════════════════════════════════════
//  PRACTICE QUESTIONS (exactly 3, as stated in checklist)
// ══════════════════════════════════════════════════════════════

const PRACTICE = [
  { display: '(12 + 3) × 4',  answer: 60 },
  { display: '20 + 3 × 5',    answer: 35 },
  { display: '36 ÷ 4 − 6',    answer: 3  },
];
let practiceIdx = 0;


// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════

const ROUND_SECONDS = 60;
const CIRCUMFERENCE = 2 * Math.PI * 26;

let timerInterval = null;
let secondsLeft   = ROUND_SECONDS;
let currentQ      = 0;
let answered      = 0;
let correct       = 0;


// ══════════════════════════════════════════════════════════════
//  BEEP — generated with Web Audio API (no external file needed)
// ══════════════════════════════════════════════════════════════

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playBeep(freq = 880, duration = 0.12, volume = 0.35) {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type            = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not available — silently skip
  }
}


// ══════════════════════════════════════════════════════════════
//  SCREEN MANAGEMENT
// ══════════════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goToIntro() { showScreen('screen-intro'); }

function goToPractice() {
  // Unlock audio context on first user interaction
  getAudioCtx();
  practiceIdx = 0;
  showPracticeQ();
  showScreen('screen-practice');
}


// ══════════════════════════════════════════════════════════════
//  INTRO — checklist gating
// ══════════════════════════════════════════════════════════════

function updateStartBtn() {
  const boxes = document.querySelectorAll('.check-box');
  const allChecked = [...boxes].every(b => b.checked);
  document.getElementById('start-btn').disabled = !allChecked;
}


// ══════════════════════════════════════════════════════════════
//  PRACTICE
// ══════════════════════════════════════════════════════════════

function showPracticeQ() {
  const progressEl = document.getElementById('practice-progress');
  const startBtn   = document.getElementById('start-real-btn');

  if (practiceIdx >= PRACTICE.length) {
    // All 3 done — reveal the start button
    document.getElementById('practice-q').textContent = 'Practice complete!';
    document.getElementById('practice-input').style.display = 'none';
    document.querySelector('.submit-btn').style.display = 'none';
    progressEl.textContent = 'All 3 done ✓';
    startBtn.style.display = 'block';
    return;
  }

  document.getElementById('practice-q').textContent =
    PRACTICE[practiceIdx].display + ' =';
  document.getElementById('practice-input').value = '';
  document.getElementById('practice-feedback').textContent = '';
  progressEl.textContent = `Problem ${practiceIdx + 1} of 3`;
  document.getElementById('practice-input').focus();
}

function submitPractice() {
  const input = document.getElementById('practice-input');
  const val   = parseInt(input.value);
  const fb    = document.getElementById('practice-feedback');
  if (isNaN(val)) return;

  const isCorrect = val === PRACTICE[practiceIdx].answer;
  fb.textContent  = isCorrect
    ? '✓ Correct!'
    : `✗ Answer was ${PRACTICE[practiceIdx].answer}`;
  fb.style.color  = isCorrect ? 'var(--correct)' : 'var(--wrong)';

  practiceIdx++;
  setTimeout(showPracticeQ, 700);
}


// ══════════════════════════════════════════════════════════════
//  TEST FLOW
// ══════════════════════════════════════════════════════════════

function startRealTest() {
  secondsLeft = ROUND_SECONDS;
  currentQ    = 0;
  answered    = 0;
  correct     = 0;

  updateStats();
  loadQuestion();
  showScreen('screen-quiz');
  document.getElementById('quiz-input').focus();
  startTimer();
}

function loadQuestion() {
  if (currentQ >= QUESTIONS.length) { endTest(); return; }

  document.getElementById('quiz-q').textContent = QUESTIONS[currentQ].display;
  document.getElementById('quiz-input').value   = '';
  document.getElementById('q-num').textContent  = currentQ + 1;
  document.getElementById('quiz-input').focus();
}

function submitAnswer() {
  const input     = document.getElementById('quiz-input');
  const val       = parseInt(input.value);
  if (isNaN(val)) return;

  answered++;
  const isCorrect = val === QUESTIONS[currentQ].answer;
  if (isCorrect) correct++;

  input.classList.add(isCorrect ? 'flash-correct' : 'flash-wrong');
  setTimeout(() => input.classList.remove('flash-correct', 'flash-wrong'), 200);

  updateStats();
  currentQ++;
  loadQuestion();
}

function updateStats() {
  document.getElementById('stat-answered').textContent = answered;
  document.getElementById('stat-correct').textContent  = correct;
  document.getElementById('stat-acc').textContent =
    answered > 0 ? Math.round((correct / answered) * 100) + '%' : '—';
}


// ══════════════════════════════════════════════════════════════
//  TIMER
// ══════════════════════════════════════════════════════════════

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();
    handleFeedback();
    if (secondsLeft <= 0) endTest();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerDisplay() {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  document.getElementById('timer-label').textContent =
    `${mins}:${String(secs).padStart(2, '0')}`;

  const frac   = secondsLeft / ROUND_SECONDS;
  const offset = CIRCUMFERENCE * (1 - frac);
  const ring   = document.getElementById('timer-ring');
  ring.style.strokeDashoffset = offset;
  ring.classList.toggle('urgent', secondsLeft <= 10);
}


// ══════════════════════════════════════════════════════════════
//  COUNTDOWN BANNER + BEEP
// ══════════════════════════════════════════════════════════════

let bannerTimeout = null;

function showCountdownBanner(number, isUrgent = false) {
  const banner = document.getElementById('countdown-banner');
  const numEl  = document.getElementById('countdown-number');
  const lblEl  = document.getElementById('countdown-label');

  numEl.textContent = number;
  lblEl.textContent = number === 1 ? 'second left' : 'seconds left';

  banner.classList.remove('hidden', 'urgent');
  if (isUrgent) banner.classList.add('urgent');

  // Re-trigger the pop animation
  banner.style.animation = 'none';
  banner.offsetHeight;   // reflow
  banner.style.animation = '';

  // Play beep — higher pitch for urgent
  playBeep(isUrgent ? 1046 : 880, 0.12, 0.3);

  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => banner.classList.add('hidden'), 1800);
}

function handleFeedback() {
  if (CONDITION === 'frequent') {
    // Announce every 10 seconds: 50, 40, 30, 20 — then once at 10
    if (secondsLeft > 0 && secondsLeft % 10 === 0) {
      showCountdownBanner(secondsLeft, secondsLeft <= 10);
    }
  } else {
    // Delayed: show once exactly when 10 seconds remain, then nothing
    if (secondsLeft === 10) {
      showCountdownBanner(10, true);
    }
  }
}


// ══════════════════════════════════════════════════════════════
//  END TEST
// ══════════════════════════════════════════════════════════════

function endTest() {
  stopTimer();
  document.getElementById('countdown-banner').classList.add('hidden');

  const elapsed = (ROUND_SECONDS - secondsLeft) / 60 || 1;
  const speed   = parseFloat((answered / elapsed).toFixed(1));
  const acc     = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  document.getElementById('res-answered').textContent = answered;
  document.getElementById('res-correct').textContent  = correct;
  document.getElementById('res-accuracy').textContent = acc + '%';
  document.getElementById('res-speed').textContent    = speed;
  document.getElementById('res-condition').textContent =
    CONDITION === 'frequent' ? 'Type 1 — Frequent (every 10s)' : 'Type 2 — Delayed (last 10s only)';

  showScreen('screen-results');
  submitToSheets({ answered, correct, accuracy: acc, speed, condition: CONDITION });
}


// ══════════════════════════════════════════════════════════════
//  GOOGLE SHEETS SUBMISSION
// ══════════════════════════════════════════════════════════════

async function submitToSheets({ answered, correct, accuracy, speed, condition }) {
  const statusEl  = document.getElementById('submit-status');
  const iconEl    = document.getElementById('submit-icon');
  const msgEl     = document.getElementById('submit-msg');

  // Consent is implied by checking the last checklist item
  const boxes     = document.querySelectorAll('.check-box');
  const consented = [...boxes].every(b => b.checked);

  if (!consented) {
    statusEl.className = 'submit-status no-consent';
    iconEl.textContent = 'ℹ️';
    msgEl.textContent  = 'No data collected (consent not given)';
    return;
  }

  if (!SHEET_URL || SHEET_URL.includes('YOUR_APPS_SCRIPT')) {
    statusEl.className = 'submit-status error';
    iconEl.textContent = '⚠️';
    msgEl.textContent  = 'Sheet URL not configured — see setup instructions';
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    condition,
    answered,
    correct,
    accuracy,
    speed,
    consented: true,
    userAgent: navigator.userAgent.slice(0, 80),
  };

  try {
    await fetch(SHEET_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    statusEl.className = 'submit-status success';
    iconEl.textContent = '✓';
    msgEl.textContent  = 'Results saved — thank you!';
  } catch (err) {
    statusEl.className = 'submit-status error';
    iconEl.textContent = '✗';
    msgEl.textContent  = 'Could not save results (check your connection)';
    console.error('Sheets submission error:', err);
  }
}
