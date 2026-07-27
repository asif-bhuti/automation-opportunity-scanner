/**
 * Decision engine — maps answers + score to ranked automation opportunities.
 */

import { AUTOMATIONS } from './data/automations.js';
import { getIndustry } from './data/industries.js';
import { resolveNumericAnswers } from './data/questions.js';

/**
 * Build boolean trigger flags from answers.
 * @param {Record<string, unknown>} a
 */
export function buildTriggers(a) {
  const admin = a.adminHoursNumeric;
  const leads = a.monthlyLeadsNumeric;
  const nurture = a.nurtureChannels;
  return {
    noCrm: a.crm === 'none',
    spreadsheetCrm: a.crm === 'spreadsheet',
    manualFollowup: a.followup === 'none' || a.followup === 'manual',
    slowResponse:
      a.responseTime === 'same-day' ||
      a.responseTime === '1-2-days' ||
      a.responseTime === 'slower',
    noReviews: a.reviews === 'never' || a.reviews === 'ad-hoc',
    weakWebsite: a.website === 'none' || a.website === 'brochure' || a.website === 'forms',
    highLeadVolume: typeof leads === 'number' && leads >= 50,
    // Nurture maps onto legacy SMS / email trigger names so automation library stays stable
    noSms: nurture === 'no',
    usesEmail: nurture === 'tool' || nurture === 'automated' || nurture === 'ad-hoc',
    weakNurture: nurture === 'no' || nurture === 'ad-hoc',
    manualProposals:
      a.proposals === 'manual-docs' ||
      a.proposals === 'templates' ||
      a.proposals === 'none',
    noProposalFollowup: a.proposals !== 'tracked',
    hasAppointments: a.appointments && a.appointments !== 'none',
    manualAdmin: a.appointments === 'manual' || a.followup === 'manual',
    highAdminHours: typeof admin === 'number' && admin >= 22,
    hasDatabase: a.database === 'small' || a.database === 'medium' || a.database === 'large',
    noReactivation: a.reactivation === 'never' || a.reactivation === 'rare',
    noReferrals: a.referrals === 'none' || a.referrals === 'ask',
  };
}

/**
 * @param {Record<string, unknown>} rawAnswers
 * @param {{ opportunityScore?: number, maturityScore?: number }} scoring
 * @param {{ totalAnnualLeak?: number, recoverableAnnual?: number, avgDeal?: number, monthlyLeads?: number, conversionRate?: number, hoursSavedPotential?: number }} leak
 * @param {number} [limit=7]
 */
export function recommendAutomations(rawAnswers, scoring = {}, leak = {}, limit = 7) {
  const answers = resolveNumericAnswers(rawAnswers || {});
  const industryId = answers.industry || 'general';
  const industry = getIndustry(industryId);
  const triggers = buildTriggers(answers);

  const candidates = [];

  for (const auto of Object.values(AUTOMATIONS)) {
    if (!industryAllows(auto, industryId)) continue;

    const matchedTriggers = Object.entries(auto.triggers || {})
      .filter(([, needed]) => needed)
      .filter(([flag]) => triggers[flag]);

    // Prefer triggered automations; always allow industry defaults if score high opportunity
    const isIndustryDefault = (industry.modules || []).includes(auto.id);
    if (matchedTriggers.length === 0 && !isIndustryDefault) continue;

    const triggerBoost = matchedTriggers.length * 8;
    const industryBoost = isIndustryDefault ? 6 : 0;
    // wandFix is buying intent — stronger boost than pain-only bottleneck
    const bottleneckBoost = bottleneckBoostFor(auto, answers.bottleneck);
    const wandBoost = bottleneckBoostFor(auto, answers.wandFix) * 1.2;
    const priorityScore =
      auto.priorityWeight + triggerBoost + industryBoost + bottleneckBoost + wandBoost;

    const estimatedAnnualValue = estimateValue(auto, leak, answers);
    const hoursSaved = auto.hoursSavedPerWeek;
    const roiMultiple =
      estimatedAnnualValue > 0
        ? estimatedAnnualValue / estimateImplementationCost(auto)
        : 0;

    candidates.push({
      ...auto,
      matchedTriggers: matchedTriggers.map(([k]) => k),
      priorityScore,
      estimatedAnnualValue,
      hoursSavedPerWeek: hoursSaved,
      roiMultiple: Math.round(roiMultiple * 10) / 10,
      difficultyLabel: difficultyLabel(auto.difficulty),
      timelineLabel: `${auto.timelineDays} days`,
    });
  }

  candidates.sort((a, b) => b.priorityScore - a.priorityScore);

  // De-dupe by category preference slightly — keep top N unique ids
  const seen = new Set();
  const top = [];
  for (const c of candidates) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    top.push(c);
    if (top.length >= limit) break;
  }

  // Assign implementation priority 1..n
  return top.map((item, index) => ({
    ...item,
    rank: index + 1,
    priority:
      index === 0 ? 'P0 — Do first' : index < 3 ? 'P1 — This quarter' : 'P2 — 90-day roadmap',
  }));
}

