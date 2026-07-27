import test from 'node:test';
import assert from 'node:assert/strict';
import { scrollToAssessment } from '../js/app.js';

test('anchors wizard navigation to the assessment mount', () => {
  const calls = [];
  scrollToAssessment({
    scrollIntoView(options) {
      calls.push(options);
    },
  });

  assert.deepEqual(calls, [{ behavior: 'smooth', block: 'start' }]);
});

test('does not throw when an assessment mount is unavailable', () => {
  assert.doesNotThrow(() => scrollToAssessment(null));
});
