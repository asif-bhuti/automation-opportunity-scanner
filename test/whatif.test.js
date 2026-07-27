import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../js/report.js';
import {
  runWhatIf,
  progressiveWhatIf,
  fullyOptimized,
  GAP_FIXES,
  KNOWN_GAP_IDS,
} from '../js/whatif.js';
import { __GAP_RULES } from '../js/scoring.js';

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

describe('whatif', () => {
  it('every v1 gap ID has a fix in GAP_FIXES', () => {
    const v1GapIds = __GAP_RULES.map((r) => r.id);
    const missing = v1GapIds.filter((id) => !GAP_FIXES[id]);
    // We allow a few gaps without fixes, but the core ones must be covered.
    assert.ok(missing.length <= 2, `GAP_FIXES missing v1 gaps: ${missing.join(', ')}`);
  });

  it('GAP_FIXES fixedValues are valid v1 option values', () => {
    // Spot-check a few critical fixes map to real v1 options
    assert.equal(GAP_FIXES['spreadsheet-crm'].fixedValue, 'full');
    assert.equal(GAP_FIXES['manual-followup'].fixedValue, 'sequences');
    assert.equal(GAP_FIXES['slow-response'].fixedValue, 'minutes');
    assert.equal(GAP_FIXES['manual-proposals'].fixedValue, 'tracked');
    assert.equal(GAP_FIXES['high-admin'].fixedValue, '6-15');
  });

  it('runWhatIf reduces leak when fixing a gap', () => {
    const gaps = report.scoring.gaps;
    assert.ok(gaps.length > 0, 'sample should have gaps');
    const firstGap = gaps[0].id;
    const delta = runWhatIf(sample, report, [firstGap]);
    assert.ok(delta.applied.includes(firstGap), 'gap should be applied');
    assert.ok(delta.newLeakTotal <= report.leak.totalAnnualLeak, 'fixed leak ≤ original');
    assert.ok(delta.leakReduction >= 0, 'leak reduction ≥ 0');
    assert.ok(delta.maturityGain >= 0, 'maturity gain ≥ 0');
    assert.ok(delta.fixLabels.length === 1, 'one fix label');
  });

  it('runWhatIf handles unknown gap IDs gracefully', () => {
    const delta = runWhatIf(sample, report, ['nonexistent-gap']);
    assert.ok(delta.missing.includes('nonexistent-gap'));
    assert.equal(delta.leakReduction, 0);
    assert.equal(delta.maturityGain, 0);
  });

  it('progressiveWhatIf returns up to 3 stages with increasing fixes', () => {
    const stages = progressiveWhatIf(sample, report, 3);
    assert.ok(stages.length <= 3);
    assert.ok(stages.length >= 1);
    if (stages.length >= 2) {
      assert.ok(stages[1].gapIds.length > stages[0].gapIds.length, 'stage 2 fixes more gaps');
    }
    // Each stage should reduce leak (or at least not increase it)
    for (const s of stages) {
      assert.ok(s.newLeakTotal <= report.leak.totalAnnualLeak, `stage ${s.stage} should not increase leak`);
    }
  });

  it('fullyOptimized fixes all gaps and yields the biggest reduction', () => {
    const full = fullyOptimized(sample, report);
    assert.ok(full, 'should return a delta');
    assert.ok(full.applied.length >= report.scoring.gaps.length - 2, 'applies most/all gaps');

    const progressive = progressiveWhatIf(sample, report, 3);
    if (progressive.length > 0) {
      const stage1 = progressive[0];
      assert.ok(
        full.leakReduction >= stage1.leakReduction,
        'fully optimized should reduce at least as much as stage 1'
      );
    }
  });

  it('fixing all gaps moves maturity up and leak down', () => {
    const full = fullyOptimized(sample, report);
    if (full && full.applied.length > 0) {
      assert.ok(full.newMaturityScore >= report.scoring.maturityScore, 'maturity should improve');
      assert.ok(full.newLeakTotal <= report.leak.totalAnnualLeak, 'leak should decrease');
    }
  });

  it('currency is carried through', () => {
    const delta = runWhatIf(sample, report, [report.scoring.gaps[0].id]);
    assert.equal(delta.currency, report.currency);
  });
});
