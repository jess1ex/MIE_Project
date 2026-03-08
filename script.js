// ══════════════════════════════════════════════════════════════
//  SPEEDY BEDMAS — script.js
// ══════════════════════════════════════════════════════════════

// ▼▼▼  PASTE YOUR APPS SCRIPT WEB APP URL HERE  ▼▼▼
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbz-8ocEQVM8a7KXJr_nhEJ0zPCuE9Nvn-RlG6pqjsy6GP8VsFfMVPRl2KG8lco0hzna/exec';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


// ══════════════════════════════════════════════════════════════
//  QUESTION BANK
//  100 multi-operation BEDMAS questions, fixed seed.
//  Same order for every participant.
// ══════════════════════════════════════════════════════════════

const QUESTIONS = (function () {
  // Seeded PRNG — guarantees identical questions every run
  function seededRng(seed) {
    let s = seed >>> 0;
    return () => {
      s = Math.imul(1664525, s) + 1013904223 >>> 0;
      return s / 0x100000000;
    };
  }

  const rng = seededRng(286);
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

  // ── Single-value operand (always 2-digit integers) ──────────
  function operand() { return randInt(10, 19); }

  // ── Question generators ──────────────────────────────────────

  // Type A: a ○ b ○ c  (no brackets, left-to-right with +/−)
  function typeA() {
    const a = randInt(10, 50);
    const b = randInt(10, 30);
    const c = randInt(10, 20);
    const ops = ['+', '−'];
    const op1 = ops[Math.floor(rng() * 2)];
    const op2 = ops[Math.floor(rng() * 2)];
    const val1 = op1 === '+' ? a + b : a - b;
    const ans  = op2 === '+' ? val1 + c : val1 - c;
    // keep answer positive
    if (ans < 0) return typeA();
    return { display: `${a} ${op1} ${b} ${op2} ${c}`, answer: ans };
  }

  // Type B: a ○ b × c  (one multiplication)
  function typeB() {
    const a  = randInt(10, 60);
    const b  = randInt(2, 9);
    const c  = randInt(2, 9);
    const op = rng() < 0.5 ? '+' : '−';
    const ans = op === '+' ? a + b * c : a - b * c;
    if (ans < 0) return typeB();
    return { display: `${a} ${op} ${b} × ${c}`, answer: ans };
  }

  // Type C: (a ○ b) × c  (bracket forces add/subtract first)
  function typeC() {
    const a  = randInt(10, 30);
    const b  = randInt(10, 20);
    const c  = randInt(2, 9);
    const op = rng() < 0.5 ? '+' : '−';
    const inner = op === '+' ? a + b : a - b;
    if (inner <= 0) return typeC();
    const ans = inner * c;
    return { display: `(${a} ${op} ${b}) × ${c}`, answer: ans };
  }

  // Type D: (a × b) ÷ c  (exact division guaranteed)
  function typeD() {
    const c   = randInt(2, 9);
    const res = randInt(2, 12);
    const a   = c * res;           // a is divisible by c
    const b   = randInt(2, 9);
    const ans = a * b / c;         // = res × b, always integer
    return { display: `(${a} × ${b}) ÷ ${c}`, answer: ans };
  }

  // Type E: a ÷ b + c  or  a ÷ b − c
  function typeE() {
    const b   = randInt(2, 9);
    const res = randInt(2, 12);
    const a   = b * res;
    const c   = randInt(10, 20);
    const op  = rng() < 0.5 ? '+' : '−';
    const ans = op === '+' ? res + c : res - c;
    if (ans < 0) return typeE();
    return { display: `${a} ÷ ${b} ${op} ${c}`, answer: ans };
  }

  // Distribute types evenly: 20 of each across 100 questions
  const types = [typeA, typeB, typeC, typeD, typeE];
  const typeList = [];
  for (const t of types) for (let i = 0; i < 20; i++) typeList.push(t);

  // Shuffle
  for (let i = typeList.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [typeList[i], typeList[j]] = [typeList[j], typeList[i]];
  }

  return typeList.map(fn => fn());
})();


// ══════════════════════════════════════════════════════════════
//  PRACTICE QUESTIONS
// ══════════════════════════════════════════════════════════════

const PRACTICE = [
  { display: '7 + 8',           answer: 15 },
  { display: '24 − 9',          answer: 15 },
  { display: '6 × 7',           answer: 42 },
  { display: '36 ÷ 4',          answer: 9  },
  { display: '(12 + 3) × 4',    answer: 60 },
  { display: '20 + 3 × 5',      answer: 35 },
];
let practiceIdx = 0;


// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════

const ROUND_SECONDS = 120;   // 2 minutes per round
const CIRCUMFERENCE = 2 * Math.PI * 26; // SVG ring

// Randomise condition order — counterbalanced across participants
// Half get frequent→delayed, half get delayed→frequent
const CONDITION_ORDER = Math.random() < 0.5
  ? ['frequent', 'delayed']
  : ['delayed', 'frequent'];

let currentRound  = 0;   // 0 = round 1, 1 = round 2
let timerInterval = null;
let secondsLeft   = ROUND_SECONDS;
let currentQ      = 0;
let answered      = 0;
let correct       = 0;

// Per-round results stored here
const roundResults = [null, null];


// ══════════════════════════════════════════════════════════════
//  SCREEN MANAGEMENT
// ══════════════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goToIntro()    { showScreen('screen-intro'); }
function goToPractice() { practiceIdx = 0; showPracticeQ(); showScreen('screen-practice'); }


// ══════════════════════════════════════════════════════════════
//  PRACTICE
// ══════════════════════════════════════════════════════════════

function showPracticeQ() {
  if (practiceIdx >= PRACTICE.length) practiceIdx = 0;
  document.getElementById('practice-q').textContent =
    PRACTICE[practiceIdx].display + ' =';
  document.getElementById('practice-input').value = '';
  document.getElementById('practice-feedback').textContent = '';
  document.getElementById('practice-input').focus();
}

function submitPractice() {
  const input = document.getElementById('practice-input');
  const val   = parseInt(input.value);
  const fb    = document.getElementById('practice-feedback');
  if (isNaN(val)) return;

  const correct = val === PRACTICE[practiceIdx].answer;
  fb.textContent = correct
    ? '✓ Correct!'
    : `✗ Answer was ${PRACTICE[practiceIdx].answer}`;
  fb.style.color = correct ? 'var(--correct)' : 'var(--wrong)';

  practiceIdx++;
  setTimeout(showPracticeQ, 700);
}


// ══════════════════════════════════════════════════════════════
//  TEST FLOW
// ══════════════════════════════════════════════════════════════

function startRealTest() {
  currentRound = 0;
  beginRound();
}

function beginRound() {
  // Reset per-round counters
  secondsLeft = ROUND_SECONDS;
  currentQ    = 0;
  answered    = 0;
  correct     = 0;

  // Update round badge
  document.getElementById('round-badge').textContent = `Round ${currentRound + 1}`;

  updateStats();
  loadQuestion();
  showScreen('screen-quiz');
  document.getElementById('quiz-input').focus();
  startTimer();
}

function startRound2() {
  currentRound = 1;
  beginRound();
}

function loadQuestion() {
  // Use a different slice of questions for each round
  const offset = currentRound * 50;
  const idx    = offset + currentQ;

  if (idx >= QUESTIONS.length || currentQ >= 50) {
    endRound();
    return;
  }

  document.getElementById('quiz-q').textContent = QUESTIONS[idx].display;
  document.getElementById('quiz-input').value   = '';
  document.getElementById('q-num').textContent  = currentQ + 1;
  document.getElementById('progress-fill').style.width =
    `${(currentQ / 50) * 100}%`;
  document.getElementById('quiz-input').focus();
}

