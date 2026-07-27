/* Hallmark · module: whatif · PRD v3 §2.2
 * New Game+ what-if re-calculation.
 *
 * Clones the answers, applies fixes for the chosen gap IDs, re-runs the full
 * engine, and diffs the original report vs the fixed report. Progressive
 * disclosure: fix #1, then #1+#2, then #1+#2+#3.
 *
 * GAP_FIXES is aligned to v1's real gap IDs (scoring.js __GAP_RULES) and
 * fixes answer fields to v1's internal option values (not the PRD's URL vocab).
 */

import { generateReport } from './report.js';
import { __GAP_RULES } from './scoring.js';

/**
 * Map each v1 gap ID → the answer field that changes when it's fixed,
 * the v1 option value that represents the "fixed" state, and a label.
 */
export const GAP_FIXES = {
  'no-crm':           { field: 'crm',            fixedValue: 'basic',   label: 'Add a CRM' },
  'spreadsheet-crm':  { field: 'crm',            fixedValue: 'full',    label: 'Upgrade from spreadsheet to a real CRM' },
  'basic-crm-only':   { field: 'crm',            fixedValue: 'full',    label: 'Upgrade to a full-pipeline CRM' },
  'manual-followup':  { field: 'followup',       fixedValue: 'sequences', label: 'Automated follow-up sequences' },
  'partial-followup': { field: 'followup',      fixedValue: 'sequences', label: 'Full multi-touch follow-up sequences' },
  'no-reviews':       { field: 'reviews',        fixedValue: 'automated', label: 'Automated review collection' },
  'slow-response':    { field: 'responseTime',   fixedValue: 'minutes',  label: 'Sub-5-minute lead response' },
  'weak-website':     { field: 'website',        fixedValue: 'strong',   label: 'Conversion-optimised website' },
  'no-nurture':       { field: 'nurtureChannels', fixedValue: 'automated', label: 'Automated nurture across SMS + email' },
  'weak-nurture':     { field: 'nurtureChannels', fixedValue: 'automated', label: 'Automated nurture sequences' },
  'manual-nurture-tool': { field: 'nurtureChannels', fixedValue: 'automated', label: 'Fully automated nurture' },
  'manual-proposals': { field: 'proposals',      fixedValue: 'tracked',   label: 'Tracked proposals with automated follow-up' },
  'no-proposal-system': { field: 'proposals',   fixedValue: 'templates', label: 'Templated proposal generation' },
  'manual-appointments': { field: 'appointments', fixedValue: 'full',     label: 'Booking + reminders + no-show handling' },
  'high-admin':       { field: 'adminHours',     fixedValue: '6-15',      label: 'Automated admin (halved manual hours)' },
  'lost-leads':       { field: 'lostLeadsPct',   fixedValue: '10-25',     label: 'Stop leads going cold (halve the loss)' },
  'no-reactivation':  { field: 'reactivation',   fixedValue: 'systematic', label: 'Automated database reactivation' },
  'no-referrals':     { field: 'referrals',      fixedValue: 'automated', label: 'Automated referral system' },
};

/**
 * Run the engine on a fixed copy of answers and diff against the original report.
 * @param {Record<string, unknown>} answers  original answers
 * @param {object} report  original report (from generateReport)
 * @param {string[]} gapIds  gap IDs to fix
 * @returns {object} delta
 */
export function runWhatIf(answers, report, gapIds) {
  const fixedAnswers = { ...answers };

  const applied = [];
  const missing = [];
  for (const gapId of gapIds) {
    const fix = GAP_FIXES[gapId];
    if (fix) {
      fixedAnswers[fix.field] = fix.fixedValue;
      applied.push(gapId);
    } else {
      missing.push(gapId);
    }
  }

  const fixedReport = generateReport(fixedAnswers);

  const leakReduction = Math.max(0, report.leak.totalAnnualLeak - fixedReport.leak.totalAnnualLeak);
  const leakReductionPct = report.leak.totalAnnualLeak > 0
    ? Math.round((leakReduction / report.leak.totalAnnualLeak) * 100)
    : 0;
  const maturityGain = fixedReport.scoring.maturityScore - report.scoring.maturityScore;
  const hoursRecovered = Math.max(0, (report.leak.hoursSavedPotential || 0) - (fixedReport.leak.hoursSavedPotential || 0));
  const recoverableGain = Math.max(0, (report.leak.recoverableAnnual || 0) - (fixedReport.leak.recoverableAnnual || 0));

  return {
    leakReduction,
    leakReductionPct,
    maturityGain,
    hoursRecovered,
    recoverableGain,
    newLeakTotal: fixedReport.leak.totalAnnualLeak,
    newMaturityScore: fixedReport.scoring.maturityScore,
    newBand: fixedReport.scoring.bandLabel,
    newRecoverable: fixedReport.leak.recoverableAnnual,
    currency: report.currency,
    locale: report.locale,
    fixLabels: applied.map((id) => GAP_FIXES[id]?.label || id),
    applied,
    missing,
    fixedAnswers,
  };
}

/**
 * Progressive what-if: fix #1, then #1+#2, then #1+#2+#3.
 * Uses the report's gaps (sorted by points desc) to pick the top N.
 * @param {Record<string, unknown>} answers
 * @param {object} report
 * @param {number} [maxStages=3]
 * @returns {Array<object>}
 */
export function progressiveWhatIf(answers, report, maxStages = 3) {
  // report.scoring.gaps is sorted by id insertion, not points. Sort by points desc.
  const gaps = [...(report.scoring.gaps || [])].sort((a, b) => b.points - a.points);
  const top = gaps.slice(0, maxStages);

  const stages = [];
  for (let i = 1; i <= top.length; i++) {
    const gapIds = top.slice(0, i).map((g) => g.id);
    const label = i === 1
      ? `Fix #1: ${GAP_FIXES[gapIds[0]]?.label || gapIds[0]}`
      : `Fix #1–${i}`;
    stages.push({
      stage: i,
      label,
      gapIds,
      ...runWhatIf(answers, report, gapIds),
    });
  }
  return stages;
}

/**
 * The fully-optimised stage: fix all detected gaps.
 * @param {Record<string, unknown>} answers
 * @param {object} report
 */
export function fullyOptimized(answers, report) {
  const gapIds = (report.scoring.gaps || []).map((g) => g.id);
  if (gapIds.length === 0) return null;
  return runWhatIf(answers, report, gapIds);
}

/** List of gap IDs the engine actually recognises (for diagnostics). */
export const KNOWN_GAP_IDS = Object.keys(GAP_FIXES);
