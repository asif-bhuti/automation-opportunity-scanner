/**
 * Industry definitions, pain points, KPIs, and default deal economics.
 * Used by scoring, revenue calculations, and recommendation engines.
 */

export const INDUSTRIES = {
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment & Staffing',
    shortName: 'Recruitment',
    slug: 'recruitment',
    tagline: 'Fill roles faster. Stop losing candidates between touches.',
    description:
      'Automation for agencies that live on speed-to-candidate, client follow-up, and database reactivation.',
    defaultDealValue: 4500,
    defaultConversionRate: 0.12,
    hourlyWage: 28,
    leadSources: [
      'Job boards',
      'LinkedIn',
      'Referrals',
      'Inbound website',
      'Client database',
      'Social / paid ads',
    ],
    painPoints: [
      'Candidates go cold between stages',
      'Client updates are manual and late',
      'Dead database never gets reactivated',
      'Interview no-shows destroy diary time',
      'Referrals are asked ad-hoc or never',
    ],
    kpis: [
      'Time-to-fill',
      'Interview show rate',
      'Candidate response rate',
      'Client feedback turnaround',
      'Placement-to-referral rate',
    ],
    modules: [
      'ats-reactivation',
      'interview-reminders',
      'candidate-nurture',
      'client-followup',
      'counter-offer-shield',
      'contract-compliance-pack',
      'referral-requests',
      'review-automation',
      'missed-call-recovery',
    ],
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Agencies',
    shortName: 'Marketing',
    slug: 'marketing',
    tagline: 'Win more retainers. Onboard faster. Upsell on autopilot.',
    description:
      'Automation for agencies drowning in proposals, reporting, and client onboarding busywork.',
    defaultDealValue: 2500,
    defaultConversionRate: 0.18,
    hourlyWage: 45,
    leadSources: [
      'Referrals',
      'Inbound website',
      'LinkedIn outreach',
      'Cold email',
      'Partnerships',
      'Content / SEO',
    ],
    painPoints: [
      'Proposals sit unanswered for weeks',
      'Onboarding is a 40-email scavenger hunt',
      'Monthly reports take a full day per client',
      'Upsells happen only when someone remembers',
      'Churn shows up as a surprise cancellation',
    ],
    kpis: [
      'Proposal win rate',
      'Time-to-first-value',
      'Report hours per client',
      'Upsell rate',
      'Net revenue retention',
    ],
    modules: [
      'proposal-followup',
      'client-onboarding',
      'reporting-automation',
      'churn-early-warning',
      'scope-creep-guard',
      'upsell-sequences',
      'review-automation',
      'referral-requests',
      'lead-capture',
    ],
  },
  solar: {
    id: 'solar',
    name: 'Solar & Renewable Energy',
    shortName: 'Solar',
    slug: 'solar',
    tagline: 'Close more quotes. Turn installers into referral engines.',
    description:
      'Automation for solar installers who lose revenue between quote, site survey, and post-install follow-up.',
    defaultDealValue: 8000,
    defaultConversionRate: 0.22,
    hourlyWage: 32,
    leadSources: [
      'Google / paid ads',
      'Facebook leads',
      'Referrals',
      'Door-to-door / field',
      'Partner installers',
      'Inbound website',
    ],
    painPoints: [
      'Quotes go cold after the first call',
      'Abandoned quotes never get a second touch',
      'Site inspection booking is tennis-email',
      'Reviews only happen if the owner asks',
      'Maintenance renewals are forgotten',
    ],
    kpis: [
      'Quote-to-close rate',
      'Speed-to-first-contact',
      'Site survey show rate',
      'Review volume',
      'Referral-sourced installs',
    ],
    modules: [
      'quote-reminders',
      'abandoned-quote-followup',
      'seai-grant-automation',
      'battery-upsell-automation',
      'survey-qualification',
      'review-automation',
      'maintenance-reminders',
      'referral-campaigns',
      'missed-call-recovery',
      'lead-capture',
    ],
  },
  general: {
    id: 'general',
    name: 'Other / Multi-service',
    shortName: 'General',
    slug: 'general',
    tagline: 'Find the automations your operation is missing.',
    description:
      'Cross-industry baseline for service businesses that need a diagnostic before a specialised build.',
    defaultDealValue: 1500,
    defaultConversionRate: 0.15,
    hourlyWage: 30,
    leadSources: [
      'Website',
      'Referrals',
      'Google / Maps',
      'Social media',
      'Paid ads',
      'Cold outreach',
    ],
    painPoints: [
      'Leads wait hours or days for a response',
      'Follow-up depends on who remembers',
      'Admin eats the week',
      'No systematic review or referral ask',
      'CRM is a glorified spreadsheet',
    ],
    kpis: [
      'Lead response time',
      'Follow-up completion rate',
      'Admin hours per week',
      'Review velocity',
      'Repeat / referral revenue',
    ],
    modules: [
      'lead-capture',
      'followup-automation',
      'crm-pipeline',
      'review-automation',
      'referral-requests',
      'missed-call-recovery',
      'proposal-followup',
    ],
  },
};

export function getIndustry(id) {
  return INDUSTRIES[id] || INDUSTRIES.general;
}

export function listIndustries() {
  return Object.values(INDUSTRIES);
}
