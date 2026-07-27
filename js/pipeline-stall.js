/* Hallmark · module: pipeline-stall · PRD v3 §2.3
 * Pipeline-stall visualizer — animated token-flow diagram.
 *
 * Maps the prospect's answers to a 5-stage pipeline per industry, computes
 * per-stage throughput (0.05–1.0), finds the bottleneck stage, and animates
 * token divs flowing left→right. Tokens pile up at the bottleneck and
 * downstream stages starve. Runs ~8s then freezes. Reduced-motion shows a
 * static state diagram instead.
 *
 * Uses v1's internal answer option values (same-day, manual-docs, etc.).
 */

import { formatMoney } from './calculations.js';

/** Per-industry 5-stage pipelines. throughput:null = computed from answers. */
export const PIPELINES = {
  solar: [
    { id: 'lead-in',  label: 'Lead In',        throughput: 1.0 },
    { id: 'qualify',  label: 'Qualify',        throughput: null },
    { id: 'quote',    label: 'Quote',          throughput: null },
    { id: 'install',  label: 'Install',        throughput: null },
    { id: 'lifecycle', label: 'Lifecycle',     throughput: 1.0 },
  ],
  recruitment: [
    { id: 'intake',   label: 'Intake',         throughput: 1.0 },
    { id: 'screen',   label: 'Screen',         throughput: null },
    { id: 'submit',   label: 'Submit',         throughput: null },
    { id: 'place',    label: 'Place',          throughput: null },
    { id: 'lifecycle', label: 'Lifecycle',     throughput: 1.0 },
  ],
  marketing: [
    { id: 'intake',   label: 'Intake',         throughput: 1.0 },
    { id: 'strategy', label: 'Strategy',      throughput: null },
    { id: 'produce',  label: 'Produce',        throughput: null },
    { id: 'report',   label: 'Report',        throughput: null },
    { id: 'renew',    label: 'Renew/Referral', throughput: 1.0 },
  ],
  general: [
    { id: 'lead-in',  label: 'Lead In',        throughput: 1.0 },
    { id: 'qualify',  label: 'Qualify',        throughput: null },
    { id: 'propose',  label: 'Propose',        throughput: null },
    { id: 'deliver',  label: 'Deliver',        throughput: null },
    { id: 'follow-up', label: 'Follow-up',     throughput: 1.0 },
  ],
};

const RESPONSE_MAP = { minutes: 0.95, hour: 0.85, 'same-day': 0.55, '1-2-days': 0.30, slower: 0.15 };
const PROPOSAL_MAP = { tracked: 0.95, templates: 0.80, 'manual-docs': 0.65, none: 0.35 };
const FOLLOWUP_MAP = { sequences: 0.95, partial: 0.80, manual: 0.50, none: 0.20 };
const REFERRAL_MAP = { automated: 0.95, incentive: 0.80, ask: 0.50, none: 0.25 };

/**
 * Compute per-stage throughput (0.05–1.0) from answers.
 * @param {Record<string, unknown>} rawAnswers
 * @param {string} industryId
 * @returns {{ stages: Array, throughput: Record<string, number>, bottleneck: object }}
 */
export function computeStageThroughput(rawAnswers, industryId) {
  const answers = rawAnswers || {};
  const stages = PIPELINES[industryId] || PIPELINES.general;
  const throughput = {};
  const highAdmin = typeof answers.adminHoursNumeric === 'number' && answers.adminHoursNumeric >= 22;

  for (const stage of stages) {
    if (stage.throughput !== null) {
      throughput[stage.id] = stage.throughput;
      continue;
    }

    let rate = 1.0;

    // Slow response kills the qualify/screen/strategy stage
    if (['qualify', 'screen', 'strategy'].includes(stage.id)) {
      rate *= RESPONSE_MAP[answers.responseTime] ?? 0.5;
    }

    // Manual proposals slow the quote/propose/submit/produce stage
    if (['quote', 'propose', 'submit', 'produce'].includes(stage.id)) {
      rate *= PROPOSAL_MAP[answers.proposals] ?? 0.5;
    }

    // Manual follow-up kills the install/deliver/place/report stage
    if (['install', 'place', 'deliver', 'report'].includes(stage.id)) {
      rate *= FOLLOWUP_MAP[answers.followup] ?? 0.5;
    }

    // No referrals/reviews kills the final stage
    if (['lifecycle', 'follow-up', 'renew'].includes(stage.id)) {
      // Terminal stages have throughput 1.0 baseline, but if we override them:
      if (stage.throughput === null) {
        rate *= REFERRAL_MAP[answers.referrals] ?? 0.5;
      }
    }

    // High admin reduces all internal stages
    if (highAdmin) rate *= 0.85;

    throughput[stage.id] = Math.max(0.05, Math.min(1.0, rate));
  }

  return {
    stages,
    throughput,
    bottleneck: findBottleneck(throughput, stages),
  };
}

