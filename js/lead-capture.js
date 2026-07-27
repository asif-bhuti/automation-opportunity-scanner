/**
 * Soft lead capture at PDF download.
 * Posts to Web3Forms free tier (250/mo). Never blocks PDF generation.
 *
 * Set window.ILM_WEB3FORMS_KEY or <body data-web3forms-key="..."> to enable.
 * Without a key, still downloads the PDF and logs a console warning.
 */

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

export function getWeb3FormsKey() {
  if (typeof window !== 'undefined' && window.ILM_WEB3FORMS_KEY) {
    return String(window.ILM_WEB3FORMS_KEY).trim();
  }
  if (typeof document !== 'undefined' && document.body?.dataset?.web3formsKey) {
    return String(document.body.dataset.web3formsKey).trim();
  }
  return '';
}

/**
 * Validate gate fields.
 * @param {{ name?: string, company?: string, email?: string }} fields
 */
export function validateLeadGate(fields = {}) {
  const errors = {};
  const name = String(fields.name || '').trim();
  const company = String(fields.company || '').trim();
  const email = String(fields.email || '').trim();

  if (!name) errors.name = 'Name is required';
  if (!company) errors.company = 'Company is required';
  if (!email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';

  return { valid: Object.keys(errors).length === 0, errors, values: { name, company, email } };
}

/**
 * Build submission payload from report + gate fields.
 */
export function buildLeadPayload(report, fields, accessKey) {
  const s = report?.summary || {};
  const top = report?.topLeak || report?.leak?.categories?.[0] || {};
  return {
    access_key: accessKey,
    subject: `Scanner lead: ${fields.company} — ${s.topLeakLabel || top.label || 'report'}`,
    from_name: 'deXevel Automation Scanner',
    name: fields.name,
    company: fields.company,
    email: fields.email,
    industry: report?.industry?.id || report?.answers?.industry || '',
    region: report?.answers?.region || report?.leak?.region || '',
    maturity_score: s.maturityScore ?? '',
    top_leak: s.topLeakLabel || top.label || '',
    top_leak_annual: s.topLeakAnnual ?? top.annual ?? '',
    recoverable_annual: s.recoverableAnnual ?? '',
    wand_fix: s.wandFix || report?.answers?.wandFix || '',
    wand_fix_label: s.wandFixLabel || '',
    bottleneck: report?.answers?.bottleneck || '',
    lead_source: report?.answers?.leadSource || '',
    currency: report?.currency || '',
    generated_at: report?.generatedAt || new Date().toISOString(),
    page_url: typeof location !== 'undefined' ? location.href : '',
    botcheck: '',
  };
}

/**
 * Fire-and-forget submit. Resolves even on network failure so PDF is never blocked.
 * @returns {Promise<{ ok: boolean, skipped?: boolean, status?: number, error?: string }>}
 */
export async function submitLeadCapture(report, fields) {
  const key = getWeb3FormsKey();
  if (!key) {
    return { ok: false, skipped: true, error: 'No Web3Forms access key configured' };
  }

  const payload = buildLeadPayload(report, fields, key);

  try {
    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      return {
        ok: false,
        status: res.status,
        error: data.message || `Submit failed (${res.status})`,
      };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}