function industryAllows(auto, industryId) {
  const list = auto.industries || ['*'];
  return list.includes('*') || list.includes(industryId);
}

function bottleneckBoostFor(auto, bottleneck) {
  if (!bottleneck) return 0;
  const map = {
    leads: ['lead-capture', 'outbound', 'ats-reactivation', 'abandoned-quote-followup'],
    speed: ['missed-call-recovery', 'followup-automation', 'quote-reminders'],
    followup: ['followup-automation', 'proposal-followup', 'client-followup', 'candidate-nurture', 'counter-offer-shield', 'battery-upsell-automation'],
    conversion: ['proposal-followup', 'quote-reminders', 'crm-pipeline', 'lead-capture', 'survey-qualification', 'battery-upsell-automation'],
    ops: ['reporting-automation', 'client-onboarding', 'crm-pipeline', 'interview-reminders', 'seai-grant-automation', 'contract-compliance-pack', 'scope-creep-guard'],
    retention: ['review-automation', 'referral-requests', 'upsell-sequences', 'referral-campaigns', 'churn-early-warning', 'maintenance-reminders'],
  };
  const ids = map[bottleneck] || [];
  return ids.includes(auto.id) ? 10 : 0;
}

function estimateValue(auto, leak, answers) {
  const recoverable = leak.recoverableAnnual || leak.totalAnnualLeak || 0;
  const fromLift =
    (leak.monthlyLeads || answers.monthlyLeadsNumeric || 20) *
    (leak.conversionRate || answers.conversionRateNumeric || 0.15) *
    (leak.avgDeal || answers.avgDealNumeric || 1500) *
    12 *
    (auto.revenueLiftPct || 0);

  const fromHours =
    (auto.hoursSavedPerWeek || 0) *
    (getIndustry(answers.industry || 'general').hourlyWage) *
    48;

  // Blend lift with share of recoverable leak
  const share = Math.min(0.35, 0.12 + (auto.priorityWeight || 50) / 500);
  const fromLeak = recoverable * share;

  return Math.round(Math.max(fromLift + fromHours * 0.5, fromLeak));
}

function estimateImplementationCost(auto) {
  // Rough setup cost proxy for ROI multiple display only
  const base = { low: 1500, medium: 3000, high: 6000 };
  return base[auto.difficulty] || 2500;
}

function difficultyLabel(d) {
  switch (d) {
    case 'low':
      return 'Low — days not weeks';
    case 'medium':
      return 'Medium — 2–4 weeks';
    case 'high':
      return 'High — specialist build';
    default:
      return d || 'Medium';
  }
}

/**
 * 90-day roadmap buckets from ranked automations.
 */
export function buildRoadmap(recommendations) {
  const list = recommendations || [];
  return {
    days0to30: list.filter((_, i) => i < 2).map((item) => roadmapItem(item, 'Foundation', 'Install the first revenue-control system', 'Days 0–30')),
    days31to60: list.filter((_, i) => i >= 2 && i < 4).map((item) => roadmapItem(item, 'Momentum', 'Connect the next workflow and remove manual handoffs', 'Days 31–60')),
    days61to90: list.filter((_, i) => i >= 4 && i < 7).map((item) => roadmapItem(item, 'Compound', 'Measure, optimise, and expand what is working', 'Days 61–90')),
  };
}

function roadmapItem(a, phase, objective, timelineLabel) {
  return {
    id: a.id,
    name: a.name,
    phase,
    objective,
    timelineLabel,
    timelineDays: a.timelineDays,
    difficulty: a.difficulty,
    estimatedAnnualValue: a.estimatedAnnualValue,
  };
}
