/**
 * Automation Maturity scoring (0–100).
 * Higher score = more mature (fewer gaps). Opportunity score = 100 - maturity.
 */

import { resolveNumericAnswers } from './data/questions.js';

/** Weight contributions that add OPPORTUNITY points (gaps). */
const GAP_RULES = [
  {
    id: 'no-crm',
    points: 18,
    test: (a) => a.crm === 'none',
  },
  {
    id: 'spreadsheet-crm',
    points: 12,
    test: (a) => a.crm === 'spreadsheet',
  },
  {
    id: 'basic-crm-only',
    points: 6,
    test: (a) => a.crm === 'basic',
  },
  {
    id: 'manual-followup',
    points: 15,
    test: (a) => a.followup === 'none' || a.followup === 'manual',
  },
  {
    id: 'partial-followup',
    points: 7,
    test: (a) => a.followup === 'partial',
  },
  {
    id: 'no-reviews',
    points: 10,
    test: (a) => a.reviews === 'never' || a.reviews === 'ad-hoc',
  },
  {
    id: 'slow-response',
    points: 12,
    test: (a) =>
      a.responseTime === '1-2-days' ||
      a.responseTime === 'slower' ||
      a.responseTime === 'same-day',
  },
  {
    id: 'weak-website',
    points: 8,
    test: (a) => a.website === 'none' || a.website === 'brochure',
  },
  {
    id: 'no-nurture',
    points: 8,
    test: (a) => a.nurtureChannels === 'no',
  },
  {
    id: 'weak-nurture',
    points: 5,
    test: (a) => a.nurtureChannels === 'ad-hoc',
  },
  {
    id: 'manual-nurture-tool',
    points: 3,
    test: (a) => a.nurtureChannels === 'tool',
  },
  {
    id: 'manual-proposals',
    points: 8,
    test: (a) => a.proposals === 'manual-docs' || a.proposals === 'templates',
  },
  {
    id: 'no-proposal-system',
    points: 4,
    test: (a) => a.proposals === 'none',
  },
  {
    id: 'manual-appointments',
    points: 6,
    test: (a) => a.appointments === 'manual' || a.appointments === 'link',
  },
  {
    id: 'high-admin',
    points: 10,
    test: (a) => {
      const h = a.adminHoursNumeric;
      return typeof h === 'number' && h >= 22;
    },
  },
  {
    id: 'lost-leads',
    points: 12,
    test: (a) => {
      const p = a.lostLeadsPctNumeric;
      return typeof p === 'number' && p >= 0.33;
    },
  },
  {
    id: 'no-reactivation',
    points: 9,
    test: (a) =>
      (a.database === 'medium' || a.database === 'large' || a.database === 'small') &&
      (a.reactivation === 'never' || a.reactivation === 'rare'),
  },
  {
    id: 'no-referrals',
    points: 7,
    test: (a) => a.referrals === 'none' || a.referrals === 'ask',
  },
];

const MAX_RAW = GAP_RULES.reduce((s, r) => s + r.points, 0);

/**
 * @param {Record<string, unknown>} rawAnswers
 * @returns {{
 *   maturityScore: number,
 *   opportunityScore: number,
 *   band: string,
 *   bandLabel: string,
 *   gaps: Array<{id: string, points: number}>,
 *   maxRaw: number,
 *   rawOpportunity: number
 * }}
 */
export function scoreAnswers(rawAnswers) {
  const answers = resolveNumericAnswers(rawAnswers || {});
  const gaps = [];
  let rawOpportunity = 0;

  for (const rule of GAP_RULES) {
    if (rule.test(answers)) {
      gaps.push({ id: rule.id, points: rule.points });
      rawOpportunity += rule.points;
    }
  }

  // Normalize opportunity to 0–100, maturity = inverse.
  const opportunityScore = Math.min(
    100,
    Math.round((rawOpportunity / MAX_RAW) * 100)
  );
  const maturityScore = Math.max(0, 100 - opportunityScore);
  const band = maturityBand(maturityScore);

  return {
    maturityScore,
    opportunityScore,
    band: band.id,
    bandLabel: band.label,
    gaps,
    maxRaw: MAX_RAW,
    rawOpportunity,
  };
}

export function maturityBand(score) {
  if (score >= 75) return { id: 'advanced', label: 'Advanced' };
  if (score >= 55) return { id: 'developing', label: 'Developing' };
  if (score >= 35) return { id: 'emerging', label: 'Emerging' };
  return { id: 'manual', label: 'Mostly Manual' };
}

/** Exported for tests */
export const __GAP_RULES = GAP_RULES;
export const __MAX_RAW = MAX_RAW;
