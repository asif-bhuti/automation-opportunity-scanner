/**
 * Personalized workflow diagram builder (nodes + edges).
 * Industry-specific templates modified by maturity gaps.
 */

/**
 * @param {string} industryId
 * @param {Record<string, unknown>} answers
 * @param {Array<{id: string}>} recommendations
 * @returns {{ nodes: Array<object>, edges: Array<object>, title: string }}
 */
export function buildWorkflow(industryId, answers = {}, recommendations = []) {
  const recIds = new Set((recommendations || []).map((r) => r.id));
  const base = templates[industryId] || templates.general;
  const nodes = base.nodes.map((n) => annotateNode(n, answers, recIds));
  const layout = layouts[industryId] || layouts.general;
  const positioned = nodes.map((n) => ({
    ...n,
    pos: layout[n.id] || { col: 2, row: 1 },
  }));
  const edges = base.edges.map((e, i) => ({
    id: `e${i}`,
    from: e.from,
    to: e.to,
    dashed: Boolean(e.dashed),
    tone: e.tone || 'main',
  }));

  return {
    title: base.title,
    subtitle: base.subtitle,
    nodes: positioned,
    edges,
    canvas: canvasSize(positioned),
  };
}

function canvasSize(nodes) {
  let maxCol = 3, maxRow = 1;
  for (const n of nodes) {
    if (n.pos.col > maxCol) maxCol = n.pos.col;
    if (n.pos.row > maxRow) maxRow = n.pos.row;
  }
  return { cols: 3, rows: maxRow };
}

/** Grid positions (col 1..3, row 1..n) per industry node id. */
const layouts = {
  solar: {
    lead: { col: 2, row: 1 },
    speed: { col: 2, row: 2 },
    crm: { col: 2, row: 3 },
    'survey-qualify': { col: 1, row: 4 },
    survey: { col: 2, row: 4 },
    quote: { col: 2, row: 5 },
    battery: { col: 1, row: 6 },
    grant: { col: 2, row: 6 },
    chase: { col: 3, row: 5 },
    install: { col: 2, row: 7 },
    review: { col: 2, row: 8 },
    maintain: { col: 1, row: 9 },
    refer: { col: 3, row: 9 },
  },
  recruitment: {
    lead: { col: 2, row: 1 },
    crm: { col: 2, row: 2 },
    qualify: { col: 2, row: 3 },
    outreach: { col: 1, row: 4 },
    interview: { col: 2, row: 4 },
    client: { col: 3, row: 4 },
    placement: { col: 2, row: 5 },
    'counter-offer': { col: 2, row: 6 },
    compliance: { col: 2, row: 7 },
    reactivate: { col: 3, row: 2 },
    review: { col: 2, row: 8 },
  },
  marketing: {
    lead: { col: 2, row: 1 },
    crm: { col: 2, row: 2 },
    qualify: { col: 2, row: 3 },
    proposal: { col: 2, row: 4 },
    onboard: { col: 2, row: 5 },
    delivery: { col: 2, row: 6 },
    report: { col: 1, row: 7 },
    scope: { col: 2, row: 7 },
    churn: { col: 3, row: 7 },
    upsell: { col: 2, row: 8 },
    review: { col: 2, row: 9 },
  },
  general: {
    lead: { col: 2, row: 1 },
    capture: { col: 2, row: 2 },
    crm: { col: 2, row: 3 },
    qualify: { col: 2, row: 4 },
    follow: { col: 1, row: 5 },
    proposal: { col: 2, row: 5 },
    book: { col: 3, row: 5 },
    deliver: { col: 2, row: 6 },
    review: { col: 2, row: 7 },
  },
};

function annotateNode(node, answers, recIds) {
  let status = node.status || 'core';
  // Mark automation opportunities
  if (node.gapWhen && node.gapWhen(answers)) {
    status = 'gap';
  }
  if (node.automationId && recIds.has(node.automationId)) {
    status = status === 'gap' ? 'opportunity' : 'enhance';
  }
  return {
    id: node.id,
    label: node.label,
    description: node.description || '',
    status,
    automationId: node.automationId || null,
  };
}

