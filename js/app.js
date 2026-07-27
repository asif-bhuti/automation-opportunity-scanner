/* Hallmark · js/app.js · PRD v3
 * Orchestrates the 8-step questionnaire, live ticker, pre-filled URL params
 * (v3 §2.1), and renders the report (ui.js) + climax CTA.
 * Deterministic, client-side, £0. No backend, no AI.
 */

import { QUESTIONS, STEP_META, totalSteps, getQuestionsForStep, resolveNumericAnswers } from './data/questions.js';
import { validateStep, applicableQuestions } from './validation.js';
import { generateReport } from './report.js';
import { calculateRevenueLeak, formatMoney } from './calculations.js';
import { getRegion } from './data/insights.js';
import {
  clear, el, renderProgress, renderQuestion, renderReport, renderScanState, scrollToAssessment,
} from './ui.js';
import { parseUrlParams, canAutoGenerate, industryDefaults } from './urlparams.js';

const STORAGE_KEY = 'aosc-v3';
const DEFAULT_BOOKING =
  (typeof document !== 'undefined' && document.body && document.body.dataset.bookingUrl) ||
  'https://cal.com/dexevel/15min';

function readPresetIndustry() {
  const body = document.body;
  if (body && body.dataset.industry) return body.dataset.industry;
  return '';
}

