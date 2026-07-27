/**
 * Full diagnostic report — ties scoring, leak, recommendations, workflow, roadmap,
 * plus industry insight packs, free-fix template, and narrative callouts.
 */

import { scoreAnswers } from './scoring.js';
import { calculateRevenueLeak, formatMoney } from './calculations.js';
import { recommendAutomations, buildRoadmap } from './engine.js';
import { buildWorkflow } from './workflow.js';
import { getIndustry } from './data/industries.js';
import {
  getInsightsFor,
  insightForAutomation,
  insightsForLeakCategory,
  reportLevelInsights,
} from './data/insights.js';
import { resolveNumericAnswers } from './data/questions.js';
import { pickFreeFix } from './data/free-fixes.js';

const LEAD_SOURCE_NARRATIVE = {
  referrals:
    'Your pipeline runs on referrals — which makes your missing referral system (leak category) your biggest untapped channel when it is under-built.',
  paid:
    "You're paying for every lead. Slow response on a paid lead is burning cash twice — once for the click, once for the lost deal.",
  outbound:
    "Outbound leads are expensive in time. Every one that goes cold is prospecting hours you don't get back.",
  inbound:
    'Inbound leads have intent. Letting them sit is the most expensive leak you have.',
  partners:
    'With leads coming from partners and boards, consistent follow-up is the first thing that breaks — and the first thing a system fixes.',
  mixed:
    'With leads coming from multiple sources, consistent follow-up is the first thing that breaks — and the first thing a system fixes.',
};

const WAND_LABELS = {
  leads: 'not enough quality leads',
  speed: 'slow response / missed enquiries',
  followup: 'inconsistent follow-up',
  conversion: "leads that don't convert",
  ops: 'ops / admin overload',
  retention: 'weak retention / referrals',
};

/**
 * @param {Record<string, unknown>} rawAnswers
 */
export function generateReport(rawAnswers) {
  const answers = resolveNumericAnswers(rawAnswers || {});
  const industry = getIndustry(answers.industry || 'general');
  const scoring = scoreAnswers(answers);
  const leak = calculateRevenueLeak(answers);
  const recommendations = recommendAutomations(answers, scoring, leak, 7);
  const roadmap = buildRoadmap(recommendations);
  const workflow = buildWorkflow(answers.industry || 'general', answers, recommendations);

  const ctx = { scoring, leak, recommendations };

  // Industry insights (vault research stats)
  const insights = getInsightsFor(industry.id, answers, ctx);
  const reportAlerts = reportLevelInsights(industry.id, answers, ctx);

  // Attach per-automation insight so UI can show the "why it matters" stat
  const enrichedRecommendations = recommendations.map((rec) => ({
    ...rec,
    insight: insightForAutomation(industry.id, rec.id, answers, ctx),
  }));

  // Attach per-leak-category insight stats + weekly framing
  const leakCategories = leak.categories.map((cat) => ({
    ...cat,
    insights: insightsForLeakCategory(industry.id, cat.id, answers, ctx),
  }));

  const topLeak = leakCategories[0] || null;
  const freeFix = pickFreeFix(industry.id, topLeak?.id);

  const topNames = recommendations.slice(0, 5).map((r) => r.name);
  const headline = buildHeadline(scoring, leak, recommendations.length);
  const narratives = buildNarratives(answers, leak, topLeak);

  return {
    generatedAt: new Date().toISOString(),
    industry,
    answers,
    scoring,
    leak: { ...leak, categories: leakCategories },
    recommendations: enrichedRecommendations,
    roadmap,
    workflow,
    headline,
    insights,
    reportAlerts,
    freeFix,
    narratives,
    topLeak,
    currency: leak.currency,
    locale: leak.locale,
    summary: {
      maturityScore: scoring.maturityScore,
      maturityBand: scoring.bandLabel,
      opportunityScore: scoring.opportunityScore,
      revenueLeakAnnual: leak.totalAnnualLeak,
      revenueLeakWeekly: leak.totalWeeklyLeak,
      recoverableAnnual: leak.recoverableAnnual,
      recoverableWeekly: leak.recoverableWeekly,
      hoursSavedPotential: leak.hoursSavedPotential,
      topAutomations: topNames,
      automationCount: recommendations.length,
      topLeakLabel: topLeak?.label || '',
      topLeakAnnual: topLeak?.annual || 0,
      wandFix: answers.wandFix || '',
      wandFixLabel: WAND_LABELS[answers.wandFix] || '',
    },
  };
}

function buildHeadline(scoring, leak, count) {
  const maturity = scoring.maturityScore;
  return {
    maturityLine: `Automation Maturity: ${maturity}/100 (${scoring.bandLabel})`,
    leakLine: `Estimated recoverable leakage: ${formatMoney(
      leak.recoverableAnnual,
      leak.currency,
      leak.locale
    )}/year`,
    opportunityLine: `We found ${count} high-impact automation opportunities`,
  };
}

function buildNarratives(answers, leak, topLeak) {
  const out = [];

  const sourceLine = LEAD_SOURCE_NARRATIVE[answers.leadSource];
  if (sourceLine) {
    out.push({
      id: 'lead-source',
      severity: 'info',
      title: 'Lead source reality check',
      body: sourceLine,
    });
  }

  if (answers.conversionRate === 'unsure') {
    out.push({
      id: 'conversion-unsure',
      severity: 'warning',
      title: 'Conversion rate is a blind spot',
      body: "You weren't sure of your lead-to-customer conversion rate. That's normal — and it's the first thing a proper system makes visible.",
    });
  }

  if (answers.wandFix) {
    const label = WAND_LABELS[answers.wandFix] || answers.wandFix;
    out.push({
      id: 'wand-fix',
      severity: 'info',
      title: 'What you’d fund first',
      body: `You said you’d wave a wand at ${label}. That’s the conversation starter on a discovery call — pain and budget rarely sit on the same row.`,
    });
  }

  if (topLeak) {
    out.push({
      id: 'top-leak-stake',
      severity: 'critical',
      title: 'Biggest leak on the table',
      body: `${topLeak.label} is your largest modelled gap at the moment.`,
    });
  }

  // Keep anchors available as structured narrative helpers
  return {
    callouts: out,
    anchors: leak.anchors || [],
  };
}

export { LEAD_SOURCE_NARRATIVE, WAND_LABELS };