const templates = {
  recruitment: {
    title: 'Recruitment revenue workflow',
    subtitle: 'From inquiry to placement to review',
    nodes: [
      {
        id: 'lead',
        label: 'Lead / Req in',
        description: 'Job win or candidate inquiry',
        status: 'core',
      },
      {
        id: 'crm',
        label: 'ATS / CRM',
        description: 'Stage ownership',
        automationId: 'crm-pipeline',
        gapWhen: (a) => a.crm === 'none' || a.crm === 'spreadsheet',
      },
      {
        id: 'qualify',
        label: 'Qualify',
        description: 'Fit screen',
        status: 'core',
      },
      {
        id: 'outreach',
        label: 'Candidate outreach',
        description: 'SMS + email',
        automationId: 'candidate-nurture',
        gapWhen: (a) => a.followup === 'none' || a.followup === 'manual',
      },
      {
        id: 'interview',
        label: 'Interview',
        description: 'Reminders & confirms',
        automationId: 'interview-reminders',
        gapWhen: (a) => a.appointments === 'manual' || a.appointments === 'link',
      },
      {
        id: 'client',
        label: 'Client update',
        description: 'Shortlist + feedback chase',
        automationId: 'client-followup',
        gapWhen: (a) => a.followup === 'manual' || a.followup === 'none',
      },
      {
        id: 'placement',
        label: 'Placement',
        description: 'Offer accepted',
        status: 'core',
      },
      {
        id: 'counter-offer',
        label: 'Offer → start',
        description: 'Counter-offer shield',
        automationId: 'counter-offer-shield',
        gapWhen: (a) => a.followup === 'none' || a.followup === 'manual',
      },
      {
        id: 'compliance',
        label: 'Compliance pack',
        description: 'Contracts + RTW',
        automationId: 'contract-compliance-pack',
        gapWhen: (a) => {
          const h = a.adminHoursNumeric;
          return typeof h === 'number' && h >= 22;
        },
      },
      {
        id: 'reactivate',
        label: 'DB reactivation',
        description: 'Warm old talent',
        automationId: 'ats-reactivation',
        gapWhen: (a) => a.reactivation === 'never' || a.reactivation === 'rare',
      },
      {
        id: 'review',
        label: 'Review + referral',
        description: 'Ask while grateful',
        automationId: 'referral-requests',
        gapWhen: (a) => a.reviews === 'never' || a.referrals === 'none',
      },
    ],
    edges: [
      { from: 'lead', to: 'crm' },
      { from: 'crm', to: 'qualify' },
      { from: 'qualify', to: 'outreach' },
      { from: 'outreach', to: 'interview' },
      { from: 'interview', to: 'client' },
      { from: 'client', to: 'placement' },
      { from: 'placement', to: 'counter-offer' },
      { from: 'counter-offer', to: 'compliance' },
      { from: 'compliance', to: 'review' },
      { from: 'crm', to: 'reactivate', dashed: true },
      { from: 'reactivate', to: 'outreach', dashed: true },
    ],
  },
  marketing: {
    title: 'Agency growth workflow',
    subtitle: 'Lead → proposal → retain → expand',
    nodes: [
      {
        id: 'lead',
        label: 'Lead in',
        description: 'Inbound or outreach',
        automationId: 'lead-capture',
        gapWhen: (a) => a.website === 'brochure' || a.website === 'none',
      },
      {
        id: 'crm',
        label: 'CRM',
        description: 'Pipeline stages',
        automationId: 'crm-pipeline',
        gapWhen: (a) => a.crm === 'none' || a.crm === 'spreadsheet',
      },
      {
        id: 'qualify',
        label: 'Discovery',
        description: 'Fit call',
        status: 'core',
      },
      {
        id: 'proposal',
        label: 'Proposal',
        description: 'Send + chase',
        automationId: 'proposal-followup',
        gapWhen: (a) => a.proposals !== 'tracked',
      },
      {
        id: 'onboard',
        label: 'Onboarding',
        description: 'Kickoff checklist',
        automationId: 'client-onboarding',
        gapWhen: (a) => {
          const h = a.adminHoursNumeric;
          return a.followup === 'manual' || (typeof h === 'number' && h >= 22);
        },
      },
      {
        id: 'delivery',
        label: 'Delivery',
        description: 'Campaign work',
        status: 'core',
      },
      {
        id: 'report',
        label: 'Reporting',
        description: 'Monthly pack',
        automationId: 'reporting-automation',
        gapWhen: (a) => {
          const h = a.adminHoursNumeric;
          return typeof h === 'number' && h >= 16;
        },
      },
      {
        id: 'scope',
        label: 'Scope guard',
        description: 'Change requests',
        automationId: 'scope-creep-guard',
        gapWhen: (a) => {
          const h = a.adminHoursNumeric;
          return typeof h === 'number' && h >= 22;
        },
      },
      {
        id: 'churn',
        label: 'Churn watch',
        description: '60-day early warning',
        automationId: 'churn-early-warning',
        gapWhen: (a) => a.followup === 'none' || a.followup === 'manual' || a.referrals === 'none',
      },
      {
        id: 'upsell',
        label: 'Upsell',
        description: 'Expand retainer',
        automationId: 'upsell-sequences',
        gapWhen: (a) => a.referrals === 'none',
      },
      {
        id: 'review',
        label: 'Review + referral',
        description: 'Proof + intros',
        automationId: 'review-automation',
        gapWhen: (a) => a.reviews === 'never' || a.reviews === 'ad-hoc',
      },
    ],
    edges: [
      { from: 'lead', to: 'crm' },
      { from: 'crm', to: 'qualify' },
      { from: 'qualify', to: 'proposal' },
      { from: 'proposal', to: 'onboard' },
      { from: 'onboard', to: 'delivery' },
      { from: 'delivery', to: 'report' },
      { from: 'report', to: 'scope' },
      { from: 'scope', to: 'churn' },
      { from: 'churn', to: 'upsell' },
      { from: 'upsell', to: 'review' },
      { from: 'review', to: 'lead', dashed: true },
    ],
  },
  solar: {
    title: 'Solar install workflow',
    subtitle: 'Lead → quote → install → lifecycle',
    nodes: [
      {
        id: 'lead',
        label: 'Lead in',
        description: 'Ads, web, referral',
        automationId: 'lead-capture',
        gapWhen: (a) => a.website === 'none' || a.website === 'brochure',
      },
      {
        id: 'speed',
        label: 'Speed-to-lead',
        description: 'Call/SMS < 5 min',
        automationId: 'missed-call-recovery',
        gapWhen: (a) =>
          a.responseTime !== 'minutes' && a.responseTime !== 'hour',
      },
      {
        id: 'crm',
        label: 'CRM',
        description: 'Quote pipeline',
        automationId: 'crm-pipeline',
        gapWhen: (a) => a.crm === 'none' || a.crm === 'spreadsheet',
      },
      {
        id: 'survey-qualify',
        label: 'Survey qualification',
        description: 'Filter dead roofs',
        automationId: 'survey-qualification',
        gapWhen: (a) => a.appointments === 'manual' || a.appointments === 'link',
      },
      {
        id: 'survey',
        label: 'Site survey',
        description: 'Book + remind',
        status: 'core',
      },
      {
        id: 'quote',
        label: 'Quote',
        description: 'Proposal + finance',
        automationId: 'quote-reminders',
        gapWhen: (a) => a.proposals !== 'tracked',
      },
      {
        id: 'battery',
        label: 'Battery upsell',
        description: 'Attachment prompt',
        automationId: 'battery-upsell-automation',
        gapWhen: (a) => a.followup === 'none' || a.followup === 'manual',
      },
      {
        id: 'grant',
        label: 'Grant / SEAI',
        description: 'Pre-filled forms',
        automationId: 'seai-grant-automation',
        gapWhen: (a) => a.proposals === 'manual-docs' || a.proposals === 'templates',
      },
      {
        id: 'chase',
        label: 'Abandoned recovery',
        description: '7–30 day re-engage',
        automationId: 'abandoned-quote-followup',
        gapWhen: (a) => a.reactivation === 'never' || a.followup === 'manual',
      },
      {
        id: 'install',
        label: 'Install',
        description: 'Scheduling',
        status: 'core',
      },
      {
        id: 'review',
        label: 'Review ask',
        description: 'Same-week request',
        automationId: 'review-automation',
        gapWhen: (a) => a.reviews === 'never' || a.reviews === 'ad-hoc',
      },
      {
        id: 'maintain',
        label: 'Maintenance',
        description: 'Annual service',
        automationId: 'maintenance-reminders',
        gapWhen: (a) => a.nurtureChannels === 'no' || a.nurtureChannels === 'ad-hoc',
      },
      {
        id: 'refer',
        label: 'Referral',
        description: 'Neighbour loop',
        automationId: 'referral-campaigns',
        gapWhen: (a) => a.referrals === 'none' || a.referrals === 'ask',
      },
    ],
    edges: [
      { from: 'lead', to: 'speed' },
      { from: 'speed', to: 'crm' },
      { from: 'crm', to: 'survey-qualify' },
      { from: 'survey-qualify', to: 'survey' },
      { from: 'survey', to: 'quote' },
      { from: 'quote', to: 'battery' },
      { from: 'battery', to: 'grant' },
      { from: 'grant', to: 'install' },
      { from: 'quote', to: 'chase', dashed: true },
      { from: 'chase', to: 'quote', dashed: true },
      { from: 'install', to: 'review' },
      { from: 'review', to: 'maintain' },
      { from: 'maintain', to: 'refer' },
      { from: 'refer', to: 'lead', dashed: true },
    ],
  },
  general: {
    title: 'Service business workflow',
    subtitle: 'Capture → convert → deliver → compound',
    nodes: [
      {
        id: 'lead',
        label: 'Lead in',
        description: 'All channels',
        automationId: 'lead-capture',
        gapWhen: (a) => a.website === 'none' || a.website === 'brochure',
      },
      {
        id: 'capture',
        label: 'Capture',
        description: 'Form / call / chat',
        automationId: 'missed-call-recovery',
        gapWhen: (a) => a.responseTime === 'slower' || a.responseTime === '1-2-days',
      },
      {
        id: 'crm',
        label: 'CRM',
        description: 'Single source of truth',
        automationId: 'crm-pipeline',
        gapWhen: (a) => a.crm === 'none' || a.crm === 'spreadsheet',
      },
      {
        id: 'qualify',
        label: 'Qualify',
        description: 'Fit check',
        status: 'core',
      },
      {
        id: 'follow',
        label: 'Follow-up',
        description: 'Multi-touch',
        automationId: 'followup-automation',
        gapWhen: (a) => a.followup === 'none' || a.followup === 'manual',
      },
      {
        id: 'proposal',
        label: 'Proposal',
        description: 'Send + track',
        automationId: 'proposal-followup',
        gapWhen: (a) => a.proposals !== 'tracked',
      },
      {
        id: 'book',
        label: 'Booking',
        description: 'Schedule work',
        status: 'core',
      },
      {
        id: 'deliver',
        label: 'Delivery',
        description: 'Do the work',
        status: 'core',
      },
      {
        id: 'review',
        label: 'Review + referral',
        description: 'Ask systematically',
        automationId: 'review-automation',
        gapWhen: (a) => a.reviews === 'never' || a.referrals === 'none',
      },
    ],
    edges: [
      { from: 'lead', to: 'capture' },
      { from: 'capture', to: 'crm' },
      { from: 'crm', to: 'qualify' },
      { from: 'qualify', to: 'follow' },
      { from: 'follow', to: 'proposal' },
      { from: 'proposal', to: 'book' },
      { from: 'book', to: 'deliver' },
      { from: 'deliver', to: 'review' },
      { from: 'review', to: 'lead', dashed: true },
    ],
  },
};

export const __templates = templates;
