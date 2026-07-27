/**
 * Revenue leak + time-cost calculations.
 * Currency resolved from region answers.
 */

import { getIndustry } from './data/industries.js';
import { getRegion } from './data/insights.js';
import { resolveNumericAnswers } from './data/questions.js';

const WEEKS_PER_YEAR = 48; // working weeks after leave buffer
const CALENDAR_WEEKS = 52;

/** Resolve display currency from answers. */
export function currencyForAnswers(rawAnswers) {
  const region = getRegion((rawAnswers || {}).region || 'uk');
  return { currency: region.currency, locale: region.locale, region: region.id };
}

/**
 * @param {Record<string, unknown>} rawAnswers
 * @returns {object}
 */
export function calculateRevenueLeak(rawAnswers) {
  const a = resolveNumericAnswers(rawAnswers || {});
  const industry = getIndustry(a.industry || 'general');

  const monthlyLeads = pickNumber(a.monthlyLeadsNumeric, 20);
  const conversionRate = pickNumber(
    a.conversionRateNumeric,
    industry.defaultConversionRate
  );
  const avgDeal = pickNumber(a.avgDealNumeric, industry.defaultDealValue);
  const lostLeadsPct = pickNumber(a.lostLeadsPctNumeric, 0.35);
  const adminHours = pickNumber(a.adminHoursNumeric, 10);
  const hourlyWage = industry.hourlyWage;

  // Direct leak: leads that go cold × natural conversion × deal value
  const monthlyLostLeads = monthlyLeads * lostLeadsPct;
  const monthlyRevenueLeak = monthlyLostLeads * conversionRate * avgDeal;
  const annualRevenueLeak = monthlyRevenueLeak * 12;

  // Follow-up leakage multiplier when follow-up is weak
  const followupFactor = followupMultiplier(a.followup);
  const followupLeakMonthly = monthlyLeads * conversionRate * avgDeal * followupFactor * 0.15;
  const annualFollowupLeak = followupLeakMonthly * 12;

  // Response-time leakage (Harvard/InsideSales style: slow response kills conversion)
  const responseFactor = responseMultiplier(a.responseTime);
  const responseLeakMonthly = monthlyLeads * conversionRate * avgDeal * responseFactor * 0.12;
  const annualResponseLeak = responseLeakMonthly * 12;

  // Referral leakage — opportunity cost of no system
  const referralFactor = referralMultiplier(a.referrals);
  const annualReferralLeak = monthlyLeads * conversionRate * avgDeal * 12 * referralFactor * 0.08;

  // Admin labour cost
  const annualAdminCost = adminHours * hourlyWage * WEEKS_PER_YEAR;

  // Database reactivation potential
  const dbContacts = databaseSize(a.database);
  const reactivationRate = a.reactivation === 'systematic' ? 0 : 0.06;
  const annualReactivationValue =
    dbContacts * reactivationRate * conversionRate * avgDeal;

  const totalAnnualLeak = roundMoney(
    annualRevenueLeak +
      annualFollowupLeak +
      annualResponseLeak +
      annualReferralLeak +
      annualAdminCost
  );

  const estimatedAnnualRevenue = roundMoney(monthlyLeads * conversionRate * avgDeal * 12);

  const categories = [
    {
      id: 'lost-leads',
      label: 'Cold / unworked leads',
      annual: roundMoney(annualRevenueLeak),
    },
    {
      id: 'followup',
      label: 'Follow-up leakage',
      annual: roundMoney(annualFollowupLeak),
    },
    {
      id: 'response',
      label: 'Slow response leakage',
      annual: roundMoney(annualResponseLeak),
    },
    {
      id: 'referrals',
      label: 'Missing referral channel',
      annual: roundMoney(annualReferralLeak),
    },
    {
      id: 'admin',
      label: 'Repetitive admin labour',
      annual: roundMoney(annualAdminCost),
    },
  ]
    .map((cat) => ({
      ...cat,
      weekly: weeklyFromAnnual(cat.annual),
    }))
    .sort((x, y) => y.annual - x.annual);

  const recoverablePct = estimateRecoverable(a);
  const recoverableAnnual = roundMoney(totalAnnualLeak * recoverablePct);
  const anchors = buildAnchors({
    totalAnnualLeak,
    recoverableAnnual,
    avgDeal,
    estimatedAnnualRevenue,
    hourlyWage,
  });

  return {
    currency: currencyForAnswers(a).currency,
    locale: currencyForAnswers(a).locale,
    region: currencyForAnswers(a).region,
    monthlyLeads,
    conversionRate,
    avgDeal,
    lostLeadsPct,
    adminHours,
    hourlyWage,
    estimatedAnnualRevenue,
    monthlyLostLeads: round(monthlyLostLeads, 1),
    monthlyRevenueLeak: roundMoney(monthlyRevenueLeak),
    annualRevenueLeak: roundMoney(annualRevenueLeak),
    annualFollowupLeak: roundMoney(annualFollowupLeak),
    annualResponseLeak: roundMoney(annualResponseLeak),
    annualReferralLeak: roundMoney(annualReferralLeak),
    annualAdminCost: roundMoney(annualAdminCost),
    annualReactivationValue: roundMoney(annualReactivationValue),
    totalAnnualLeak,
    totalWeeklyLeak: weeklyFromAnnual(totalAnnualLeak),
    recoverableWeekly: weeklyFromAnnual(recoverableAnnual),
    recoverablePct,
    recoverableAnnual,
    categories,
    anchors,
    hoursSavedPotential: round(adminHours * 0.55 + 4, 1),
  };
}

