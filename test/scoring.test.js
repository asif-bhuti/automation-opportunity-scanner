import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreAnswers, maturityBand } from '../js/scoring.js';

const weak = {
  industry: 'recruitment',
  employees: '2-5',
  monthlyLeads: '31-75',
  leadSource: 'mixed',
  crm: 'none',
  website: 'brochure',
  responseTime: 'slower',
  followup: 'manual',
  nurtureChannels: 'ad-hoc',
  reviews: 'never',
  proposals: 'manual-docs',
  appointments: 'manual',
  adminHours: '31-50',
  conversionRate: '5-10',
  avgDeal: '2k-5k',
  lostLeadsPct: '41-60',
  database: 'medium',
  reactivation: 'never',
  bottleneck: 'followup',
  wandFix: 'followup',
  referrals: 'none',
};

const strong = {
  industry: 'marketing',
  employees: '16-50',
  monthlyLeads: '76-150',
  leadSource: 'inbound',
  crm: 'full',
  website: 'strong',
  responseTime: 'minutes',
  followup: 'sequences',
  nurtureChannels: 'automated',
  reviews: 'automated',
  proposals: 'tracked',
  appointments: 'full',
  adminHours: '0-5',
  conversionRate: '21-35',
  avgDeal: '5k-15k',
  lostLeadsPct: 'under-10',
  database: 'large',
  reactivation: 'systematic',
  bottleneck: 'leads',
  wandFix: 'leads',
  referrals: 'automated',
};

describe('scoring', () => {
  it('scores weak answers with low maturity', () => {
    const s = scoreAnswers(weak);
    assert.ok(s.maturityScore < 40, `expected low maturity, got ${s.maturityScore}`);
    assert.ok(s.opportunityScore > 60);
    assert.ok(s.gaps.length >= 8);
    assert.equal(typeof s.bandLabel, 'string');
  });

  it('scores strong answers with high maturity', () => {
    const s = scoreAnswers(strong);
    assert.ok(s.maturityScore >= 75, `expected high maturity, got ${s.maturityScore}`);
    assert.ok(s.opportunityScore <= 25);
  });

  it('adds CRM gap points for no CRM', () => {
    const s = scoreAnswers({ ...strong, crm: 'none' });
    assert.ok(s.gaps.some((g) => g.id === 'no-crm'));
  });

  it('maps nurtureChannel gaps', () => {
    const none = scoreAnswers({ ...strong, nurtureChannels: 'no' });
    assert.ok(none.gaps.some((g) => g.id === 'no-nurture'));
    const adhoc = scoreAnswers({ ...strong, nurtureChannels: 'ad-hoc' });
    assert.ok(adhoc.gaps.some((g) => g.id === 'weak-nurture'));
  });

  it('maps bands correctly', () => {
    assert.equal(maturityBand(80).id, 'advanced');
    assert.equal(maturityBand(60).id, 'developing');
    assert.equal(maturityBand(40).id, 'emerging');
    assert.equal(maturityBand(20).id, 'manual');
  });
});
