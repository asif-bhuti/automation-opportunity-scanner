import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseUrlParams, canAutoGenerate, industryDefaults } from '../js/urlparams.js';

const FULL_URL =
  '?industry=solar&region=IE&employees=12&monthlyLeads=80&crm=spreadsheet&followup=manual' +
  '&nurtureChannels=ad-hoc&reviews=manual&proposals=manual&appointments=manual&adminHours=20' +
  '&conversionRate=15&avgDeal=30000&lostLeadsPct=35&database=500&reactivation=no' +
  '&bottleneck=response&wandFix=response&referrals=manual&auto=1';

describe('urlparams', () => {
  it('parses the full PRD example URL', () => {
    const { answers, autoGenerate, hasParams } = parseUrlParams(FULL_URL);
    assert.ok(hasParams, 'should detect params');
    assert.equal(autoGenerate, true, 'auto=1 → autoGenerate');
    assert.equal(answers.industry, 'solar');
    assert.equal(answers.region, 'ie', 'IE → ie');
    assert.equal(answers.employees, '6-15', '12 → 6-15 band');
    assert.equal(answers.monthlyLeads, '76-150', '80 → 76-150 band');
    assert.equal(answers.crm, 'spreadsheet');
    assert.equal(answers.followup, 'manual');
    assert.equal(answers.responseTime, undefined, 'responseTime not in this URL');
  });

  it('translates URL vocab to v1 internal option values', () => {
    const { answers } = parseUrlParams(
      '?industry=recruitment&region=NZ&responseTime=hours&crm=hubspot&followup=sequences&proposals=automated&reviews=manual&reactivation=automated&referrals=tool&bottleneck=followup&wandFix=admin'
    );
    assert.equal(answers.region, 'nz', 'NZ → nz');
    assert.equal(answers.responseTime, 'same-day', 'hours → same-day');
    assert.equal(answers.crm, 'basic', 'hubspot → basic');
    assert.equal(answers.followup, 'sequences');
    assert.equal(answers.proposals, 'tracked', 'automated → tracked');
    assert.equal(answers.reviews, 'ad-hoc', 'manual → ad-hoc');
    assert.equal(answers.reactivation, 'systematic', 'automated → systematic');
    assert.equal(answers.referrals, 'incentive', 'tool → incentive');
    assert.equal(answers.bottleneck, 'followup');
    assert.equal(answers.wandFix, 'ops', 'admin → ops');
  });

  it('routes "other" industry to general', () => {
    const { answers } = parseUrlParams('?industry=other');
    assert.equal(answers.industry, 'general');
  });

  it('maps deal value to band', () => {
    const { answers } = parseUrlParams('?avgDeal=30000');
    assert.equal(answers.avgDeal, '15k-50k');
  });

  it('maps conversion rate', () => {
    const { answers } = parseUrlParams('?conversionRate=15');
    assert.equal(answers.conversionRate, '11-20');
  });

  it('maps lost leads pct', () => {
    const { answers } = parseUrlParams('?lostLeadsPct=50');
    assert.equal(answers.lostLeadsPct, '41-60');
  });

  it('skips businessModel when industry is not solar', () => {
    const { answers } = parseUrlParams('?industry=recruitment&businessModel=residential');
    assert.equal(answers.businessModel, undefined, 'solarOnly should skip');
  });

  it('includes businessModel when industry is solar', () => {
    const { answers } = parseUrlParams('?industry=solar&businessModel=commercial');
    assert.equal(answers.businessModel, 'franchisee', 'commercial → franchisee');
  });

  it('auto=0 or absent does not auto-generate', () => {
    assert.equal(parseUrlParams('?industry=solar&auto=0').autoGenerate, false);
    assert.equal(parseUrlParams('?industry=solar').autoGenerate, false);
  });

  it('rejects out-of-range numbers', () => {
    const { answers } = parseUrlParams('?employees=99999&adminHours=999&monthlyLeads=-5');
    assert.equal(answers.employees, undefined, 'out of range rejected');
    assert.equal(answers.adminHours, undefined);
    assert.equal(answers.monthlyLeads, undefined);
  });

  it('rejects invalid enum values', () => {
    const { answers } = parseUrlParams('?industry=healthcare');
    assert.equal(answers.industry, undefined, 'invalid industry rejected');
  });

  it('empty URL → no params', () => {
    const { answers, autoGenerate, hasParams } = parseUrlParams('');
    assert.equal(hasParams, false);
    assert.equal(autoGenerate, false);
    assert.equal(Object.keys(answers).length, 0);
  });

  it('canAutoGenerate requires industry + monthlyLeads + avgDeal', () => {
    assert.equal(canAutoGenerate({ industry: 'solar' }), false);
    assert.equal(canAutoGenerate({ industry: 'solar', monthlyLeads: '11-30' }), false);
    assert.equal(canAutoGenerate({ industry: 'solar', monthlyLeads: '11-30', avgDeal: '5k-15k' }), true);
  });

  it('industryDefaults fills all v1 answer keys', () => {
    const d = industryDefaults('solar');
    assert.equal(d.industry, 'solar');
    assert.ok(d.monthlyLeads, 'has monthlyLeads');
    assert.ok(d.avgDeal, 'has avgDeal');
    assert.ok(d.followup, 'has followup');
    assert.ok(d.responseTime, 'has responseTime');
    assert.ok(d.bottleneck, 'has bottleneck');
    assert.ok(Object.keys(d).length >= 20, 'fills most keys');
  });
});
