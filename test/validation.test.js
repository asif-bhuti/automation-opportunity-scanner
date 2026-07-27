import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateField, validateStep, validateAll } from '../js/validation.js';
import { totalSteps, getQuestionByKey } from '../js/data/questions.js';

describe('validation', () => {
  it('rejects missing required field', () => {
    const r = validateField('industry', '');
    assert.equal(r.valid, false);
    assert.match(r.error, /required/i);
  });

  it('accepts valid option', () => {
    const r = validateField('industry', 'solar');
    assert.equal(r.valid, true);
  });

  it('rejects invalid option', () => {
    const r = validateField('crm', 'not-a-crm');
    assert.equal(r.valid, false);
  });

  it('validates a full step', () => {
    const bad = validateStep(1, {});
    assert.equal(bad.valid, false);
    assert.ok(bad.errors.industry);
    assert.ok(bad.errors.employees);
    assert.ok(bad.errors.region);

    const good = validateStep(1, { industry: 'recruitment', employees: '6-15', region: 'uk' });
    assert.equal(good.valid, true);
  });

  it('validateAll fails until complete', () => {
    const r = validateAll({ industry: 'general' });
    assert.equal(r.valid, false);
  });

  it('knows nurtureChannels and wandFix', () => {
    assert.ok(getQuestionByKey('nurtureChannels'));
    assert.ok(getQuestionByKey('wandFix'));
    assert.equal(getQuestionByKey('email'), null);
    assert.equal(getQuestionByKey('sms'), null);
    assert.equal(totalSteps(), 8);
  });

  it('accepts split deal bands', () => {
    assert.equal(validateField('avgDeal', '15k-50k').valid, true);
    assert.equal(validateField('avgDeal', '50k+').valid, true);
    assert.equal(validateField('avgDeal', '15k+').valid, false);
  });
});