/**
 * Find the bottleneck (lowest-throughput internal stage).
 * @param {Record<string, number>} throughput
 * @param {Array} stages
 * @returns {{ stage: object, rate: number }}
 */
export function findBottleneck(throughput, stages) {
  const internal = stages.filter((s) => s.throughput === null);
  if (internal.length === 0) return { stage: stages[0], rate: 1.0 };
  let worst = internal[0];
  let worstRate = 1.0;
  for (const stage of internal) {
    const r = throughput[stage.id];
    if (r < worstRate) {
      worstRate = r;
      worst = stage;
    }
  }
  return { stage: worst, rate: worstRate };
}

/**
 * Compute the deterministic diagnostic callout for the bottleneck.
 * Pile-up value = monthlyLeads × avgDeal × (1 − throughput) annualised.
 * @param {object} report  v1 report object (for money/leak data)
 * @param {object} pipelineResult  from computeStageThroughput
 * @returns {{ stageLabel: string, leakedPerMonth: number, valuePerMonth: number, callout: string }}
 */
export function bottleneckCallout(report, pipelineResult) {
  const { stage, rate } = pipelineResult.bottleneck;
  const monthlyLeads = report.leak.monthlyLeads || 0;
  const avgDeal = report.leak.avgDeal || 0;
  const leakedPerMonth = Math.round(monthlyLeads * (1 - rate));
  const valuePerMonth = Math.round(leakedPerMonth * avgDeal);
  const money = (n) => formatMoney(n, report.currency, report.locale);

  const callout = `Your pipeline stalls at ${stage.label}. ` +
    `${leakedPerMonth} leads pile up here every month. ` +
    `${money(valuePerMonth * 12)}/yr waits in this queue. ` +
    `Fix this stage first.`;

  return {
    stageLabel: stage.label,
    stageId: stage.id,
    leakedPerMonth,
    valuePerMonth,
    annualValueWaiting: valuePerMonth * 12,
    callout,
  };
}

/* ── DOM rendering (browser only) ── */

/** Check prefers-reduced-motion safely. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Build the pipeline DOM block — a clean vertical bar chart.
 * Each stage gets a bar whose height represents throughput (5%–100%).
 * The bottleneck bar is highlighted. Downstream stages are dimmed.
 * @param {object} pipelineResult  from computeStageThroughput
 * @param {object} callout  from bottleneckCallout
 * @returns {Element}
 */
export function renderPipelineStatic(pipelineResult, callout) {
  const { stages, throughput, bottleneck } = pipelineResult;
  const bnIdx = stages.findIndex((s) => s.id === bottleneck.stage.id);

  const wrap = document.createElement('div');
  wrap.className = 'pipeline';
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', `Pipeline diagram: bottleneck at ${callout.stageLabel}`);

  const grid = document.createElement('div');
  grid.className = 'pipeline-grid';

  stages.forEach((stage, idx) => {
    const rate = throughput[stage.id];
    const isBottleneck = stage.id === bottleneck.stage.id;
    const isDownstream = idx > bnIdx && stage.throughput === null;
    const isTerminal = stage.throughput === 1.0;

    const cell = document.createElement('div');
    cell.className = `pipeline-cell${isBottleneck ? ' is-bottleneck' : ''}${isDownstream ? ' is-starving' : ''}${isTerminal ? ' is-terminal' : ''}`;

    // Bar — height proportional to throughput
    const barWrap = document.createElement('div');
    barWrap.className = 'pipeline-bar-wrap';

    const bar = document.createElement('div');
    bar.className = `pipeline-bar${isBottleneck ? ' bar-bottleneck' : isTerminal ? ' bar-terminal' : ''}`;
    bar.style.height = `${Math.max(6, Math.round(rate * 100))}%`;
    barWrap.append(bar);

    cell.append(barWrap);

    const meta = document.createElement('div');
    meta.className = 'pipeline-cell-meta';

    const pct = document.createElement('span');
    pct.className = 'pipeline-cell-pct';
    pct.textContent = `${Math.round(rate * 100)}%`;
    meta.append(pct);

    const label = document.createElement('span');
    label.className = 'pipeline-cell-label';
    label.textContent = stage.label;
    meta.append(label);

    if (isBottleneck) {
      const flag = document.createElement('span');
      flag.className = 'pipeline-cell-flag';
      flag.textContent = '▼ Bottleneck';
      meta.append(flag);
    }

    cell.append(meta);
    grid.append(cell);
  });

  wrap.append(grid);

  const diag = document.createElement('p');
  diag.className = 'pipeline-callout';
  diag.textContent = callout.callout;
  wrap.append(diag);

  return wrap;
}

