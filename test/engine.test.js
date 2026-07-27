import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildTriggers, recommendAutomations, buildRoadmap } from '../js/engine.js';
import { scoreAnswers } from '../js/scoring.js';
import { calculateRevenueLeak } from '../js/calculations.js';
import { buildWorkflow } from '../js/workflow.js';
import { generateReport } from '../js/report.js';
import { totalSteps } from '../js/data/questions.js';
import { pickFreeFix } from '../js/data/free-fixes.js';
import { validateLeadGate, buildLeadPayload } from '../js/lead-capture.js';

const recruitmentWeak = {
  industry: 'recruitment',
  region: 'uk',
  employees: '6-15',
  monthlyLeads: '31-75',
  leadSource: 'partners',
  crm: 'spreadsheet',
  website: 'forms',
  responseTime: 'same-day',
  followup: 'manual',
  nurtureChannels: 'ad-hoc',
  reviews: 'never',
  proposals: 'templates',
  appointments: 'manual',
  adminHours: '16-30',
  conversionRate: '11-20',
  avgDeal: '2k-5k',
  lostLeadsPct: '26-40',
  database: 'large',
  reactivation: 'never',
  bottleneck: 'followup',
  wandFix: 'followup',
  referrals: 'none',
};

describe('engine', () => {
  it('builds expected triggers from nurtureChannels', () => {
    const t = buildTriggers({
      crm: 'none',
      followup: 'manual',
      reviews: 'never',
      nurtureChannels: 'no',
      website: 'brochure',
      monthlyLeadsNumeric: 100,
      adminHoursNumeric: 40,
      database: 'medium',
      reactivation: 'never',
      referrals: 'none',
      proposals: 'manual-docs',
      appointments: 'manual',
      responseTime: 'slower',
    });
    assert.equal(t.noCrm, true);
    assert.equal(t.manualFollowup, true);
    assert.equal(t.noReviews, true);
    assert.equal(t.highLeadVolume, true);
    assert.equal(t.hasDatabase, true);
    assert.equal(t.noReactivation, true);
    assert.equal(t.noSms, true);
    assert.equal(t.weakNurture, true);
  });

  it('recommends recruitment automations for weak rec answers', () => {
    const scoring = scoreAnswers(recruitmentWeak);
    const leak = calculateRevenueLeak(recruitmentWeak);
    const recs = recommendAutomations(recruitmentWeak, scoring, leak, 7);
    assert.ok(recs.length >= 5);
    const ids = recs.map((r) => r.id);
    assert.ok(
      ids.includes('ats-reactivation') || ids.includes('followup-automation'),
      `expected core recs, got ${ids.join(',')}`
    );
    assert.equal(recs[0].rank, 1);
    assert.ok(recs[0].estimatedAnnualValue > 0);
  });

  it('builds 90-day roadmap buckets', () => {
    const scoring = scoreAnswers(recruitmentWeak);
    const leak = calculateRevenueLeak(recruitmentWeak);
    const recs = recommendAutomations(recruitmentWeak, scoring, leak, 7);
    const road = buildRoadmap(recs);
    assert.ok(road.days0to30.length >= 1);
    assert.ok(Array.isArray(road.days31to60));
    assert.ok(Array.isArray(road.days61to90));
    assert.equal(road.days0to30[0].phase, 'Foundation');
    assert.ok(road.days0to30[0].objective);
    assert.ok(road.days0to30[0].timelineLabel);
  });
});

describe('workflow', () => {
  it('returns industry-specific nodes and edges', () => {
    const wf = buildWorkflow('solar', recruitmentWeak, [{ id: 'quote-reminders' }]);
    assert.ok(wf.nodes.length >= 6);
    assert.ok(wf.edges.length >= 5);
    assert.match(wf.title, /solar/i);
  });

  it('marks gaps on weak CRM', () => {
    const wf = buildWorkflow('general', { crm: 'none', website: 'brochure' }, [
      { id: 'crm-pipeline' },
    ]);
    const crm = wf.nodes.find((n) => n.id === 'crm');
    assert.ok(crm);
    assert.ok(['gap', 'opportunity'].includes(crm.status));
  });
});

describe('report', () => {
  it('generates a full narrative summary with v2 extras', () => {
    const report = generateReport(recruitmentWeak);
    assert.equal(report.industry.id, 'recruitment');
    assert.ok(report.scoring.maturityScore >= 0);
    assert.ok(report.leak.totalAnnualLeak > 0);
    assert.ok(report.leak.totalWeeklyLeak > 0);
    assert.ok(report.recommendations.length >= 3);
    assert.ok(report.workflow.nodes.length > 0);
    assert.ok(report.headline.maturityLine.includes('/100'));
    assert.equal(report.summary.automationCount, report.recommendations.length);
    assert.ok(report.freeFix, 'expected free fix template');
    assert.ok(report.topLeak, 'expected top leak');
    assert.ok(report.narratives.callouts.length >= 1);
    assert.ok(report.narratives.anchors.length >= 2);
    assert.equal(report.summary.wandFix, 'followup');
  });

  it('surfaces conversion-unsure callout', () => {
    const report = generateReport({ ...recruitmentWeak, conversionRate: 'unsure' });
    assert.ok(report.narratives.callouts.some((c) => c.id === 'conversion-unsure'));
  });

  it('wires leadSource into narrative', () => {
    const report = generateReport({ ...recruitmentWeak, leadSource: 'paid' });
    const src = report.narratives.callouts.find((c) => c.id === 'lead-source');
    assert.ok(src);
    assert.match(src.body, /paying for every lead/i);
  });
});

describe('question bank v2', () => {
  it('is 8 steps', () => {
    assert.equal(totalSteps(), 8);
  });

  it('picks free fix by industry + top leak', () => {
    const fix = pickFreeFix('solar', 'lost-leads');
    assert.ok(fix);
    assert.equal(fix.industry, 'solar');
    assert.ok(fix.messages.length >= 3);
  });
});

describe('lead gate', () => {
  it('validates required fields', () => {
    const bad = validateLeadGate({ name: '', company: '', email: 'nope' });
    assert.equal(bad.valid, false);
    assert.ok(bad.errors.email);
    const good = validateLeadGate({
      name: 'Asif',
      company: 'deXevel',
      email: 'asif@dexevel.com',
    });
    assert.equal(good.valid, true);
  });

  it('builds payload with wand + top leak', () => {
    const report = generateReport(recruitmentWeak);
    const payload = buildLeadPayload(
      report,
      { name: 'A', company: 'Co', email: 'a@b.co' },
      'test-key'
    );
    assert.equal(payload.access_key, 'test-key');
    assert.equal(payload.wand_fix, 'followup');
    assert.ok(payload.top_leak);
    assert.equal(payload.industry, 'recruitment');
  });
});