function submitAnswer() {
  const input = document.getElementById('quiz-input');
  const val   = parseInt(input.value);
  if (isNaN(val)) return;

  answered++;
  const offset    = currentRound * 50;
  const isCorrect = val === QUESTIONS[offset + currentQ].answer;
  if (isCorrect) correct++;

  // Flash border
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
    if (secondsLeft <= 0) endRound();
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
//  COUNTDOWN OVERLAY
//  Shows a large translucent number on screen
// ══════════════════════════════════════════════════════════════

let overlayTimeout = null;

function showCountdownOverlay(number, isUrgent = false) {
  const overlay = document.getElementById('countdown-overlay');
  const numEl   = document.getElementById('countdown-number');
  const lblEl   = document.getElementById('countdown-label');

  numEl.textContent = number;
  numEl.classList.toggle('urgent', isUrgent);
  lblEl.textContent = number === 1 ? 'second left' : 'seconds left';

  // Re-trigger animation by cloning the inner element
  const inner    = overlay.querySelector('.countdown-inner');
  const newInner = inner.cloneNode(true);
  overlay.replaceChild(newInner, inner);

  overlay.classList.remove('hidden');

  clearTimeout(overlayTimeout);
  overlayTimeout = setTimeout(() => overlay.classList.add('hidden'), 1800);
}

function handleFeedback() {
  const condition = CONDITION_ORDER[currentRound];

  if (condition === 'frequent') {
    // Show overlay every 10 seconds (110, 100, 90 ... 10)
    if (secondsLeft > 0 && secondsLeft % 10 === 0) {
      showCountdownOverlay(secondsLeft, secondsLeft <= 10);
    }
  } else {
    // Only show in the last 10 seconds, one number at a time
    if (secondsLeft <= 10 && secondsLeft > 0) {
      showCountdownOverlay(secondsLeft, true);
    }
  }
}


// ══════════════════════════════════════════════════════════════
//  ROUND END
// ══════════════════════════════════════════════════════════════

function endRound() {
  stopTimer();
  document.getElementById('countdown-overlay').classList.add('hidden');

  const elapsed = (ROUND_SECONDS - secondsLeft) / 60 || 2;
  const speed   = parseFloat((answered / elapsed).toFixed(1));
  const acc     = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  roundResults[currentRound] = {
    condition: CONDITION_ORDER[currentRound],
    answered,
    correct,
    accuracy: acc,
    speed,
  };

  if (currentRound === 0) {
    showTransitionScreen();
  } else {
    showResults();
  }
}

function showTransitionScreen() {
  const r = roundResults[0];
  document.getElementById('trans-answered').textContent = r.answered;
  document.getElementById('trans-correct').textContent  = r.correct;
  document.getElementById('trans-acc').textContent      = r.accuracy + '%';

  const nextCond = CONDITION_ORDER[1];
  document.getElementById('trans-next-condition').textContent =
    nextCond === 'frequent' ? 'frequent timing reminders' : 'minimal timing reminders';

  showScreen('screen-transition');
}


// ══════════════════════════════════════════════════════════════
//  RESULTS
// ══════════════════════════════════════════════════════════════

function showResults() {
  const condLabel = c => c === 'frequent' ? 'Frequent' : 'Delayed';

  const r1 = roundResults[0];
  const r2 = roundResults[1];

  document.getElementById('res-r1-condition').textContent = condLabel(r1.condition);
  document.getElementById('res-r1-answered').textContent  = r1.answered;
  document.getElementById('res-r1-acc').textContent       = r1.accuracy + '%';
  document.getElementById('res-r1-speed').textContent     = r1.speed;

  document.getElementById('res-r2-condition').textContent = condLabel(r2.condition);
  document.getElementById('res-r2-answered').textContent  = r2.answered;
  document.getElementById('res-r2-acc').textContent       = r2.accuracy + '%';
  document.getElementById('res-r2-speed').textContent     = r2.speed;

  showScreen('screen-results');
  submitToSheets();
}


// ══════════════════════════════════════════════════════════════
//  GOOGLE SHEETS SUBMISSION
// ══════════════════════════════════════════════════════════════

async function submitToSheets() {
  const statusEl  = document.getElementById('submit-status');
  const iconEl    = document.getElementById('submit-icon');
  const msgEl     = document.getElementById('submit-msg');
  const consented = document.getElementById('consent-check').checked;

  if (!consented) {
    statusEl.className  = 'submit-status no-consent';
    iconEl.textContent  = 'ℹ️';
    msgEl.textContent   = 'No data collected (consent not given)';
    return;
  }

  if (!SHEET_URL || SHEET_URL.includes('YOUR_APPS_SCRIPT')) {
    statusEl.className = 'submit-status error';
    iconEl.textContent = '⚠️';
    msgEl.textContent  = 'Sheet URL not configured — see setup instructions';
    return;
  }

  const r1 = roundResults[0];
  const r2 = roundResults[1];

  const payload = {
    timestamp:       new Date().toISOString(),
    conditionOrder:  CONDITION_ORDER.join(' → '),
    r1_condition:    r1.condition,
    r1_answered:     r1.answered,
    r1_correct:      r1.correct,
    r1_accuracy:     r1.accuracy,
    r1_speed:        r1.speed,
    r2_condition:    r2.condition,
    r2_answered:     r2.answered,
    r2_correct:      r2.correct,
    r2_accuracy:     r2.accuracy,
    r2_speed:        r2.speed,
    consented:       true,
    userAgent:       navigator.userAgent.slice(0, 80),
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