/**
 * Token animation controller. Spawns tokens at stage 1, moves right,
 * queues them at the bottleneck, leaks tokens queued too long.
 * Freezes after `freezeMs` (default 8000ms).
 */
export class PipelineAnimation {
  constructor(containerEl, stages, throughput, bottleneck, { freezeMs = 8000 } = {}) {
    this.container = containerEl;
    this.stages = stages;
    this.throughput = throughput;
    this.bottleneck = bottleneck;
    this.freezeMs = freezeMs;
    this.tokens = [];
    this.maxTokens = 60;
    this.spawnRate = 800;
    this.lastSpawn = 0;
    this.startTime = 0;
    this.running = false;
    this.rafId = null;
  }

  start() {
    if (this.running || prefersReducedMotion()) return;
    this.running = true;
    this.startTime = performance.now();
    this.animate(this.startTime);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  animate(ts) {
    if (!this.running) return;
    if (ts - this.startTime > this.freezeMs) {
      this.stop();
      this.freeze();
      return;
    }
    if (ts - this.lastSpawn > this.spawnRate && this.tokens.length < this.maxTokens) {
      this.spawnToken();
      this.lastSpawn = ts;
    }
    for (const t of this.tokens) this.updateToken(t);
    this.tokens = this.tokens.filter((t) => !t.exited);
    this.render();
    this.rafId = requestAnimationFrame((t) => this.animate(t));
  }

  spawnToken() {
    const el = document.createElement('div');
    el.className = 'pipeline-token';
    this.container.appendChild(el);
    this.tokens.push({
      el,
      x: 0,
      stage: 0,
      speed: 0.15,
      state: 'flowing',
      queueTime: 0,
      exited: false,
    });
  }

  updateToken(token) {
    if (token.exited) return;
    const stageIdx = Math.min(Math.floor(token.x / (100 / this.stages.length)), this.stages.length - 1);
    const stage = this.stages[stageIdx];
    const rate = this.throughput[stage.id];

    if (stage.throughput === null && Math.random() > rate) {
      token.state = 'queued';
      token.queueTime++;
      if (token.queueTime > 60) {
        token.exited = true;
        token.el.classList.add('token-leaked');
      }
    } else {
      token.state = 'flowing';
      token.x += token.speed;
      token.queueTime = 0;
    }
    if (stage.id === this.bottleneck.stage.id) {
      token.el.classList.toggle('at-bottleneck', token.state === 'queued');
    }
    if (token.x >= 100) token.exited = true;
  }

  render() {
    for (const t of this.tokens) {
      t.el.style.left = `${Math.min(99, t.x)}%`;
      t.el.classList.toggle('queued', t.state === 'queued');
    }
  }

  /** Freeze on final state — remove flowing tokens, keep queued pile-up. */
  freeze() {
    for (const t of this.tokens) {
      if (t.state === 'flowing') {
        t.el.classList.add('token-frozen');
      }
    }
  }
}

/**
 * Full mount: compute throughput, build static DOM, attach animation.
 * @param {Record<string, unknown>} answers
 * @param {string} industryId
 * @param {object} report
 * @returns {Element|null}  null if browser unavailable
 */
export function mountPipeline(answers, industryId, report) {
  if (typeof document === 'undefined') return null;
  const pipelineResult = computeStageThroughput(answers, industryId);
  const callout = bottleneckCallout(report, pipelineResult);
  return renderPipelineStatic(pipelineResult, callout);
}
