import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRevenueLeak,
  formatMoney,
  buildAnchors,
  weeklyFromAnnual,
} from '../js/calculations.js';

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
};

describe('calculations', () => {
  it('computes positive annual leak', () => {
    const r = calculateRevenueLeak(sample);
    assert.ok(r.totalAnnualLeak > 0);
    assert.ok(r.annualRevenueLeak > 0);
    assert.ok(r.annualAdminCost > 0);
    assert.ok(r.recoverableAnnual > 0);
    assert.ok(r.recoverableAnnual <= r.totalAnnualLeak);
  });

  it('categories sum conceptually to major leak buckets', () => {
    const r = calculateRevenueLeak(sample);
    assert.ok(r.categories.length >= 4);
    const sum = r.categories.reduce((s, c) => s + c.annual, 0);
    assert.equal(sum, r.totalAnnualLeak);
  });

  it('reduces follow-up leak when sequences exist', () => {
    const manual = calculateRevenueLeak({ ...sample, followup: 'none' });
    const auto = calculateRevenueLeak({ ...sample, followup: 'sequences' });
    assert.ok(auto.annualFollowupLeak < manual.annualFollowupLeak);
  });

  it('formats GBP', () => {
    assert.match(formatMoney(142000), /142,000|£142/);
  });

  it('includes weekly framing and anchors', () => {
    const r = calculateRevenueLeak(sample);
    assert.equal(r.totalWeeklyLeak, weeklyFromAnnual(r.totalAnnualLeak));
    assert.ok(Array.isArray(r.anchors));
    assert.ok(r.anchors.length >= 2);
    assert.ok(r.anchors.some((a) => a.id === 'weekly'));
    const money = (n) => formatMoney(n, r.currency, r.locale);
    const weeklyCopy = r.anchors.find((a) => a.id === 'weekly').copy(money);
    assert.match(weeklyCopy, /every week/i);
  });

  it('50k+ deal band produces larger leak than 15k-50k mid band', () => {
    const base = { ...sample, monthlyLeads: '76-150', lostLeadsPct: '26-40', conversionRate: '11-20' };
    const mid = calculateRevenueLeak({ ...base, avgDeal: '15k-50k' });
    const high = calculateRevenueLeak({ ...base, avgDeal: '50k+' });
    assert.ok(high.totalAnnualLeak > mid.totalAnnualLeak);
    assert.ok(high.avgDeal > mid.avgDeal);
  });

  it('buildAnchors picks dramatic translations', () => {
    const anchors = buildAnchors({
      totalAnnualLeak: 52000,
      recoverableAnnual: 20000,
      avgDeal: 2500,
      estimatedAnnualRevenue: 200000,
      hourlyWage: 40,
    });
    assert.ok(anchors.some((a) => a.id === 'weekly'));
    assert.ok(anchors.length >= 2 && anchors.length <= 3);
  });
});