function loadState() {
  try { const raw = sessionStorage.getItem(STORAGE_KEY); if (!raw) return null; return JSON.parse(raw); }
  catch { return null; }
}
function saveState(state) { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
function clearState() { try { sessionStorage.removeItem(STORAGE_KEY); } catch {} }

/** Keep wizard navigation anchored to the assessment, not the document top. */
function scrollToAssessmentRoot(root, behavior = 'smooth') {
  if (!root || typeof root.scrollIntoView !== 'function') return;
  root.scrollIntoView({ behavior, block: 'start' });
}

/* ── Ticker (v2 §2.1) — partial leak from current answers ── */
function updateTicker(answers) {
  const ticker = document.getElementById('leak-ticker');
  if (!ticker) return;
  if (!answers.industry) { ticker.hidden = true; return; }

  // Compute a daily leak estimate from whatever answers we have so far
  const leak = calculateRevenueLeak(resolveNumericAnswers(answers));
  const perDay = Math.round((leak.totalAnnualLeak || 0) / 365);
  const openedAt = Number(ticker.dataset.openedAt || Date.now());
  if (!ticker.dataset.openedAt) ticker.dataset.openedAt = String(openedAt);
  const minsOpen = Math.max(1, Math.round((Date.now() - openedAt) / 60000));
  const since = Math.round(perDay * minsOpen / (60 * 24));

  const money = (n) => formatMoney(n, leak.currency, leak.locale);
  ticker.querySelector('[data-ticker-day]').textContent = `${money(perDay)}`;
  ticker.querySelector('[data-ticker-since]').textContent = `${money(since)}`;
  ticker.querySelector('[data-ticker-mins]').textContent = `${minsOpen}`;
  ticker.hidden = false;
}

function createApp(root) {
  const steps = totalSteps();
  const preset = readPresetIndustry();

  // v3 §2.1: parse URL params on init
  const urlResult = typeof window !== 'undefined' && window.location
    ? parseUrlParams(window.location.search)
    : { answers: {}, autoGenerate: false, hasParams: false };

  let state = loadState() || {
    step: 1,
    phase: 'wizard',
    answers: preset ? { industry: preset } : {},
    errors: {},
    report: null,
    prefilled: false,
  };

  // Merge URL params into answers
  if (urlResult.hasParams) {
    state.answers = { ...state.answers, ...urlResult.answers };
    state.prefilled = true;
  }
  if (preset) state.answers.industry = preset;

  // v3 §2.1: if auto=1 and enough answers, fill defaults and jump to report
  if (urlResult.autoGenerate && canAutoGenerate(urlResult.answers)) {
    const ind = urlResult.answers.industry || 'general';
    const defaults = industryDefaults(ind);
    state.answers = { ...defaults, ...urlResult.answers };
    state.phase = 'scanning';
    state.report = null;
  }

  function setAnswers(key, value) {
    state.answers = { ...state.answers, [key]: value };
    if (state.errors[key]) {
      const next = { ...state.errors };
      delete next[key];
      state.errors = next;
      const block = root.querySelector(`[data-key="${key}"]`);
      const err = block && block.querySelector('.field-error');
      if (err) err.remove();
    }
    saveState(state);
    updateTicker(state.answers);
  }

  function go(step) {
    state.step = Math.min(Math.max(1, step), steps);
    state.phase = 'wizard';
    saveState(state);
    render();
    root.focus({ preventScroll: true });
    scrollToAssessmentRoot(root);
  }

  function next() {
    const result = validateStep(state.step, state.answers);
    if (!result.valid) {
      state.errors = result.errors;
      render();
      const first = root.querySelector('.field-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    state.errors = {};
    if (state.step >= steps) { finish(); return; }
    go(state.step + 1);
  }

  function back() {
    state.errors = {};
    if (state.step <= 1) return;
    go(state.step - 1);
  }

  function finish() {
    state.phase = 'scanning';
    render();
    window.setTimeout(() => {
      state.report = generateReport(state.answers);
      state.phase = 'results';
      saveState(state);
      render();
      scrollToAssessmentRoot(root);
    }, 900);
  }

  function restart() {
    clearState();
    const baseAnswers = preset ? { industry: preset } : (urlResult.hasParams ? urlResult.answers : {});
    state = {
      step: 1,
      phase: 'wizard',
      answers: baseAnswers,
      errors: {},
      report: null,
      prefilled: urlResult.hasParams,
    };
    render();
    scrollToAssessmentRoot(root);
  }

  function render() {
    clear(root);
    if (state.phase === 'scanning') { root.append(renderScanState()); return; }
    if (state.phase === 'results' && state.report) {
      root.append(renderReport(state.report, { bookingUrl: DEFAULT_BOOKING, answers: state.answers }));
      return;
    }
    root.append(renderWizard());
  }

  function renderWizard() {
    const shell = el('div', { className: 'assessment-shell' });
    const meta = STEP_META[state.step - 1];

    shell.append(renderProgress({ current: state.step, total: steps, label: `Step ${state.step} of ${steps} · ${meta?.title || ''}` }));

    const card = el('div', { className: 'card', style: { marginTop: '1.25rem' } });
    card.append(
      el('h2', { className: 'wizard-step-title', text: meta?.title || 'Questions' }),
      el('p', { className: 'muted', text: meta?.description || '', style: { marginBottom: '1.5rem' } }),
    );

    let questions = getQuestionsForStep(state.step);
    if (preset) questions = questions.filter((q) => q.key !== 'industry');
    const applicable = new Set(applicableQuestions(state.answers).map((q) => q.key));
    questions = questions.filter((q) => applicable.has(q.key));

    if (questions.length === 0) {
      card.append(el('p', { className: 'muted', text: 'Continue to the next set of questions.' }));
    }

    for (const q of questions) {
      card.append(renderQuestion(q, state.answers[q.key], setAnswers, state.errors[q.key]));
    }

    const nav = el('div', { className: 'assessment-nav' });
    nav.append(
      el('button', { type: 'button', className: 'btn btn-ghost', text: 'Back', disabled: state.step === 1, onClick: back }),
      el('button', { type: 'button', className: 'btn btn-primary', text: state.step === steps ? 'See my report' : 'Continue', onClick: next }),
    );
    card.append(nav);
    shell.append(card);
    return shell;
  }

  window.addEventListener('ilm:restart', restart);

  return {
    start() {
      // If auto-generate was requested, go straight to scanning→report
      if (urlResult.autoGenerate && canAutoGenerate(urlResult.answers)) {
        state.phase = 'scanning';
        render();
        window.setTimeout(() => {
          state.report = generateReport(state.answers);
          state.phase = 'results';
          saveState(state);
          render();
          scrollToAssessmentRoot(root);
        }, 900);
      } else {
        render();
      }
      updateTicker(state.answers);
    },
    restart,
    getState: () => ({ ...state }),
  };
}

function wireLandingCtas() {
  document.querySelectorAll('[data-scroll-to-assessment]').forEach((node) => {
    node.addEventListener('click', (e) => {
      const target = document.getElementById('quiz');
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const app = document.getElementById('app');
        if (app) app.focus({ preventScroll: true });
      }
    });
  });
}

function main() {
  wireLandingCtas();
  const mount = document.getElementById('app');
  if (mount) {
    mount.setAttribute('tabindex', '-1');
    const app = createApp(mount);
    app.start();
  }

  // Recall protection: re-render ticker each minute while on the quiz
  if (typeof window !== 'undefined') {
    setInterval(() => {
      const quiz = document.getElementById('quiz');
      if (quiz && !quiz.hidden) {
        const state = loadState();
        if (state && state.answers) updateTicker(state.answers);
      }
    }, 60000);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
}

export { createApp, scrollToAssessment, QUESTIONS };
