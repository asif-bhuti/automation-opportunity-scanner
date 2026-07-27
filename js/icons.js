/**
 * Flat inline SVG icon set (stroke-based, currentColor).
 * Minimal geometry, no fills — deXevel dark UI friendly.
 */

const PATHS = {
  bolt: 'M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z',
  funnel: 'M3 4h18l-7 8v6l-4 2v-8L3 4Z',
  phone: 'M6.6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5 2 2 0 0 1 6.6 3Z',
  mail: 'M3 5h18v14H3V5Zm0 1 9 6 9-6',
  chat: 'M4 4h16v11H9l-5 4V4Z',
  star: 'm12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M17.5 14.5A6 6 0 0 1 21 20',
  calendar: 'M4 5h16v16H4V5Zm0 4h16M8 3v4m8-4v4',
  doc: 'M6 3h8l4 4v14H6V3Zm8 0v4h4M9 12h6M9 16h6',
  chart: 'M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-8',
  gear: 'M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm7.5 3.5-.1 1.1 2 1.6-2 3.4-2.4-.9a7.6 7.6 0 0 1-1.9 1.1L14.7 20H9.3l-.4-2.2a7.6 7.6 0 0 1-1.9-1.1l-2.4.9-2-3.4 2-1.6a7.7 7.7 0 0 1 0-2.2l-2-1.6 2-3.4 2.4.9a7.6 7.6 0 0 1 1.9-1.1L9.3 4h5.4l.4 2.2a7.6 7.6 0 0 1 1.9 1.1l2.4-.9 2 3.4-2 1.6.1 1.1Z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  battery: 'M3 8h15v8H3V8Zm15 3h3v2h-3M6 10.5v3m3-3v3m3-3v3',
  shield: 'M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3Z',
  alert: 'M12 3 2 20h20L12 3Zm0 7v4m0 3v.5',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4',
  link: 'M9 15 15 9M10.5 6.5 12 5a4 4 0 0 1 6 6l-1.5 1.5M13.5 17.5 12 19a4 4 0 0 1-6-6l1.5-1.5',
  home: 'M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10',
  briefcase: 'M4 7h16v13H4V7Zm4 0V4h8v3M4 12h16',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-13v2m0 18v-2M3 12H1m22 0h-2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4m0-12.8 1.4-1.4M4.2 19.8l1.4-1.4',
  clipboard: 'M8 4H5v17h14V4h-3M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2M8 4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2M9 12l2 2 4-4',
  eye: 'M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Zm10 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  scale: 'M12 3v18M5 21h14M7 6l-4 7a3.5 3.5 0 0 0 8 0L7 6Zm10 0-4 7a3.5 3.5 0 0 0 8 0l-4-7ZM5 6h14',
};

/** automationId → icon name */
const AUTOMATION_ICONS = {
  'crm-pipeline': 'funnel',
  'followup-automation': 'refresh',
  'lead-capture': 'target',
  'review-automation': 'star',
  'referral-requests': 'users',
  'proposal-followup': 'doc',
  'missed-call-recovery': 'phone',
  'ats-reactivation': 'refresh',
  'interview-reminders': 'calendar',
  'candidate-nurture': 'mail',
  'client-followup': 'briefcase',
  'client-onboarding': 'clipboard',
  'reporting-automation': 'chart',
  'upsell-sequences': 'chart',
  'quote-reminders': 'doc',
  'abandoned-quote-followup': 'refresh',
  'maintenance-reminders': 'gear',
  'referral-campaigns': 'home',
  'seai-grant-automation': 'doc',
  'battery-upsell-automation': 'battery',
  'survey-qualification': 'eye',
  'counter-offer-shield': 'shield',
  'contract-compliance-pack': 'clipboard',
  'churn-early-warning': 'alert',
  'scope-creep-guard': 'scale',
};

/** workflow node id → icon name */
const NODE_ICONS = {
  lead: 'target',
  capture: 'phone',
  speed: 'bolt',
  crm: 'funnel',
  qualify: 'eye',
  outreach: 'mail',
  follow: 'refresh',
  interview: 'calendar',
  client: 'briefcase',
  proposal: 'doc',
  quote: 'doc',
  book: 'calendar',
  survey: 'home',
  'survey-qualify': 'eye',
  battery: 'battery',
  grant: 'doc',
  chase: 'refresh',
  install: 'gear',
  review: 'star',
  maintain: 'gear',
  refer: 'users',
  onboard: 'clipboard',
  delivery: 'gear',
  report: 'chart',
  upsell: 'chart',
  reactivate: 'refresh',
  placement: 'star',
  'counter-offer': 'shield',
  compliance: 'clipboard',
  scope: 'scale',
  churn: 'alert',
  deliver: 'gear',
};

export function iconSvg(name) {
  const d = PATHS[name] || PATHS.bolt;
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
}

/**
 * deXevel gradient-stroke icon (matches main site iconography).
 * Teal → green gradient stroke, heavier weight — used for feature tiles.
 */
export function gradientIconSvg(name, id = 'dxg') {
  const d = PATHS[name] || PATHS.bolt;
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="url(#${id})" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#00CAB1"/><stop offset="1" stop-color="#0FDB7E"/></linearGradient></defs><path d="${d}"/></svg>`;
}

let __gradSeq = 0;
export function automationIconGradient(automationId) {
  __gradSeq += 1;
  return gradientIconSvg(AUTOMATION_ICONS[automationId] || 'bolt', `dxg-a-${__gradSeq}`);
}

export function nodeIconGradient(nodeId) {
  __gradSeq += 1;
  return gradientIconSvg(NODE_ICONS[nodeId] || 'bolt', `dxg-n-${__gradSeq}`);
}

export function automationIcon(automationId) {
  return iconSvg(AUTOMATION_ICONS[automationId] || 'bolt');
}

export function nodeIcon(nodeId) {
  return iconSvg(NODE_ICONS[nodeId] || 'bolt');
}

export function categoryIcon(category) {
  switch (category) {
    case 'revenue': return iconSvg('chart');
    case 'growth': return iconSvg('users');
    case 'ops': return iconSvg('gear');
    case 'foundation': return iconSvg('funnel');
    default: return iconSvg('bolt');
  }
}
