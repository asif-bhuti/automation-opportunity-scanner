/* Hallmark · module: urlparams · PRD v3 §2.1
 * Pre-filled reports via URL parameters.
 *
 * The PRD specifies a URL vocab (hubspot, hours, IE, ...) that is friendlier
 * for DM links than v1's internal answer keys (basic, same-day, ie, ...).
 * This module parses the URL, translates to v1's internal option values,
 * validates, and can fill missing answers with industry defaults when
 * auto=1. Pure, deterministic, £0.
 */

import { getIndustry } from './data/industries.js';

/**
 * Map a numeric value to the nearest v1 band option.
 * @param {number} n
 * @param {Array<[number, string]>} thresholds  sorted [minValue, bandValue]
 */
function band(n, thresholds) {
  // thresholds sorted ascending; return the highest band whose min ≤ n
  let result = thresholds[0]?.[1] || '';
  for (const [min, val] of thresholds) {
    if (n >= min) result = val;
    else break;
  }
  return result;
}

const EMPLOYEES_BANDS = [[1, '1'], [2, '2-5'], [6, '6-15'], [16, '16-50'], [51, '51+']];
const LEADS_BANDS = [[0, '0-10'], [11, '11-30'], [31, '31-75'], [76, '76-150'], [151, '151+']];
const ADMIN_BANDS = [[0, '0-5'], [6, '6-15'], [16, '16-30'], [31, '31-50'], [51, '51+']];
const DEAL_BANDS = [
  [0, 'under-500'], [500, '500-2k'], [2000, '2k-5k'],
  [5000, '5k-15k'], [15000, '15k-50k'], [50000, '50k+'],
];
const DATABASE_BANDS = [[0, 'none'], [1, 'small'], [500, 'medium'], [5000, 'large']];

/** Translate PRD URL vocab → v1 internal answer option values. */
const VOCAB = {
  region: { IE: 'ie', NZ: 'nz', UK: 'uk', OTHER: 'other', ie: 'ie', nz: 'nz', uk: 'uk', other: 'other' },
  crm: {
    none: 'none', spreadsheet: 'spreadsheet', hubspot: 'basic', pipedrive: 'full',
    salesforce: 'full', basic: 'basic', full: 'full', ats: 'ats', other: 'full',
  },
  responseTime: {
    minutes: 'minutes', hour: 'hour', hours: 'same-day',
    day: '1-2-days', days: 'slower', none: 'slower',
  },
  followup: { none: 'none', manual: 'manual', tool: 'partial', sequences: 'sequences', partial: 'partial' },
  nurtureChannels: { no: 'no', 'ad-hoc': 'ad-hoc', tool: 'tool', automated: 'automated' },
  reviews: { none: 'never', manual: 'ad-hoc', tool: 'manual-process', automated: 'automated',
    never: 'never', 'ad-hoc': 'ad-hoc', 'manual-process': 'manual-process' },
  proposals: { manual: 'manual-docs', templates: 'templates', tool: 'templates', automated: 'tracked',
    none: 'none', 'manual-docs': 'manual-docs', tracked: 'tracked' },
  appointments: { manual: 'manual', tool: 'link', automated: 'full', none: 'none', link: 'link', full: 'full' },
  reactivation: { no: 'never', manual: 'rare', tool: 'periodic', automated: 'systematic',
    never: 'never', rare: 'rare', periodic: 'periodic', systematic: 'systematic' },
  referrals: { none: 'none', manual: 'ask', tool: 'incentive', automated: 'automated',
    ask: 'ask', incentive: 'incentive' },
  bottleneck: { response: 'speed', followup: 'followup', proposals: 'conversion',
    admin: 'ops', leads: 'leads', referrals: 'retention',
    speed: 'speed', conversion: 'conversion', ops: 'ops', retention: 'retention' },
  leadSource: { paid: 'paid', inbound: 'inbound', referral: 'referrals', cold: 'outbound',
    social: 'mixed', outbound: 'outbound', referrals: 'referrals', partners: 'partners', mixed: 'mixed' },
  businessModel: { residential: 'independent', commercial: 'franchisee', mixed: 'hybrid',
    franchisee: 'franchisee', independent: 'independent', hybrid: 'hybrid' },
};

const CONVERSION_RATE_MAP = {
  5: 'under-5', 10: '5-10', 15: '11-20', 20: '11-20', 25: '21-35', 30: '21-35',
  '5': 'under-5', '10': '5-10', '15': '11-20', '20': '11-20', '25': '21-35', '30': '21-35',
  unsure: 'unsure',
};

const LOST_LEADS_MAP = {
  10: '10-25', 20: '10-25', 33: '26-40', 50: '41-60', 75: '60+',
  '10': '10-25', '20': '10-25', '33': '26-40', '50': '41-60', '75': '60+',
  unsure: 'unsure',
};