/**
 * Real-world translations for stake, not just stats.
 * Pick the most dramatic 2–3 anchors by magnitude of the dramatic number.
 */
export function buildAnchors({
  totalAnnualLeak = 0,
  recoverableAnnual = 0,
  avgDeal = 0,
  estimatedAnnualRevenue = 0,
  hourlyWage = 35,
} = {}) {
  const total = Math.max(0, totalAnnualLeak || 0);
  const weekly = weeklyFromAnnual(total);
  const lostDeals = avgDeal > 0 ? Math.max(1, Math.round(total / avgDeal)) : 0;
  const hireCost = hourlyWage * WEEKS_PER_YEAR * 40;
  const hires = hireCost > 0 ? Math.max(0.1, round(total / hireCost, 1)) : 0;
  const revenuePct =
    estimatedAnnualRevenue > 0
      ? Math.max(1, Math.round((total / estimatedAnnualRevenue) * 100))
      : 0;

  const pool = [
    {
      id: 'weekly',
      magnitude: weekly,
      label: 'Weekly bleed',
      value: weekly,
      copy: (money) =>
        `${money(total)}/year — that's ${money(weekly)} walking out every week.`,
    },
    {
      id: 'hires',
      magnitude: hires * 1000,
      label: 'Hire equivalent',
      value: hires,
      copy: () =>
        hires >= 1
          ? `That's ${Math.round(hires)} full-time hire${Math.round(hires) === 1 ? '' : 's'} you could afford instead`
          : `That's about ${hires} of a full-time hire in annual cost`,
    },
    {
      id: 'deals',
      magnitude: lostDeals * (avgDeal || 1),
      label: 'Lost deals',
      value: lostDeals,
      copy: () =>
        avgDeal > 0
          ? `That's ${lostDeals} lost deal${lostDeals === 1 ? '' : 's'} at your average deal value`
          : 'Lost deal equivalent unavailable without an average deal size',
    },
    {
      id: 'revenue-pct',
      magnitude: revenuePct * 1000,
      label: '% of revenue',
      value: revenuePct,
      copy: () =>
        estimatedAnnualRevenue > 0
          ? `That's ${revenuePct}% of your estimated annual revenue`
          : 'Revenue share unavailable without enough volume inputs',
    },
    {
      id: 'recoverable-weekly',
      magnitude: weeklyFromAnnual(recoverableAnnual),
      label: 'Recoverable weekly',
      value: weeklyFromAnnual(recoverableAnnual),
      copy: (money) =>
        `${money(recoverableAnnual)} recoverable — roughly ${money(weeklyFromAnnual(recoverableAnnual))} every week if you close the gaps.`,
    },
  ].filter((a) => a.value > 0);

  // Always keep weekly; then pick top remaining by magnitude
  const weeklyAnchor = pool.find((a) => a.id === 'weekly');
  const others = pool
    .filter((a) => a.id !== 'weekly')
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 2);

  return [weeklyAnchor, ...others].filter(Boolean);
}

export function weeklyFromAnnual(n) {
  return roundMoney((n || 0) / CALENDAR_WEEKS);
}

function pickNumber(value, fallback) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function followupMultiplier(followup) {
  switch (followup) {
    case 'none':
      return 1;
    case 'manual':
      return 0.75;
    case 'partial':
      return 0.4;
    case 'sequences':
      return 0.1;
    default:
      return 0.5;
  }
}

function responseMultiplier(rt) {
  switch (rt) {
    case 'minutes':
      return 0.05;
    case 'hour':
      return 0.2;
    case 'same-day':
      return 0.55;
    case '1-2-days':
      return 0.85;
    case 'slower':
      return 1;
    default:
      return 0.5;
  }
}

function referralMultiplier(ref) {
  switch (ref) {
    case 'none':
      return 1;
    case 'ask':
      return 0.7;
    case 'incentive':
      return 0.35;
    case 'automated':
      return 0.05;
    default:
      return 0.5;
  }
}

function databaseSize(db) {
  switch (db) {
    case 'small':
      return 250;
    case 'medium':
      return 2000;
    case 'large':
      return 8000;
    default:
      return 0;
  }
}

function estimateRecoverable(a) {
  // Conservative: 35–55% of leak is recoverable with automation in 90 days
  let base = 0.4;
  if (a.followup === 'none' || a.followup === 'manual') base += 0.08;
  if (a.crm === 'none' || a.crm === 'spreadsheet') base += 0.05;
  if (a.responseTime === 'slower' || a.responseTime === '1-2-days') base += 0.04;
  return Math.min(0.55, round(base, 2));
}

function round(n, d = 0) {
  const m = 10 ** d;
  return Math.round(n * m) / m;
}

function roundMoney(n) {
  return Math.round(n);
}

/**
 * Format money for display in the prospect's currency.
 * @param {number} n
 * @param {string} currency  ISO 4217, e.g. 'GBP' | 'EUR' | 'NZD'
 * @param {string} [locale]
 */
export function formatMoney(n, currency = 'GBP', locale) {
  const loc = locale || (currency === 'EUR' ? 'en-IE' : currency === 'NZD' ? 'en-NZ' : 'en-GB');
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `${Math.round(n || 0).toLocaleString('en-GB')} ${currency}`;
  }
}
