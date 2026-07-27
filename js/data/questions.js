/**
 * Shared assessment question bank.
 * Each question maps to answer keys consumed by scoring + decision engines.
 */

export const QUESTIONS = [
  {
    id: 'industry',
    key: 'industry',
    step: 1,
    type: 'single',
    required: true,
    label: 'What industry are you in?',
    help: 'We tune recommendations and ROI math to your vertical.',
    options: [
      { value: 'recruitment', label: 'Recruitment & Staffing' },
      { value: 'marketing', label: 'Marketing Agency' },
      { value: 'solar', label: 'Solar / Renewables' },
      { value: 'general', label: 'Other service business' },
    ],
  },
  {
    id: 'region',
    key: 'region',
    step: 1,
    type: 'single',
    required: true,
    label: 'Where is the business based?',
    help: 'We localise currency, grants, and market stats to your region.',
    options: [
      { value: 'ie', label: 'Ireland' },
      { value: 'nz', label: 'New Zealand' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'employees',
    key: 'employees',
    step: 1,
    type: 'single',
    required: true,
    label: 'How many people are on the team?',
    options: [
      { value: '1', label: 'Just me', size: 'solo' },
      { value: '2-5', label: '2–5', size: 'micro' },
      { value: '6-15', label: '6–15', size: 'small' },
      { value: '16-50', label: '16–50', size: 'mid' },
      { value: '51+', label: '51+', size: 'large' },
    ],
  },
  {
    id: 'monthlyLeads',
    key: 'monthlyLeads',
    step: 2,
    type: 'single',
    required: true,
    label: 'Roughly how many new leads do you get per month?',
    options: [
      { value: '0-10', label: 'Under 10', numeric: 5 },
      { value: '11-30', label: '11–30', numeric: 20 },
      { value: '31-75', label: '31–75', numeric: 50 },
      { value: '76-150', label: '76–150', numeric: 110 },
      { value: '151+', label: '151+', numeric: 200 },
    ],
  },
  {
    id: 'leadSource',
    key: 'leadSource',
    step: 2,
    type: 'single',
    required: true,
    label: 'Primary lead source?',
    options: [
      { value: 'inbound', label: 'Website / inbound' },
      { value: 'paid', label: 'Paid ads' },
      { value: 'outbound', label: 'Outbound / cold' },
      { value: 'referrals', label: 'Referrals' },
      { value: 'partners', label: 'Partners / job boards' },
      { value: 'mixed', label: 'Mix of the above' },
    ],
  },
  {
    id: 'businessModel',
    key: 'businessModel',
    step: 2,
    type: 'single',
    required: false,
    label: 'Franchisee or independent?',
    help: 'Franchise models change where the bottlenecks sit (e.g. franchisor-supplied leads).',
    industries: ['solar'],
    options: [
      { value: 'franchisee', label: 'Franchisee (franchisor supplies leads/brand)' },
      { value: 'independent', label: 'Independent installer' },
      { value: 'hybrid', label: 'Mix — own leads + partner/franchise work' },
    ],
  },
  {
    id: 'crm',
    key: 'crm',
    step: 3,
    type: 'single',
    required: true,
    label: 'What do you use as a CRM?',
    options: [
      { value: 'none', label: 'No CRM — email & memory' },
      { value: 'spreadsheet', label: 'Spreadsheets' },
      { value: 'basic', label: 'Basic CRM (HubSpot free, etc.)' },
      { value: 'full', label: 'Full CRM with pipelines' },
      { value: 'ats', label: 'ATS / industry platform' },
    ],
  },
  {
    id: 'website',
    key: 'website',
    step: 3,
    type: 'single',
    required: true,
    label: 'How strong is your website as a lead funnel?',
    options: [
      { value: 'none', label: 'No real website' },
      { value: 'brochure', label: 'Brochure site, one “contact us”' },
      { value: 'forms', label: 'Forms, but no follow-up system' },
      { value: 'funnel', label: 'Quiz / multi-step capture' },
      { value: 'strong', label: 'Full funnel + automations' },
    ],
  },
  {
    id: 'responseTime',
    key: 'responseTime',
    step: 4,
    type: 'single',
    required: true,
    label: 'Typical first response time to a new lead?',
    options: [
      { value: 'minutes', label: 'Under 5 minutes' },
      { value: 'hour', label: 'Within an hour' },
      { value: 'same-day', label: 'Same business day' },
      { value: '1-2-days', label: '1–2 days' },
      { value: 'slower', label: 'Often slower / inconsistent' },
    ],
  },
  {
    id: 'followup',
    key: 'followup',
    step: 4,
    type: 'single',
    required: true,
    label: 'How do you handle follow-up?',
    options: [
      { value: 'none', label: 'Mostly one touch, then hope' },
      { value: 'manual', label: 'Manual reminders / sticky notes' },
      { value: 'partial', label: 'Some templates, still manual' },
      { value: 'sequences', label: 'Automated multi-touch sequences' },
    ],
  },
  {
    id: 'nurtureChannels',
    key: 'nurtureChannels',
    step: 5,
    type: 'single',
    required: true,
    label: 'How do you nurture leads between touches?',
    options: [
      { value: 'no', label: "We don't really" },
      { value: 'ad-hoc', label: 'Ad-hoc emails or texts, no system' },
      { value: 'tool', label: 'A tool, but campaigns are manual' },
      { value: 'automated', label: 'Automated sequences (email and/or SMS/WhatsApp)' },
    ],
  },
  {
    id: 'reviews',
    key: 'reviews',
    step: 5,
    type: 'single',
    required: true,
    label: 'Review requests?',
    options: [
      { value: 'never', label: 'Almost never' },
      { value: 'ad-hoc', label: 'When we remember' },
      { value: 'manual-process', label: 'Defined process, still manual' },
      { value: 'automated', label: 'Triggered automatically' },
    ],
  },
  {
    id: 'proposals',
    key: 'proposals',
    step: 6,
    type: 'single',
    required: true,
    label: 'How do proposals / quotes work?',
    options: [
      { value: 'none', label: 'Verbal only / none' },
      { value: 'manual-docs', label: 'Manual docs each time' },
      { value: 'templates', label: 'Templates, manual send + chase' },
      { value: 'tracked', label: 'Tracked + automated follow-up' },
    ],
  },
  {
    id: 'appointments',
    key: 'appointments',
    step: 6,
    type: 'single',
    required: true,
    label: 'Bookings / appointments / interviews?',
    options: [
      { value: 'none', label: 'Rarely scheduled' },
      { value: 'manual', label: 'Back-and-forth email / phone' },
      { value: 'link', label: 'Booking link, no reminders' },
      { value: 'full', label: 'Booking + reminders + no-show handling' },
    ],
  },
  {
    id: 'adminHours',
    key: 'adminHours',
    step: 7,
    type: 'single',
    required: true,
    label: 'Hours per week the team spends on repetitive admin?',
    options: [
      { value: '0-5', label: 'Under 5', numeric: 3 },
      { value: '6-15', label: '6–15', numeric: 10 },
      { value: '16-30', label: '16–30', numeric: 22 },
      { value: '31-50', label: '31–50', numeric: 40 },
      { value: '51+', label: '51+', numeric: 60 },
    ],
  },
  {
    id: 'conversionRate',
    key: 'conversionRate',
    step: 7,
    type: 'single',
    required: true,
    label: 'Lead → customer / placement conversion rate?',
    options: [
      { value: 'under-5', label: 'Under 5%', numeric: 0.04 },
      { value: '5-10', label: '5–10%', numeric: 0.075 },
      { value: '11-20', label: '11–20%', numeric: 0.15 },
      { value: '21-35', label: '21–35%', numeric: 0.28 },
      { value: '36+', label: '36%+', numeric: 0.4 },
      { value: 'unsure', label: 'Not sure', numeric: null },
    ],
  },
  {
    id: 'avgDeal',
    key: 'avgDeal',
    step: 7,
    type: 'single',
    required: true,
    label: 'Average deal / placement / job value?',
    options: [
      { value: 'under-500', label: 'Under £500', numeric: 350 },
      { value: '500-2k', label: '£500–£2,000', numeric: 1200 },
      { value: '2k-5k', label: '£2,000–£5,000', numeric: 3500 },
      { value: '5k-15k', label: '£5,000–£15,000', numeric: 9000 },
      { value: '15k-50k', label: '£15,000–£50,000', numeric: 30000 },
      { value: '50k+', label: '£50,000+', numeric: 75000 },
    ],
  },
  {
    id: 'lostLeadsPct',
    key: 'lostLeadsPct',
    step: 8,
    type: 'single',
    required: true,
    label: 'What % of leads go cold with no real follow-up?',
    options: [
      { value: 'under-10', label: 'Under 10%', numeric: 0.08 },
      { value: '10-25', label: '10–25%', numeric: 0.18 },
      { value: '26-40', label: '26–40%', numeric: 0.33 },
      { value: '41-60', label: '41–60%', numeric: 0.5 },
      { value: '60+', label: 'Over 60%', numeric: 0.7 },
      { value: 'unsure', label: 'Not sure', numeric: 0.35 },
    ],
  },
  {
    id: 'database',
    key: 'database',
    step: 8,
    type: 'single',
    required: true,
    label: 'Do you have a dormant lead / candidate / client database?',
    options: [
      { value: 'none', label: 'No usable list' },
      { value: 'small', label: 'Yes, under 500 contacts' },
      { value: 'medium', label: '500–5,000' },
      { value: 'large', label: '5,000+' },
    ],
  },
  {
    id: 'reactivation',
    key: 'reactivation',
    step: 8,
    type: 'single',
    required: true,
    label: 'Do you run reactivation on old leads?',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'rare', label: 'Rarely / one-off blasts' },
      { value: 'periodic', label: 'A few times a year' },
      { value: 'systematic', label: 'Always-on system' },
    ],
  },
  {
    id: 'bottleneck',
    key: 'bottleneck',
    step: 8,
    type: 'single',
    required: true,
    label: 'Biggest bottleneck right now?',
    options: [
      { value: 'leads', label: 'Not enough quality leads' },
      { value: 'speed', label: 'Slow response / missed enquiries' },
      { value: 'followup', label: 'Inconsistent follow-up' },
      { value: 'conversion', label: 'Leads don’t convert' },
      { value: 'ops', label: 'Ops / admin overload' },
      { value: 'retention', label: 'Retention / referrals weak' },
    ],
  },
  {
    id: 'wandFix',
    key: 'wandFix',
    step: 8,
    type: 'single',
    required: true,
    label: 'If you could wave a wand and fix ONE of these this quarter, which would it be?',
    help: 'What hurts and what you’d fund are often different. This steers the first build conversation.',
    options: [
      { value: 'leads', label: 'Not enough quality leads' },
      { value: 'speed', label: 'Slow response / missed enquiries' },
      { value: 'followup', label: 'Inconsistent follow-up' },
      { value: 'conversion', label: 'Leads don’t convert' },
      { value: 'ops', label: 'Ops / admin overload' },
      { value: 'retention', label: 'Retention / referrals weak' },
    ],
  },
  {
    id: 'referrals',
    key: 'referrals',
    step: 8,
    type: 'single',
    required: true,
    label: 'Referral system?',
    options: [
      { value: 'none', label: 'None — pure luck' },
      { value: 'ask', label: 'We ask sometimes' },
      { value: 'incentive', label: 'Incentive, still manual' },
      { value: 'automated', label: 'Automated programme' },
    ],
  },
];