/** Param spec: how to parse + translate each URL key to a v1 answer key. */
const PARAM_MAP = {
  industry:       { key: 'industry',       type: 'enum', valid: ['solar', 'recruitment', 'marketing', 'general', 'other'] },
  region:         { key: 'region',         type: 'vocab', vocab: 'region' },
  employees:      { key: 'employees',      type: 'band', bands: EMPLOYEES_BANDS, min: 1, max: 500 },
  monthlyLeads:   { key: 'monthlyLeads',   type: 'band', bands: LEADS_BANDS, min: 0, max: 1000 },
  leadSource:     { key: 'leadSource',     type: 'vocab', vocab: 'leadSource' },
  businessModel:  { key: 'businessModel',  type: 'vocab', vocab: 'businessModel', solarOnly: true },
  crm:            { key: 'crm',           type: 'vocab', vocab: 'crm' },
  website:        { key: 'website',        type: 'vocab', vocab: { none: 'none', basic: 'brochure', brochure: 'brochure', cms: 'forms', forms: 'forms', landing: 'funnel', funnel: 'funnel', full: 'strong', strong: 'strong' } },
  responseTime:   { key: 'responseTime',   type: 'vocab', vocab: 'responseTime' },
  followup:       { key: 'followup',       type: 'vocab', vocab: 'followup' },
  nurtureChannels:{ key: 'nurtureChannels',type: 'vocab', vocab: 'nurtureChannels' },
  reviews:        { key: 'reviews',        type: 'vocab', vocab: 'reviews' },
  proposals:      { key: 'proposals',      type: 'vocab', vocab: 'proposals' },
  appointments:   { key: 'appointments',   type: 'vocab', vocab: 'appointments' },
  adminHours:     { key: 'adminHours',     type: 'band', bands: ADMIN_BANDS, min: 0, max: 80 },
  conversionRate: { key: 'conversionRate', type: 'convRate' },
  avgDeal:        { key: 'avgDeal',        type: 'band', bands: DEAL_BANDS, min: 1000, max: 500000 },
  lostLeadsPct:   { key: 'lostLeadsPct',   type: 'lostLeads' },
  database:       { key: 'database',       type: 'band', bands: DATABASE_BANDS, min: 0, max: 100000 },
  reactivation:   { key: 'reactivation',   type: 'vocab', vocab: 'reactivation' },
  bottleneck:     { key: 'bottleneck',     type: 'vocab', vocab: 'bottleneck' },
  wandFix:        { key: 'wandFix',        type: 'vocab', vocab: 'bottleneck' },
  referrals:      { key: 'referrals',      type: 'vocab', vocab: 'referrals' },
  auto:           { key: 'auto',           type: 'flag' },
};

/** Minimum answer keys needed before auto-generating a report. */
const AUTO_MIN_KEYS = ['industry', 'monthlyLeads', 'avgDeal'];

/**
 * Parse a URL (or query string) into { answers, autoGenerate, hasParams }.
 * @param {string} url
 * @returns {{ answers: Record<string,string>, autoGenerate: boolean, hasParams: boolean }}
 */
export function parseUrlParams(url) {
  const search = url.includes('?') ? url.split('?')[1] : url;
  const params = new URLSearchParams(search);
  const answers = {};
  let autoGenerate = false;

  for (const [param, spec] of Object.entries(PARAM_MAP)) {
    const raw = params.get(param);
    if (raw === null || raw === '') continue;

    if (spec.type === 'flag') {
      if (param === 'auto') autoGenerate = raw === '1' || raw === 'true';
      continue;
    }

    if (spec.type === 'enum') {
      const val = spec.valid.includes(raw) ? raw : null;
      if (!val) continue;
      // PRD "other" routes to nearest researched vertical → general
      answers[spec.key] = val === 'other' ? 'general' : val;
      continue;
    }

    if (spec.type === 'vocab') {
      if (spec.solarOnly && answers.industry !== 'solar') continue;
      const vocabTable = typeof spec.vocab === 'string' ? VOCAB[spec.vocab] : spec.vocab;
      const val = vocabTable?.[raw];
      if (!val) continue;
      answers[spec.key] = val;
      continue;
    }

    if (spec.type === 'band') {
      const n = parseInt(raw, 10);
      if (Number.isNaN(n)) continue;
      if (spec.min !== undefined && (n < spec.min || n > spec.max)) continue;
      answers[spec.key] = band(n, spec.bands);
      continue;
    }

    if (spec.type === 'convRate') {
      const val = CONVERSION_RATE_MAP[raw];
      if (!val) continue;
      answers[spec.key] = val;
      continue;
    }

    if (spec.type === 'lostLeads') {
      const val = LOST_LEADS_MAP[raw];
      if (!val) continue;
      answers[spec.key] = val;
      continue;
    }
  }

  return {
    answers,
    autoGenerate,
    hasParams: Object.keys(answers).length > 0,
  };
}

/**
 * Check if enough answers exist to auto-generate a report.
 * @param {Record<string,string>} answers
 * @returns {boolean}
 */
export function canAutoGenerate(answers) {
  return AUTO_MIN_KEYS.every((k) => answers[k] != null && answers[k] !== '');
}

/** Default answers per industry, derived from industries.js config. */
export function industryDefaults(industryId) {
  const ind = getIndustry(industryId);
  return {
    industry: ind.id,
    region: 'uk',
    employees: '6-15',
    monthlyLeads: '11-30',
    leadSource: 'mixed',
    crm: 'spreadsheet',
    website: 'brochure',
    responseTime: 'same-day',
    followup: 'manual',
    nurtureChannels: 'ad-hoc',
    reviews: 'ad-hoc',
    proposals: 'templates',
    appointments: 'link',
    adminHours: '16-30',
    conversionRate: '11-20',
    avgDeal: dealBand(ind.defaultDealValue),
    lostLeadsPct: '26-40',
    database: 'medium',
    reactivation: 'rare',
    bottleneck: 'followup',
    wandFix: 'followup',
    referrals: 'ask',
  };
}

function dealBand(value) {
  return band(value, DEAL_BANDS);
}

export { PARAM_MAP, AUTO_MIN_KEYS, VOCAB };
