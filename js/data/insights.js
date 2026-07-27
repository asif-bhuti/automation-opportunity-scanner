/**
 * Industry insight packs — vault research surfaced as stat callouts.
 * Each insight can attach to a leak category, an automation, or fire
 * standalone (margin-collapse, franchise dynamics). `when(answers, ctx)`
 * gates visibility. Stat lines use {value} tokens resolved at render.
 */

export const REGIONS = {
  ie: { id: 'ie', label: 'Ireland', currency: 'EUR', locale: 'en-IE', symbol: '€' },
  nz: { id: 'nz', label: 'New Zealand', currency: 'NZD', locale: 'en-NZ', symbol: '$' },
  uk: { id: 'uk', label: 'United Kingdom', currency: 'GBP', locale: 'en-GB', symbol: '£' },
  other: { id: 'other', label: 'Other', currency: 'GBP', locale: 'en-GB', symbol: '£' },
};

export function getRegion(id) {
  return REGIONS[id] || REGIONS.uk;
}

/** Ensure numeric helper fields exist even when callers pass raw answers. */
import { resolveNumericAnswers } from './questions.js';
function resolve(a) {
  return a && a.monthlyLeadsNumeric === undefined ? resolveNumericAnswers(a) : a || {};
}

/**
 * Insight shape:
 *  id, industry, attachTo: 'leak:lost-leads' | 'automation:<id>' | 'report',
 *  title, stat, body, severity: 'info' | 'warning' | 'critical',
 *  when(answers, ctx) → boolean   (ctx = { scoring, leak, recommendations })
 */
