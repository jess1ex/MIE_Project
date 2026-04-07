# Speedy BEDMAS

A browser-based timed math quiz built for the **MIE286 course project** at the University of Toronto. Participants solve as many 3-number BEDMAS problems as they can in 60 seconds, and their responses are logged automatically to a Google Sheet.

The study compares two **timing feedback conditions**:
- **Type 1 — Frequent:** a countdown banner appears every 10 seconds (at 50 s, 40 s, 30 s, 20 s, and 10 s)
- **Type 2 — Delayed:** the banner appears only once, when 10 seconds remain

Participants are assigned to a condition automatically via a server-side counter that alternates between the two groups (with a random fallback if the sheet is unreachable).

---

## Project structure

```
MIE_Project-main/
├── index.html      # All screens: intro/consent, practice, quiz, results
├── script.js       # App logic, question bank, timer, Google Sheets submission
├── style.css       # Styling (Space Mono + DM Sans, dark theme)
└── Code.gs         # Google Apps Script — receives POST data, writes to Sheets
```

---

## How it works

1. **Consent screen** — participant reads instructions and checks 7 items before continuing.
2. **Practice round** — 3 warm-up problems (not recorded).
3. **60-second quiz** — shuffled questions drawn from a 50-question bank. Timing feedback appears according to the assigned condition. Audio beeps and a circular timer ring provide visual/audio cues.
4. **Results screen** — score, accuracy, and speed (Q/min) are displayed, then POSTed to the Google Apps Script web app, which appends two rows: one summary row and one row per question answered.

---

## Setup

### 1. Deploy the Apps Script

1. Open [Google Apps Script](https://script.google.com) and create a new project.
2. Paste the contents of `Code.gs` into the editor.
3. At the top of `Code.gs`, set `SHEET_ID` to the ID of your Google Sheet (the long string in the sheet's URL).
4. Click **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployment URL.

### 2. Connect the front end

In `script.js`, paste your deployment URL into the constant at the top of the file:

```js
const SHEET_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### 3. Host the front end

The three front-end files (`index.html`, `script.js`, `style.css`) are plain static files — no build step required. You can serve them from:

- **GitHub Pages** — push to a repo, enable Pages on the `main` branch, and share the resulting URL.
- Any other static host (Netlify, Vercel, etc.).

---

## Google Sheet structure

Two tabs are created automatically on first submission.

**Responses** (one row per participant)

| Timestamp | Participant ID | Condition | Questions Answered | Correct | Accuracy (%) | Speed (q/min) | Consented | User Agent |
|-----------|---------------|-----------|-------------------|---------|--------------|---------------|-----------|------------|

**Questions** (one row per question answered — join on Participant ID)

| Timestamp | Participant ID | Condition | Q # | Expression | Correct Answer | Given Answer | Is Correct | Response Time (ms) |
|-----------|---------------|-----------|-----|------------|----------------|--------------|------------|-------------------|

> **To reset for a new data collection run:** delete all rows except the header row in both tabs.

---

## Question bank

The quiz draws from 50 hardcoded BEDMAS problems in `script.js`. All problems follow these constraints:

- Exactly 3 numbers
- Operations: `+`, `−`, `×`, `÷`
- Multiplication is capped at 2-digit × 1-digit
- Answers are always whole numbers

The 50 questions are shuffled on each session and cycled if a participant answers more than 50 (extremely unlikely in 60 s).

---

## Tech stack

| Layer | Technology |
|---|---|
| Front end | Vanilla HTML / CSS / JavaScript — no frameworks |
| Audio | Web Audio API (no external files) |
| Data collection | Google Apps Script web app + Google Sheets |
| Fonts | [Space Mono](https://fonts.google.com/specimen/Space+Mono) · [DM Sans](https://fonts.google.com/specimen/DM+Sans) |

---

## Privacy

Responses are collected **anonymously**. Participant IDs are generated from a Unix timestamp at submission time and are not linked to any personal information. Participation requires explicit consent via the checklist on the intro screen; if any item is unchecked, no data is sent.
