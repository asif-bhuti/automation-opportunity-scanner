/* Hallmark · module: email-draft · PRD v3 §2.4
 * Internal email draft generator — "Forward to your MD/partner".
 *
 * Generates a first-person email the prospect can copy and send upstairs,
 * framing the revenue leak as their own discovery, not a vendor pitch.
 * No backend, no mailto: — just a textarea + navigator.clipboard.writeText().
 */

import { formatMoney } from './calculations.js';

/**
 * Generate the internal email { subject, body } from report data.
 * @param {object} report  v1 report object
 * @param {Record<string, unknown>} answers
 * @returns {{ subject: string, body: string }}
 */
export function generateInternalEmail(report, answers = {}) {
  const { leak, scoring, summary, recommendations } = report;
  const currency = report.currency || 'GBP';
  const locale = report.locale || 'en-GB';
  const money = (n) => formatMoney(n || 0, currency, locale);

  const topRec = recommendations?.[0] || null;
  const topLeakLabel = summary?.topLeakLabel || leak?.categories?.[0]?.label || 'revenue leakage';
  const topLeakAnnual = summary?.topLeakAnnual || leak?.categories?.[0]?.annual || 0;

  const subject = `Found ${money(leak.totalAnnualLeak)}/yr in revenue leakage — worth 15 min to review`;

  const recLine = topRec
    ? `${topRec.name} — ${topRec.estimatedAnnualValue ? money(topRec.estimatedAnnualValue) + '/yr value' : 'high impact'}, ${topRec.hoursSavedPerWeek || 0} hrs/wk saved, ${topRec.difficultyLabel || 'moderate'} difficulty.`
    : 'The report ranks the top fixes by ROI.';

  const body = `Hi [Name],

I ran an automation diagnostic on our business this morning. The results are worth a quick conversation.

Key findings:
- Revenue leakage: ${money(leak.totalAnnualLeak)}/yr (${money(leak.totalAnnualLeak / 52)}/wk)
- Biggest gap: ${topLeakLabel} — ${money(topLeakAnnual)}/yr
- Automation maturity: ${scoring.maturityScore}/100 (${scoring.bandLabel})
- Recoverable: ${money(leak.recoverableAnnual)}/yr

The #1 fix: ${recLine}

I've booked a free 15-minute audit call (worth £1000) to pressure-test these numbers. Here's the link if you want to join: https://cal.com/dexevel/15min

The full report is attached. Happy to walk through it.

[Your name]`;

  return { subject, body };
}

/**
 * Copy text to clipboard, with a fallback for non-secure contexts.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Build the email-draft DOM block (collapsed by default).
 * @param {object} report
 * @param {Record<string, unknown>} answers
 * @returns {Element|null}
 */
export function renderEmailDraftBlock(report, answers = {}) {
  if (typeof document === 'undefined') return null;
  const { subject, body } = generateInternalEmail(report, answers);
  const fullText = `Subject: ${subject}\n\n${body}`;

  const section = document.createElement('section');
  section.className = 'card section-sm email-draft slide-up';
  section.id = 'email-draft';

  const head = document.createElement('button');
  head.type = 'button';
  head.className = 'email-draft-toggle';
  head.setAttribute('aria-expanded', 'false');
  head.setAttribute('aria-controls', 'email-draft-body');

  const title = document.createElement('h3');
  title.textContent = 'Forward to your MD / partner';
  const sub = document.createElement('p');
  sub.className = 'muted';
  sub.textContent = 'Not the decision-maker? Send this upstairs. Editable — it reads as your discovery, not a sales pitch.';
  head.append(title, sub);
  section.append(head);

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'email-draft-body';
  bodyWrap.id = 'email-draft-body';
  bodyWrap.hidden = true;

  const ta = document.createElement('textarea');
  ta.className = 'email-draft-textarea';
  ta.rows = 16;
  ta.setAttribute('aria-label', 'Internal email draft — editable');
  ta.value = fullText;
  bodyWrap.append(ta);

  const actions = document.createElement('div');
  actions.className = 'email-draft-actions';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'btn btn-primary';
  copyBtn.textContent = 'Copy to clipboard';

  const status = document.createElement('span');
  status.className = 'email-draft-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;

  copyBtn.addEventListener('click', async () => {
    const ok = await copyToClipboard(ta.value);
    status.hidden = false;
    status.textContent = ok ? 'Copied — paste into your email client.' : 'Copy failed — select the text manually.';
    if (ok) {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy to clipboard'; }, 2000);
    }
  });

  actions.append(copyBtn, status);
  bodyWrap.append(actions);
  section.append(bodyWrap);

  head.addEventListener('click', () => {
    const open = bodyWrap.hidden;
    bodyWrap.hidden = !open;
    head.setAttribute('aria-expanded', String(open));
  });

  return section;
}