export const INSIGHTS = [
  // ---------------- SOLAR ----------------
  {
    id: 'solar-speed-400',
    industry: 'solar',
    attachTo: 'leak:response',
    severity: 'critical',
    title: 'The 5-minute window',
    stat: '−400%',
    body: 'Contact rates drop 400% if a solar lead isn’t called within 5 minutes. 70% of inbound solar leads go cold without an instant callback.',
    when: (a) =>
      a.responseTime === 'same-day' || a.responseTime === '1-2-days' || a.responseTime === 'slower',
  },
  {
    id: 'solar-quote-abandonment',
    industry: 'solar',
    attachTo: 'automation:abandoned-quote-followup',
    severity: 'critical',
    title: 'Abandoned quote bleed',
    stat: '40%',
    body: '40% of proposals sent go cold. Across the industry that’s roughly €20k/month of lost pipeline for a mid-size installer.',
    when: () => true,
  },
  {
    id: 'solar-seai-grant',
    industry: 'solar',
    attachTo: 'automation:seai-grant-automation',
    severity: 'warning',
    title: 'SEAI grant paralysis (IE)',
    stat: '€1.8–2.4k',
    body: 'One typo in the MPRN and the SEAI grant sits unpaid for 6 weeks — €1,800–2,400 per failure, ~5% of pipeline. NC6 and DG forms compound it.',
    when: (a) => a.region === 'ie',
  },
  {
    id: 'solar-battery-upsell',
    industry: 'solar',
    attachTo: 'automation:battery-upsell-automation',
    severity: 'warning',
    title: 'The forgotten battery',
    stat: '€3–5k',
    body: '50% of closed solar deals could attach a battery. Each miss is €3–5k of margin that vanishes because nobody asked at quote stage.',
    when: () => true,
  },
  {
    id: 'solar-maintenance-attrition',
    industry: 'solar',
    attachTo: 'automation:maintenance-reminders',
    severity: 'warning',
    title: 'Maintenance attrition',
    stat: '€30–60k/yr',
    body: '95% of past installs never generate maintenance revenue. At €150–300/install/year, a 200-install base is €30–60k/year uncollected recurring revenue.',
    when: (a, ctx) =>
      (a.employees === '6-15' || a.employees === '16-50' || a.employees === '51+') ||
      (typeof a.monthlyLeadsNumeric === 'number' && a.monthlyLeadsNumeric >= 50),
  },
  {
    id: 'solar-truck-rolls',
    industry: 'solar',
    attachTo: 'automation:survey-qualification',
    severity: 'info',
    title: 'Unqualified truck rolls',
    stat: '€150 × 20%',
    body: '20% of site surveys are wasted visits at ~€150 each. A pre-survey qualification form filters dead roofs before the truck leaves the yard.',
    when: () => true,
  },
  {
    id: 'solar-referral-cac',
    industry: 'solar',
    attachTo: 'automation:referral-campaigns',
    severity: 'info',
    title: 'Referral CAC waste',
    stat: '€1–1.5k',
    body: '80% of completed jobs never produce a review or referral. With €1–1.5k CAC per new lead, every missed referral is acquisition spend you didn’t need.',
    when: () => true,
  },
  {
    id: 'solar-margin-collapse',
    industry: 'solar',
    attachTo: 'report',
    severity: 'critical',
    title: 'Margin collapse warning',
    stat: '30% → 10%',
    body: 'Scaling past ~20 installs/month, gross margins of 20–40% collapse to net 8–10% from unbilled admin bloat: 2–4 day quoting, 30 min/job of grant paperwork, and leads going cold without a 5-minute callback.',
    when: (a) =>
      (typeof a.monthlyLeadsNumeric === 'number' && a.monthlyLeadsNumeric >= 75) ||
      ((a.employees === '6-15' || a.employees === '16-50' || a.employees === '51+') &&
        typeof a.adminHoursNumeric === 'number' &&
        a.adminHoursNumeric >= 22),
  },
  {
    id: 'solar-franchise-speed',
    industry: 'solar',
    attachTo: 'report',
    severity: 'info',
    title: 'Franchise speed-to-lead',
    stat: '#1',
    body: 'Franchisor-provided leads make speed-to-lead your #1 bottleneck. When the franchisor sends a lead and you’re on a roof, who calls back — and how fast?',
    when: (a) => a.businessModel === 'franchisee',
  },

  // ---------------- RECRUITMENT ----------------
  {
    id: 'rec-speed-candidate',
    industry: 'recruitment',
    attachTo: 'leak:response',
    severity: 'critical',
    title: 'Candidate attention window',
    stat: '10 min',
    body: 'Top candidates are off the market in 10 days — and 78% of placements go to the agency that responds first. An hour of silence is a lost fee.',
    when: (a) =>
      a.responseTime === 'same-day' || a.responseTime === '1-2-days' || a.responseTime === 'slower',
  },
  {
    id: 'rec-dead-database',
    industry: 'recruitment',
    attachTo: 'automation:ats-reactivation',
    severity: 'critical',
    title: 'The £40k database',
    stat: '70%',
    body: '70% of placements come from candidates already in the ATS. A dormant database of 2,000 candidates is typically £40k+/year in fees you’re paying job boards to replace.',
    when: () => true,
  },
  {
    id: 'rec-no-show-cost',
    industry: 'recruitment',
    attachTo: 'automation:interview-reminders',
    severity: 'warning',
    title: 'No-show bleed',
    stat: '25%',
    body: 'Interview no-show rates run ~25% without SMS confirmations. Every no-show burns a client panel slot and recruiter diary time — and clients remember who sent the no-show.',
    when: () => true,
  },
  {
    id: 'rec-counter-offer',
    industry: 'recruitment',
    attachTo: 'automation:counter-offer-shield',
    severity: 'warning',
    title: 'Counter-offer kill zone',
    stat: '30–50%',
    body: '30–50% of placed candidates get counter-offers. Deals die between offer and start date when nobody is nurturing the candidate. A structured pre-start sequence halves fallouts.',
    when: () => true,
  },
  {
    id: 'rec-client-ghosting',
    industry: 'recruitment',
    attachTo: 'leak:followup',
    severity: 'info',
    title: 'Client feedback lag',
    stat: '3 days',
    body: 'Feedback that takes 3+ days kills candidate interest and your credibility. Automated shortlist + feedback chases cut time-to-feedback by half.',
    when: (a) => a.followup === 'none' || a.followup === 'manual',
  },

  // ---------------- MARKETING ----------------
  {
    id: 'mkt-proposal-decay',
    industry: 'marketing',
    attachTo: 'leak:followup',
    severity: 'critical',
    title: 'Proposal half-life',
    stat: '7 days',
    body: 'Proposal win rates collapse after 7 days of silence. Agencies that send tracked proposals with automated day-2/day-5 value nudges win ~35% more of the same pipeline.',
    when: (a) => a.proposals !== 'tracked',
  },
  {
    id: 'mkt-report-tax',
    industry: 'marketing',
    attachTo: 'automation:reporting-automation',
    severity: 'warning',
    title: 'The reporting tax',
    stat: '8h/client',
    body: 'Manual reporting burns ~8 hours per client per month. At a £45/hr blended rate and 10 clients, that’s £43k/year of senior time spent copy-pasting screenshots.',
    when: () => true,
  },
  {
    id: 'mkt-churn-surprise',
    industry: 'marketing',
    attachTo: 'automation:churn-early-warning',
    severity: 'critical',
    title: 'Churn surprise',
    stat: '60 days',
    body: 'Retainer churn shows up as a surprise cancellation email — but the signals (reply latency, login drops, scope friction) appear ~60 days earlier. An early-warning trigger saves 1–2 accounts/year.',
    when: () => true,
  },
  {
    id: 'mkt-onboarding-ttv',
    industry: 'marketing',
    attachTo: 'automation:client-onboarding',
    severity: 'info',
    title: 'Time-to-first-value',
    stat: '2×',
    body: 'Clients who see first value in week 1 renew at 2× the rate of clients stuck in a 3-week onboarding scavenger hunt. Access checklists and asset collection can run themselves.',
    when: (a) => a.followup === 'manual' || (typeof a.adminHoursNumeric === 'number' && a.adminHoursNumeric >= 16),
  },
  {
    id: 'mkt-scope-creep',
    industry: 'marketing',
    attachTo: 'automation:scope-creep-guard',
    severity: 'warning',
    title: 'Scope creep leak',
    stat: '15–25%',
    body: 'Untracked scope creep eats 15–25% of retainer margin. Automated change-request capture and utilisation alerts stop “quick favours” from becoming free retainers.',
    when: () => true,
  },

  // ---------------- GENERAL ----------------
  {
    id: 'gen-speed',
    industry: 'general',
    attachTo: 'leak:response',
    severity: 'critical',
    title: 'Speed wins the job',
    stat: '5 min',
    body: 'Businesses that respond within 5 minutes are 8× more likely to convert the lead. After an hour, most buyers have already booked a competitor.',
    when: (a) =>
      a.responseTime === 'same-day' || a.responseTime === '1-2-days' || a.responseTime === 'slower',
  },
  {
    id: 'gen-referral',
    industry: 'general',
    attachTo: 'leak:referrals',
    severity: 'info',
    title: 'The unpaid channel',
    stat: '0 £',
    body: 'Referrals are the cheapest demand you’ll ever get — and the least systematised. A timed ask beats goodwill every time.',
    when: () => true,
  },
];

export function getInsightsFor(industryId, answers, ctx = {}) {
  const a = resolve(answers);
  return INSIGHTS.filter((i) => i.industry === industryId).filter((i) => {
    try {
      return i.when(a, ctx);
    } catch {
      return false;
    }
  });
}

export function insightForAutomation(industryId, automationId, answers, ctx = {}) {
  const a = resolve(answers);
  return (
    INSIGHTS.find(
      (i) =>
        i.industry === industryId &&
        i.attachTo === `automation:${automationId}` &&
        safeWhen(i, a, ctx)
    ) || null
  );
}

export function insightsForLeakCategory(industryId, categoryId, answers, ctx = {}) {
  const a = resolve(answers);
  return INSIGHTS.filter(
    (i) =>
      i.industry === industryId &&
      i.attachTo === `leak:${categoryId}` &&
      safeWhen(i, a, ctx)
  );
}

export function reportLevelInsights(industryId, answers, ctx = {}) {
  const a = resolve(answers);
  return INSIGHTS.filter(
    (i) =>
      i.industry === industryId && i.attachTo === 'report' && safeWhen(i, a, ctx)
  );
}

function safeWhen(i, answers, ctx) {
  try {
    return i.when(answers, ctx);
  } catch {
    return false;
  }
}