export const STEP_META = [
  { step: 1, title: 'Business basics', description: 'Industry, region, and team size' },
  { step: 2, title: 'Lead flow', description: 'Volume and sources' },
  { step: 3, title: 'Systems', description: 'CRM and website' },
  { step: 4, title: 'Speed & chase', description: 'Response and follow-up' },
  { step: 5, title: 'Channels', description: 'Nurture and reviews' },
  { step: 6, title: 'Close loop', description: 'Proposals and bookings' },
  { step: 7, title: 'Economics', description: 'Admin, conversion, deal value' },
  { step: 8, title: 'Leakage & priorities', description: 'Lost leads, database, and what you’d fix first' },
];

export function getQuestionsForStep(step) {
  return QUESTIONS.filter((q) => q.step === step);
}

export function getQuestionByKey(key) {
  return QUESTIONS.find((q) => q.key === key) || null;
}

export function totalSteps() {
  return STEP_META.length;
}

/**
 * Resolve numeric helper values from option selections.
 * Also maps legacy email/sms answers onto nurtureChannels for old sessions.
 */
export function resolveNumericAnswers(answers) {
  const out = { ...answers };

  // Legacy session compatibility: email + sms → nurtureChannels
  if (!out.nurtureChannels && (out.email || out.sms)) {
    out.nurtureChannels = deriveNurtureChannels(out.email, out.sms);
  }

  // Legacy avgDeal band
  if (out.avgDeal === '15k+') {
    out.avgDeal = '15k-50k';
  }

  for (const q of QUESTIONS) {
    const val = out[q.key];
    if (val == null) continue;
    const opt = (q.options || []).find((o) => o.value === val);
    if (opt && Object.prototype.hasOwnProperty.call(opt, 'numeric')) {
      out[`${q.key}Numeric`] = opt.numeric;
    }
    if (opt && opt.size) out.businessSize = opt.size;
  }
  return out;
}

/** Map historical email/sms pair onto the merged nurture scale. */
export function deriveNurtureChannels(email, sms) {
  if (email === 'advanced' || sms === 'automated') return 'automated';
  if (email === 'tool' || sms === 'business') return 'tool';
  if (email === 'ad-hoc' || sms === 'manual') return 'ad-hoc';
  if (email === 'no' && (sms === 'no' || !sms)) return 'no';
  if (!email && !sms) return undefined;
  return 'ad-hoc';
}
