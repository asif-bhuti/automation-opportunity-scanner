/* Hallmark · module: ui · PRD v3
 * Pure DOM helpers + report rendering. Carries forward v1 report structure,
 * adds v3 blocks: pipeline-stall visualizer, what-if, email draft, upgraded CTA.
 * No globals. Uses locked design.md tokens.
 */

import { formatMoney } from './calculations.js';
import { automationIconGradient, nodeIconGradient, categoryIcon, iconSvg } from './icons.js';
import { downloadReportPdf, CAL_URL } from './pdf.js';
import { validateLeadGate, submitLeadCapture } from './lead-capture.js';
import { mountPipeline } from './pipeline-stall.js';
import { runWhatIf, progressiveWhatIf, fullyOptimized } from './whatif.js';
import { renderEmailDraftBlock } from './email-draft.js';

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign(node.dataset, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(node.style, value);
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Keep wizard navigation anchored to the assessment, not the document top. */
export function scrollToAssessment(root, behavior = 'smooth') {
  if (!root || typeof root.scrollIntoView !== 'function') return;
  root.scrollIntoView({ behavior, block: 'start' });
}

/** Animate a number from 0 → target. */
export function animateNumber(element, target, { duration = 800, prefix = '', suffix = '' } = {}) {
  if (!element) return;
  if (prefersReducedMotion()) {
    element.textContent = `${prefix}${Math.round(target).toLocaleString('en-GB')}${suffix}`;
    return;
  }
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(target * eased);
    element.textContent = `${prefix}${value.toLocaleString('en-GB')}${suffix}`;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function renderProgress({ current, total, label }) {
  const pct = Math.round((current / total) * 100);
  const wrap = el('div', { className: 'progress', role: 'group', 'aria-label': 'Assessment progress' });
  const head = el('div', { className: 'progress-head' }, [
    el('span', { text: label || `Step ${current} of ${total}` }),
    el('span', { text: `${pct}%` }),
  ]);
  const track = el('div', {
    className: 'progress-track',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': String(pct),
  });
  const bar = el('div', { className: 'progress-bar', style: { width: `${pct}%` } });
  track.append(bar);
  wrap.append(head, track);
  requestAnimationFrame(() => { bar.style.width = `${pct}%`; });
  return wrap;
}

export function renderQuestion(question, value, onChange, error) {
  const block = el('div', {
    className: 'question-block slide-up',
    dataset: { key: question.key },
  });

  block.append(el('label', { className: 'question-label', id: `q-label-${question.key}`, text: question.label }));
  if (question.help) block.append(el('p', { className: 'question-help', text: question.help }));

  const grid = el('div', { className: 'option-grid', role: 'radiogroup', 'aria-labelledby': `q-label-${question.key}` });

  for (const opt of question.options || []) {
    const id = `${question.key}-${opt.value}`;
    const option = el('div', { className: 'option' });
    const input = el('input', { type: 'radio', name: question.key, id, value: opt.value, checked: value === opt.value });
    input.addEventListener('change', () => onChange(question.key, opt.value));
    const label = el('label', { className: 'option-label', for: id }, [
      el('span', { className: 'option-check', 'aria-hidden': 'true' }),
      el('span', { text: opt.label }),
    ]);
    option.append(input, label);
    grid.append(option);
  }
  block.append(grid);

  if (error) block.append(el('div', { className: 'field-error', role: 'alert', text: error }));
  return block;
}

export function renderGauge(score, bandLabel) {
  const wrap = el('div', { className: 'gauge-wrap' });
  const gauge = el('div', { className: 'gauge', role: 'img', 'aria-label': `Automation maturity ${score} out of 100, ${bandLabel}` });
  const inner = el('div', { className: 'gauge-inner', }, [
    el('div', { className: 'gauge-value', dataset: { gaugeValue: '1' }, text: '0' }),
    el('div', { className: 'gauge-label', text: 'Maturity / 100' }),
  ]);
  gauge.append(inner);
  wrap.append(gauge, el('div', { className: 'badge badge-primary', text: bandLabel }));

  const reduced = prefersReducedMotion();
  const duration = reduced ? 0 : 900;
  requestAnimationFrame(() => {
    if (reduced) { gauge.style.setProperty('--score', String(score)); inner.querySelector('[data-gauge-value]').textContent = String(score); return; }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(score * eased);
      gauge.style.setProperty('--score', String(v));
      inner.querySelector('[data-gauge-value]').textContent = String(v);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  return wrap;
}

const SEVERITY_ICONS = { critical: 'alert', warning: 'shield', info: 'eye' };

function renderAlert(insight) {
  const severity = insight.severity || 'info';
  const sevLabel = { critical: 'Critical alert', warning: 'Warning', info: 'Insight' }[severity];
  const hasStat = Boolean(insight.stat);
  return el('div', { className: `alert-banner is-${severity}`, role: 'note', 'aria-label': `${sevLabel}: ${insight.title || ''}` }, [
    el('div', { className: 'alert-banner__header' }, [
      el('span', { className: 'alert-icon', 'aria-hidden': 'true', html: iconSvg(SEVERITY_ICONS[severity] || 'eye') }),
      hasStat
        ? el('div', { className: 'alert-banner__stat-row' }, [
            el('span', { className: 'alert-stat', text: insight.stat }),
            el('strong', { className: 'alert-headline', text: insight.title || '' }),
          ])
        : el('strong', { className: 'alert-headline', text: insight.title || '' }),
    ]),
    el('div', { className: 'alert-body' }, [
      el('p', { text: insight.body || '' }),
    ]),
  ]);
}

function stat(value, label) {
  return el('div', { className: 'stat' }, [
    el('div', { className: 'stat-value', text: value }),
    el('div', { className: 'stat-label', text: label }),
  ]);
}

function opportunityCard(item, money) {
  const card = el('article', { className: 'opp-card' });

  // Header row: rank + priority badge
  card.append(el('div', { className: 'opp-card-header' }, [
    el('div', { className: 'opp-title-row' }, [
      el('span', { className: 'opp-icon', html: automationIconGradient(item.id) }),
      el('span', { className: 'opp-rank', text: `#${item.rank}` }),
    ]),
    el('span', { className: 'badge badge-primary', text: item.priority }),
  ]));

  // Title + summary
  card.append(
    el('h4', { className: 'opp-card-title', text: item.name }),
    el('p', { className: 'muted opp-card-summary', text: item.summary }),
  );

  // Market intel (if present) — only show here, not in leak breakdown
  if (item.insight) {
    card.append(el('div', { className: `opp-insight is-${item.insight.severity}` }, [
      el('span', { className: 'opp-insight-kicker', text: 'MARKET INTEL' }),
      el('div', { className: 'opp-insight-row' }, [
        el('span', { className: 'opp-insight-stat', text: item.insight.stat }),
        el('span', { className: 'opp-insight-body', text: item.insight.body }),
      ]),
    ]));
  }

  // Meta badges row
  card.append(el('div', { className: 'opp-meta' }, [
    metaBadge('Category', item.category, 'badge-muted', 'What this opportunity improves', categoryIcon(item.category)),
    metaBadge('Effort', item.difficultyLabel, 'badge-accent', 'Estimated implementation effort'),
    metaBadge('ETA', item.timelineLabel, 'badge-warning', 'Estimated implementation timeline'),
  ]));

  // Metrics grid
  card.append(el('div', { className: 'opp-metrics' }, [
    metric('Est. annual value', money(item.estimatedAnnualValue)),
    metric('Hours saved / wk', `${item.hoursSavedPerWeek}h`),
    metric('ROI multiple', `${item.roiMultiple}×`),
    metric('deXevel module', (item.modules && item.modules[0]) || 'Custom'),
  ]));

  return card;
}

function metaBadge(label, value, className, description, iconHtml) {
  return el('span', { className: `badge ${className}`, title: description, 'aria-label': `${label}: ${value}` }, [
    iconHtml ? el('span', { className: 'badge-icon', html: iconHtml }) : null,
    el('span', { className: 'badge-label', text: label }),
    el('span', { className: 'badge-value', text: value }),
  ]);
}

function metric(label, value) {
  return el('div', {}, [
    el('div', { className: 'metric-label', text: label }),
    el('div', { className: 'metric-value', text: value }),
  ]);
}

function roadmapCol(title, items, money) {
  const phase = items && items[0];
  const col = el('article', { className: 'roadmap-col' });
  col.append(el('div', { className: 'roadmap-col-head' }, [
    el('span', { className: 'roadmap-phase', text: phase?.phase || title }),
    el('h4', { text: title }),
    el('p', { className: 'roadmap-objective', text: phase?.objective || 'Buffer / measurement week' }),
  ]));
  const ul = el('ul', { className: 'roadmap-items' });
  if (!items || items.length === 0) {
    ul.append(el('li', { className: 'roadmap-empty', text: 'Use this window to measure baseline performance and prepare the next build.' }));
  } else {
    for (const item of items) {
      ul.append(el('li', { className: 'roadmap-item' }, [
        el('span', { className: 'roadmap-item-index', text: '→' }),
        el('span', { className: 'roadmap-item-content' }, [
          el('strong', { text: item.name }),
          el('span', { className: 'dim', text: `${item.timelineDays}d build · ${money(item.estimatedAnnualValue)}/yr potential` }),
        ]),
      ]));
    }
  }
  col.append(ul);
  return col;
}

/* ── v3 §2.2 What-if block ── */
function renderWhatIfBlock(report, answers) {
  const money = (n) => formatMoney(Math.round(n), report.currency, report.locale);
  const stages = progressiveWhatIf(answers, report, 3);
  const full = fullyOptimized(answers, report);
  if (!stages.length && !full) return null;

  const section = el('section', { className: 'card section-sm whatif slide-up', id: 'whatif' });
  section.append(
    el('span', { className: 'eyebrow', text: 'New Game+' }),
    el('h3', { className: 'whatif-head', text: 'What if you fixed your #1 gap?' }),
    el('p', { className: 'whatif-sub', text: 'Re-run the engine with your top gaps resolved. See the delta in hard currency.' }),
  );

  const stagesWrap = el('div', { className: 'whatif-stages' });

  for (const stage of stages) {
    const stageEl = el('div', { className: 'whatif-stage' });
    stageEl.append(
      el('div', { className: 'whatif-stage-head' }, [
        el('span', { className: 'whatif-stage-label', text: stage.label }),
      ]),
      el('div', { className: 'whatif-stage-body' }, [
        el('div', { className: 'whatif-compare' }, [
          el('div', { className: 'whatif-col now' }, [
            el('span', { className: 'whatif-col-label', text: 'Now' }),
            el('span', { className: 'whatif-col-value', text: `${money(report.leak.totalAnnualLeak)}/yr` }),
            el('span', { className: 'whatif-col-sub dim', text: `${report.scoring.maturityScore}/100` }),
          ]),
          el('div', { className: 'whatif-arrow', text: '→' }),
          el('div', { className: 'whatif-col fixed' }, [
            el('span', { className: 'whatif-col-label', text: 'Fixed' }),
            el('span', { className: 'whatif-col-value', text: `${money(stage.newLeakTotal)}/yr` }),
            el('span', { className: 'whatif-col-sub dim', text: `${stage.newMaturityScore}/100 ${stage.newBand}` }),
          ]),
        ]),
        el('div', { className: 'whatif-delta' }, [
          el('span', { className: 'whatif-delta-value', text: `${money(stage.leakReduction)}/yr recovered` }),
          el('span', { className: 'whatif-delta-sep', text: '·' }),
          el('span', { className: 'whatif-delta-value', text: `+${stage.maturityGain} pts` }),
          stage.hoursRecovered > 0 ? el('span', { className: 'whatif-delta-sep', text: '·' }) : null,
          stage.hoursRecovered > 0 ? el('span', { className: 'whatif-delta-value', text: `${Math.round(stage.hoursRecovered)}h/wk back` }) : null,
        ]),
        el('p', { className: 'whatif-fix-labels', text: stage.fixLabels.join(' · ') }),
      ]),
    );
    stagesWrap.append(stageEl);
  }
  section.append(stagesWrap);

  if (full) {
    const actions = el('div', { className: 'whatif-actions' });
    const fullBtn = el('button', { type: 'button', className: 'btn btn-ghost', text: 'See fully optimised', onClick: () => showFullyOptimized(section, full, report, money) });
    actions.append(fullBtn);
    section.append(actions);
  }

  return section;
}

function showFullyOptimized(section, full, report, money) {
  const existing = section.querySelector('.whatif-full-result');
  if (existing) existing.remove();
  const stageEl = el('div', { className: 'whatif-stage whatif-full-result' });
  stageEl.append(
    el('div', { className: 'whatif-stage-head' }, [
      el('span', { className: 'whatif-stage-label', text: 'Fully optimised' }),
    ]),
    el('div', { className: 'whatif-stage-body' }, [
      el('div', { className: 'whatif-compare' }, [
        el('div', { className: 'whatif-col now' }, [
          el('span', { className: 'whatif-col-label', text: 'Now' }),
          el('span', { className: 'whatif-col-value', text: `${money(report.leak.totalAnnualLeak)}/yr` }),
          el('span', { className: 'whatif-col-sub dim', text: `${report.scoring.maturityScore}/100` }),
        ]),
        el('div', { className: 'whatif-arrow', text: '→' }),
        el('div', { className: 'whatif-col fixed' }, [
          el('span', { className: 'whatif-col-label', text: 'Fully optimised' }),
          el('span', { className: 'whatif-col-value', text: `${money(full.newLeakTotal)}/yr` }),
          el('span', { className: 'whatif-col-sub dim', text: `${full.newMaturityScore}/100 ${full.newBand}` }),
        ]),
      ]),
      el('div', { className: 'whatif-delta' }, [
        el('span', { className: 'whatif-delta-value', text: `${money(full.leakReduction)}/yr recovered` }),
        el('span', { className: 'whatif-delta-sep', text: '·' }),
        el('span', { className: 'whatif-delta-value', text: `+${full.maturityGain} pts` }),
      ]),
    ]),
  );
  section.append(stageEl);
}

/* ── PDF gate ── */
function renderPdfGate(report) {
  const section = el('section', { className: 'card section-sm pdf-gate slide-up', id: 'pdf-report' });
  const status = el('div', { className: 'pdf-gate-status muted', role: 'status', 'aria-live': 'polite' });

  section.append(
    el('span', { className: 'eyebrow', text: 'Shareable artifact' }),
    el('h3', { text: 'Get this report as a branded PDF' }),
    el('p', { className: 'muted', text: 'The on-screen report is yours either way. The PDF is optional.' }),
  );

  const form = el('form', { className: 'pdf-gate-form', novalidate: 'novalidate' });
  const nameInput = fieldInput('name', 'Name', 'text', 'Your name');
  const companyInput = fieldInput('company', 'Company', 'text', 'Company name');
  const emailInput = fieldInput('email', 'Email', 'email', 'you@company.com');
  form.append(nameInput.wrap, companyInput.wrap, emailInput.wrap);
  const submitBtn = el('button', { type: 'submit', className: 'btn btn-primary btn-lg', text: 'Send me the PDF' });
  form.append(submitBtn, status);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = { name: nameInput.input.value, company: companyInput.input.value, email: emailInput.input.value };
    const { valid, errors, values } = validateLeadGate(raw);
    nameInput.setError(errors.name || '');
    companyInput.setError(errors.company || '');
    emailInput.setError(errors.email || '');
    if (!valid) { status.textContent = 'Fill name, company, and email to generate the PDF.'; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Preparing PDF…';
    status.textContent = 'Generating your branded report…';

    const capturePromise = submitLeadCapture(report, values).catch((err) => ({ ok: false, error: err?.message }));
    try {
      await downloadReportPdf(report, { companyName: values.company, contactName: values.name, email: values.email });
      const capture = await capturePromise;
      if (capture.ok) status.textContent = 'PDF downloaded. We also sent your details so we can follow up if useful.';
      else if (capture.skipped) status.textContent = 'PDF downloaded. (Lead form endpoint not configured — PDF still works.)';
      else status.textContent = 'PDF downloaded. Lead notify failed in the background — your report is unaffected.';
    } catch (err) {
      status.textContent = err?.message || 'Could not generate the PDF. Check your connection and try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send me the PDF';
    }
  });
  section.append(form);
  return section;
}

function fieldInput(name, label, type, placeholder) {
  const id = `pdf-gate-${name}`;
  const err = el('div', { className: 'field-error', hidden: true });
  const input = el('input', { className: 'text-input', type, name, id, placeholder, autocomplete: name === 'email' ? 'email' : name === 'name' ? 'name' : 'organization', required: true });
  const wrap = el('div', { className: 'field' }, [el('label', { className: 'field-label', for: id, text: label }), input, err]);
  return { wrap, input, setError(msg) { if (msg) { err.hidden = false; err.textContent = msg; input.setAttribute('aria-invalid', 'true'); } else { err.hidden = true; err.textContent = ''; input.removeAttribute('aria-invalid'); } } };
}

/* ── Main report renderer ── */
export function renderReport(report, { bookingUrl, answers } = {}) {
  const bookUrl = bookingUrl || CAL_URL;
  const root = el('div', { className: 'results fade-in', id: 'results' });
  const { scoring, leak, recommendations, roadmap, headline, industry, summary, reportAlerts = [], narratives = { callouts: [], anchors: [] }, freeFix, topLeak } = report;
  const money = (n) => formatMoney(n, report.currency, report.locale);

  // Hero — clean stacked layout
  const hero = el('section', { className: 'card result-hero' });
  hero.append(
    el('div', { className: 'result-hero__top' }, [
      renderGauge(scoring.maturityScore, scoring.bandLabel),
      el('div', { className: 'result-hero__intro' }, [
        el('span', { className: 'eyebrow', text: `${industry.shortName} diagnostic` }),
        el('h2', { text: 'Your Automation Opportunity Report' }),
        el('p', { className: 'lead', text: headline.opportunityLine }),
      ]),
    ]),
    el('div', { className: 'stat-grid' }, [
      stat(money(leak.totalAnnualLeak), `Est. annual leakage · ${money(leak.totalWeeklyLeak || 0)}/wk`),
      stat(money(leak.recoverableAnnual), `Recoverable · ${money(leak.recoverableWeekly || 0)}/wk`),
      stat(`${Math.round(summary.hoursSavedPotential)}h`, 'Hours / week potential'),
      stat(String(summary.automationCount), 'Priority automations'),
    ]),
  );
  root.append(hero);

  // Anchors
  const anchors = narratives.anchors || leak.anchors || [];
  if (anchors.length) {
    const anchorCard = el('section', { className: 'card section-sm anchor-strip slide-up' });
    anchorCard.append(el('span', { className: 'eyebrow', text: 'What that money means' }),
      el('div', { className: 'anchor-list' }, anchors.slice(0, 3).map((a) => {
        const text = typeof a.copy === 'function' ? a.copy(money) : a.copy || a.label;
        return el('div', { className: 'anchor-item' }, [el('span', { className: 'anchor-label', text: a.label }), el('p', { text })]);
      })));
    root.append(anchorCard);
  }

  // Narrative callouts + report alerts
  const callouts = narratives.callouts || [];
  if (callouts.length || reportAlerts.length) {
    const alerts = el('div', { className: 'alert-stack' });
    for (const a of reportAlerts) alerts.append(renderAlert(a));
    for (const c of callouts) alerts.append(renderAlert({ severity: c.severity || 'info', title: c.title, body: c.body }));
    root.append(alerts);
  }
  // v3 §2.3 Pipeline-stall visualizer
  if (answers) {
    const pipeline = mountPipeline(answers, industry.id, report);
    if (pipeline) {
      const pipelineSection = el('section', { className: 'section-sm slide-up', id: 'pipeline' });
      pipelineSection.append(el('span', { className: 'eyebrow', text: 'Pipeline bottleneck' }), el('h3', { text: 'Where your workflow stalls' }));
      pipelineSection.append(pipeline);
      root.append(pipelineSection);
    }
  }

  // Leak breakdown
  const leakCard = el('section', { className: 'card section-sm slide-up' });
  leakCard.append(el('h3', { text: 'Revenue leak breakdown' }), el('p', { className: 'muted', text: 'Directional model from your answers — not a formal audit. Built to prioritise where automation pays first.' }));
  const barList = el('div', { className: 'bar-list' });
  const max = Math.max(...leak.categories.map((c) => c.annual), 1);
  for (const cat of leak.categories) {
    const weekly = cat.weekly || Math.round((cat.annual || 0) / 52);
    const row = el('div', { className: 'bar-row' });
    row.append(el('div', { className: 'bar-meta' }, [el('span', { text: cat.label }), el('strong', { text: `${money(cat.annual)}/yr · ${money(weekly)}/wk` })]));
    const track = el('div', { className: 'bar-track' });
    const fill = el('div', { className: 'bar-fill' });
    track.append(fill);
    row.append(track);
    if (cat.insights && cat.insights.length > 0) {
      const ins = cat.insights[0];
      row.append(el('div', { className: `leak-insight is-${ins.severity}` }, [el('span', { className: 'leak-insight-stat', text: ins.stat }), el('span', { className: 'leak-insight-body', text: ins.body })]));
    }
    barList.append(row);
    const pct = Math.round((cat.annual / max) * 100);
    requestAnimationFrame(() => { fill.style.width = `${pct}%`; });
  }
  leakCard.append(barList);
  root.append(leakCard);

  // Opportunities
  const opp = el('section', { className: 'section-sm opp-section' });
  opp.append(el('h3', { text: 'Top automation opportunities' }), el('p', { className: 'muted', text: 'Ranked by fit to your gaps, industry playbooks, and estimated yearly value.' }));
  const list = el('div', { className: 'opp-list stagger' });
  for (const item of recommendations) list.append(opportunityCard(item, money));
  opp.append(list);
  root.append(opp);

  // Roadmap
  const road = el('section', { className: 'section-sm' });
  road.append(el('h3', { text: '90-day implementation roadmap' }));
  const grid = el('div', { className: 'roadmap' });
  grid.append(roadmapCol('Days 0–30', roadmap.days0to30, money), roadmapCol('Days 31–60', roadmap.days31to60, money), roadmapCol('Days 61–90', roadmap.days61to90, money));
  road.append(grid);
  root.append(road);

  // v3 §2.2 What-if block
  if (answers) {
    const whatif = renderWhatIfBlock(report, answers);
    if (whatif) root.append(whatif);
  }

  // v3 §2.4 Email draft block
  if (answers) {
    const emailBlock = renderEmailDraftBlock(report, answers);
    if (emailBlock) root.append(emailBlock);
  }

  // PDF soft gate
  root.append(renderPdfGate(report));

  // Upgraded climax CTA (v3 §8 — "worth £1000")
  const topLeakLabel = summary.topLeakLabel || topLeak?.label || 'top leak';
  const topLeakFig = money(summary.topLeakAnnual || topLeak?.annual || 0);
  const whatIfDelta = (answers && fullyOptimized(answers, report)) ? money(fullyOptimized(answers, report).leakReduction) : null;
  const cta = el('section', { className: 'card section-sm cta-panel slide-up', id: 'book' }, [
    el('span', { className: 'eyebrow', text: 'Next step' }),
    el('h2', { text: 'This delta is what 15 minutes gets you.' }),
    el('p', { className: 'lead', text: whatIfDelta
      ? `${topLeakLabel} = ${topLeakFig}/yr. Fix #1 recovers ${whatIfDelta}/yr. This delta is what 15 minutes gets you.`
      : `Book a 15-minute call. We'll pressure-test the ${topLeakLabel} number first — ${topLeakFig}/year is where the money is.` }),
    el('p', { className: 'cta__value', html: '<strong>Free 15-minute audit call — worth £1000.</strong> Not a sales call. A paid-value audit given free.' }),
    el('div', { className: 'cta-panel__actions' }, [
      el('a', { className: 'btn btn--primary btn--lg', href: bookUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Book the audit call' }),
      el('button', { className: 'btn btn--ghost btn--lg', type: 'button', text: 'Retake assessment', onClick: () => window.dispatchEvent(new CustomEvent('ilm:restart')) }),
    ]),
  ]);
  root.append(cta);

  return root;
}

export function renderScanState() {
  return el('div', { className: 'scan-state fade-in', role: 'status', 'aria-live': 'polite' }, [
    el('div', { className: 'scan-pulse', 'aria-hidden': 'true' }),
    el('h3', { text: 'Scanning automation gaps…' }),
    el('p', { className: 'muted', text: 'Scoring maturity, modelling leakage, and building your workflow.' }),
  ]);
}
