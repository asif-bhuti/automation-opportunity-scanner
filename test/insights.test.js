import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../js/report.js';
import { recommendAutomations } from '../js/engine.js';
import { scoreAnswers } from '../js/scoring.js';
import { calculateRevenueLeak, formatMoney } from '../js/calculations.js';
import { buildWorkflow } from '../js/workflow.js';
import { getInsightsFor, reportLevelInsights, insightForAutomation } from '../js/data/insights.js';

const solarIeFranchisee = {
  industry: 'solar',
  region: 'ie',
  employees: '6-15',
  monthlyLeads: '76-150',
  leadSource: 'partners',
  businessModel: 'franchisee',
  crm: 'spreadsheet',
  website: 'forms',
  responseTime: 'same-day',
  followup: 'manual',
  nurtureChannels: 'ad-hoc',
  reviews: 'ad-hoc',
  proposals: 'templates',
  appointments: 'manual',
  adminHours: '16-30',
  conversionRate: '11-20',
  avgDeal: '5k-15k',
  lostLeadsPct: '26-40',
  database: 'medium',
  reactivation: 'rare',
  bottleneck: 'speed',
  wandFix: 'followup',
  referrals: 'ask',
};

describe('insights: solar wow pack', () => {
  it('surfaces SEAI grant insight for IE solar', () => {
    const list = getInsightsFor('solar', solarIeFranchisee);
    const seai = list.find((i) => i.id === 'solar-seai-grant');
    assert.ok(seai, 'expected SEAI insight for IE solar');
    assert.match(seai.body, /MPRN/i);
  });

  it('hides SEAI insight for non-IE solar', () => {
    const uk = { ...solarIeFranchisee, region: 'uk' };
    const list = getInsightsFor('solar', uk);
    assert.equal(list.find((i) => i.id === 'solar-seai-grant'), undefined);
  });

  it('fires margin collapse alert at scale', () => {
    const alerts = reportLevelInsights('solar', solarIeFranchisee);
    const margin = alerts.find((a) => a.id === 'solar-margin-collapse');
    assert.ok(margin, 'expected margin collapse alert at 76-150 leads + high admin');
    assert.match(margin.body, /20 installs/i);
  });

  it('fires franchise speed-to-lead note for franchisees', () => {
    const alerts = reportLevelInsights('solar', solarIeFranchisee);
    const fr = alerts.find((a) => a.id === 'solar-franchise-speed');
    assert.ok(fr, 'expected franchise insight');
    assert.match(fr.body, /franchisor/i);
  });

  it('does not fire franchise note for independents', () => {
    const ind = { ...solarIeFranchisee, businessModel: 'independent' };
    const alerts = reportLevelInsights('solar', ind);
    assert.equal(alerts.find((a) => a.id === 'solar-franchise-speed'), undefined);
  });
});

describe('engine: solar-specific automations', () => {
  it('recommends grant + battery + survey automations for weak IE solar', () => {
    const scoring = scoreAnswers(solarIeFranchisee);
    const leak = calculateRevenueLeak(solarIeFranchisee);
    const recs = recommendAutomations(solarIeFranchisee, scoring, leak, 10);
    const ids = recs.map((r) => r.id);
    assert.ok(ids.includes('seai-grant-automation'), `missing grant automation: ${ids}`);
    assert.ok(ids.includes('battery-upsell-automation'), `missing battery automation: ${ids}`);
    assert.ok(ids.includes('survey-qualification'), `missing survey qualification: ${ids}`);
  });

  it('never recommends solar automations for other industries', () => {
    const rec = { ...solarIeFranchisee, industry: 'recruitment' };
    const scoring = scoreAnswers(rec);
    const leak = calculateRevenueLeak(rec);
    const recs = recommendAutomations(rec, scoring, leak, 10);
    const ids = recs.map((r) => r.id);
    assert.ok(!ids.includes('seai-grant-automation'));
    assert.ok(!ids.includes('battery-upsell-automation'));
  });
});

describe('report: currency localisation', () => {
  it('uses EUR for IE', () => {
    const report = generateReport(solarIeFranchisee);
    assert.equal(report.currency, 'EUR');
    assert.ok(report.headline.leakLine.includes('€'));
  });

  it('uses NZD for NZ', () => {
    const report = generateReport({ ...solarIeFranchisee, region: 'nz' });
    assert.equal(report.currency, 'NZD');
  });

  it('uses GBP for UK', () => {
    const report = generateReport({ ...solarIeFranchisee, region: 'uk' });
    assert.equal(report.currency, 'GBP');
  });

  it('formatMoney honours currency', () => {
    assert.match(formatMoney(8000, 'EUR', 'en-IE'), /€/);
    assert.match(formatMoney(8000, 'GBP', 'en-GB'), /£/);
  });
});

describe('report: insights attachment', () => {
  it('attaches market intel to recommendations and leak categories', () => {
    const report = generateReport(solarIeFranchisee);
    const withInsight = report.recommendations.filter((r) => r.insight);
    assert.ok(withInsight.length >= 2, 'expected at least 2 recommendations with intel');
    const catsWithInsight = report.leak.categories.filter((c) => c.insights && c.insights.length > 0);
    assert.ok(catsWithInsight.length >= 1, 'expected at least one leak category with intel');
  });

  it('includes report-level alerts in the report payload', () => {
    const report = generateReport(solarIeFranchisee);
    assert.ok(report.reportAlerts.length >= 2, 'expected margin + franchise alerts');
  });
});

describe('workflow: extended industry templates', () => {
  it('solar workflow includes grant, battery, survey-qualify nodes', () => {
    const wf = buildWorkflow('solar', solarIeFranchisee, [{ id: 'seai-grant-automation' }]);
    const ids = wf.nodes.map((n) => n.id);
    for (const id of ['survey-qualify', 'battery', 'grant']) {
      assert.ok(ids.includes(id), `missing node ${id}: ${ids}`);
    }
  });

  it('recruitment workflow includes counter-offer + compliance', () => {
    const wf = buildWorkflow('recruitment', {}, []);
    const ids = wf.nodes.map((n) => n.id);
    assert.ok(ids.includes('counter-offer'));
    assert.ok(ids.includes('compliance'));
  });

  it('marketing workflow includes churn + scope', () => {
    const wf = buildWorkflow('marketing', {}, []);
    const ids = wf.nodes.map((n) => n.id);
    assert.ok(ids.includes('churn'));
    assert.ok(ids.includes('scope'));
  });
});

describe('insights: recruitment & marketing packs', () => {
  it('recruitment intel attaches to ats-reactivation', () => {
    const ins = insightForAutomation('recruitment', 'ats-reactivation', {});
    assert.ok(ins);
    assert.match(ins.body, /ATS/);
  });

  it('marketing churn insight exists', () => {
    const ins = insightForAutomation('marketing', 'churn-early-warning', { followup: 'manual' });
    assert.ok(ins);
    assert.match(ins.body, /60 days/i);
  });
});
