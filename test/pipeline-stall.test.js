import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStageThroughput,
  findBottleneck,
  PIPELINES,
  bottleneckCallout,
} from '../js/pipeline-stall.js';
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

describe('pipeline-stall', () => {
  it('every industry has a 5-stage pipeline', () => {
    for (const [id, stages] of Object.entries(PIPELINES)) {
      assert.equal(stages.length, 5, `${id} should have 5 stages`);
      assert.equal(stages[0].throughput, 1.0, 'first stage full flow');
      assert.equal(stages[4].throughput, 1.0, 'last stage full flow');
    }
  });

  it('computeStageThroughput returns rates between 0.05 and 1.0', () => {
    const { throughput, stages, bottleneck } = computeStageThroughput(sample, 'solar');
    assert.ok(stages.length === 5);
    for (const stage of stages) {
      const r = throughput[stage.id];
      assert.ok(r >= 0.05 && r <= 1.0, `${stage.id} rate ${r} out of range`);
    }
    assert.ok(bottleneck.stage, 'bottleneck identified');
    assert.ok(bottleneck.rate < 1.0, 'bottleneck has reduced throughput');
  });

  it('slow response kills the qualify stage', () => {
    const slow = computeStageThroughput(
      { ...sample, responseTime: 'slower' },
      'solar'
    );
    const fast = computeStageThroughput(
      { ...sample, responseTime: 'minutes' },
      'solar'
    );
    assert.ok(
      slow.throughput['qualify'] < fast.throughput['qualify'],
      'slow response should reduce qualify throughput'
    );
  });

  it('manual proposals slow the quote stage', () => {
    const manual = computeStageThroughput(
      { ...sample, proposals: 'manual-docs' },
      'solar'
    );
    const tracked = computeStageThroughput(
      { ...sample, proposals: 'tracked' },
      'solar'
    );
    assert.ok(
      manual.throughput['quote'] < tracked.throughput['quote'],
      'manual proposals should reduce quote throughput'
    );
  });

  it('findBottleneck returns the lowest-throughput internal stage', () => {
    const { throughput, stages } = computeStageThroughput(sample, 'solar');
    const bn = findBottleneck(throughput, stages);
    const internals = stages.filter((s) => s.throughput === null);
    let minRate = 1.0;
    let minStage = internals[0];
    for (const s of internals) {
      if (throughput[s.id] < minRate) {
        minRate = throughput[s.id];
        minStage = s;
      }
    }
    assert.equal(bn.stage.id, minStage.id, 'bottleneck should be lowest-throughput stage');
  });

  it('bottleneckCallout names the stage and computes pile-up value', () => {
    const pipelineResult = computeStageThroughput(sample, 'solar');
    const callout = bottleneckCallout(report, pipelineResult);
    assert.ok(callout.stageLabel, 'has stage label');
    assert.ok(callout.leakedPerMonth > 0, 'leaked leads per month > 0');
    assert.ok(callout.annualValueWaiting > 0, 'annual value waiting > 0');
    assert.match(callout.callout, /pipeline stalls at/, 'callout names the stall point');
    assert.match(callout.callout, /\/yr/, 'callout includes annual value');
  });

  it('uses the general pipeline for unknown industries', () => {
    const { stages } = computeStageThroughput(sample, 'nonexistent-industry');
    assert.equal(stages[0].id, 'lead-in', 'falls back to general');
  });

  it('different industries produce different stage labels', () => {
    const solar = computeStageThroughput(sample, 'solar');
    const rec = computeStageThroughput(
      { ...sample, industry: 'recruitment' },
      'recruitment'
    );
    assert.notEqual(solar.stages[1].id, rec.stages[1].id, 'solar vs recruitment differ');
  });
});
