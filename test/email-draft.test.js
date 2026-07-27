import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateInternalEmail, copyToClipboard } from '../js/email-draft.js';
import { generateReport } from '../js/report.js';

const sample = {
  industry: 'solar',
  region: 'uk',
  monthlyLeads: '31-75',
  conversionRate: '11-20',
  avgDeal: '5k-15k',
  lostLeadsPct: '26-40',
  adminHours: '16-30',
  followup: 'manual',
  responseTime: '1-2-days',
  referrals: 'none',
  database: 'medium',
  reactivation: 'never',
  crm: 'spreadsheet',
  website: 'brochure',
  nurtureChannels: 'ad-hoc',
  reviews: 'ad-hoc',
  proposals: 'templates',
  appointments: 'link',
  bottleneck: 'speed',
  wandFix: 'followup',
  employees: '6-15',
  leadSource: 'mixed',
};

const report = generateReport(sample);

describe('email-draft', () => {
  it('generates a subject with the leak figure', () => {
    const { subject } = generateInternalEmail(report, sample);
    assert.match(subject, /revenue leakage/i);
    assert.match(subject, /\/yr/, 'subject includes /yr');
    assert.match(subject, /worth 15 min/i);
  });

  it('generates a first-person body', () => {
    const { body } = generateInternalEmail(report, sample);
    assert.match(body, /Hi \[Name\]/, 'starts with placeholder greeting');
    assert.match(body, /I ran an automation diagnostic/i, 'first-person framing');
    assert.match(body, /Revenue leakage:/i, 'includes leak figure');
    assert.match(body, /Automation maturity:/i, 'includes maturity');
    assert.match(body, /Recoverable:/i, 'includes recoverable');
    assert.match(body, /cal\.com\/dexevel\/15min/, 'includes booking link');
    assert.match(body, /\[Your name\]/, 'ends with name placeholder');
  });

  it('includes the top recommendation', () => {
    const { body } = generateInternalEmail(report, sample);
    const topRec = report.recommendations[0];
    assert.ok(topRec, 'report has a top rec');
    assert.match(body, new RegExp(topRec.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'mentions top rec by name');
  });

  it('does not include deXevel branding in the body', () => {
    const { body } = generateInternalEmail(report, sample);
    // The only deXevel mention should be the cal.com link, not "deXevel says" or "deXevel recommends"
    assert.doesNotMatch(body, /deXevel recommends/i);
    assert.doesNotMatch(body, /deXevel found/i);
  });

  it('handles a report with no recommendations gracefully', () => {
    const { body } = generateInternalEmail(
      { ...report, recommendations: [] },
      sample
    );
    assert.match(body, /ranks the top fixes/i, 'falls back gracefully');
  });

  it('localises currency to region', () => {
    const ieReport = generateReport({ ...sample, region: 'ie' });
    const { body } = generateInternalEmail(ieReport, { ...sample, region: 'ie' });
    assert.match(body, /€/, 'IE region should use euro');
  });

  it('copyToClipboard returns false without a browser', () => {
    // In Node test env, navigator is undefined
    const result = copyToClipboard('test');
    // It returns a promise — resolve and check
    return Promise.resolve(result).then((ok) => {
      assert.equal(ok, false, 'should fail gracefully without browser');
    });
  });
});
