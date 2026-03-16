// ══════════════════════════════════════════════════════════════
//  SPEEDY BEDMAS — script.js
// ══════════════════════════════════════════════════════════════

// ▼▼▼  PASTE YOUR APPS SCRIPT WEB APP URL HERE  ▼▼▼
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyCLufd0-kLoP-et9uOS06fLpHw5auY5TRTdXfcdSNVX-NTtMHTIjjSHvQJQjq-IFSj/exec';
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
//  QUESTION BANK — 50 hardcoded problems
//  Multiplication capped at 2-digit × 1-digit throughout
// ══════════════════════════════════════════════════════════════

const QUESTIONS = [
  // ── Mixed: order of operations, brackets, division ────────
  { display: '30 + 12 × 4',         answer: 78  },
  { display: '50 − 14 × 3',         answer: 8   },
  { display: '(18 + 7) × 3',        answer: 75  },
  { display: '(30 − 14) × 5',       answer: 80  },
  { display: '48 ÷ 6 + 25',         answer: 33  },
  { display: '63 ÷ 7 − 5',          answer: 4   },
  { display: '15 × 4 − 18',         answer: 42  },
  { display: '12 × 6 + 11',         answer: 83  },
  { display: '(22 + 13) × 4',       answer: 140 },
  { display: '72 ÷ 8 + 17',         answer: 26  },
  { display: '45 − 18 × 2',         answer: 9   },
  { display: '(40 − 16) × 3',       answer: 72  },
  { display: '24 + 31 + 12',        answer: 67  },
  { display: '56 ÷ 7 + 34',         answer: 42  },
  { display: '13 × 5 − 27',         answer: 38  },
  { display: '(15 + 19) × 2',       answer: 68  },
  { display: '81 ÷ 9 − 4',          answer: 5   },
  { display: '27 + 16 × 3',         answer: 75  },
  { display: '(33 − 18) × 6',       answer: 90  },
  { display: '64 ÷ 8 + 29',         answer: 37  },
  { display: '14 × 7 − 36',         answer: 62  },
  { display: '53 − 18 + 14',        answer: 49  },
  { display: '(24 + 16) × 3',       answer: 120 },
  { display: '90 ÷ 9 + 43',         answer: 53  },
  { display: '55 − 13 × 4',         answer: 3   },
  { display: '(28 − 13) × 5',       answer: 75  },
  { display: '36 ÷ 4 + 19',         answer: 28  },
  { display: '11 × 8 − 45',         answer: 43  },
  { display: '(17 + 23) × 4',       answer: 160 },
  { display: '54 ÷ 6 − 7',          answer: 2   },
  { display: '32 + 15 × 5',         answer: 107 },
  { display: '(45 − 27) × 3',       answer: 54  },
  { display: '42 ÷ 7 + 38',         answer: 44  },
  { display: '16 × 6 − 58',         answer: 38  },
  { display: '(21 + 14) × 5',       answer: 175 },
  { display: '46 + 25 − 17',        answer: 54  },
  { display: '70 ÷ 7 − 3',          answer: 7   },
  { display: '44 − 12 × 3',         answer: 8   },
  { display: '(36 − 19) × 4',       answer: 68  },
  { display: '48 ÷ 6 − 5',          answer: 3   },
  { display: '13 × 6 + 24',         answer: 102 },
  { display: '(26 + 18) × 2',       answer: 88  },
  { display: '99 ÷ 9 + 16',         answer: 27  },
  { display: '18 × 5 − 64',         answer: 26  },
  { display: '(31 − 16) × 7',       answer: 105 },
  { display: '56 ÷ 8 + 47',         answer: 54  },
  { display: '25 + 14 × 6',         answer: 109 },
  { display: '62 − 24 − 11',        answer: 27  },
  { display: '(19 + 21) × 4',       answer: 160 },
  { display: '84 ÷ 7 − 8',          answer: 4   },
];


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