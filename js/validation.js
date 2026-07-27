/**
 * Input validation for assessment answers.
 */

import { QUESTIONS, getQuestionByKey } from './data/questions.js';

/**
 * @param {string} key
 * @param {unknown} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateField(key, value) {
  const q = getQuestionByKey(key);
  if (!q) return { valid: false, error: `Unknown field: ${key}` };

  if (q.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${q.label} is required` };
  }

  if (value === undefined || value === null || value === '') {
    return { valid: true };
  }

  if (q.type === 'single') {
    const allowed = (q.options || []).map((o) => o.value);
    if (!allowed.includes(value)) {
      return { valid: false, error: `Invalid option for ${q.label}` };
    }
  }

  return { valid: true };
}

/**
 * Validate a partial answers object (e.g. current step).
 * @param {Record<string, unknown>} answers
 * @param {string[]} keys
 */
export function validateFields(answers, keys) {
  const errors = {};
  let ok = true;
  for (const key of keys) {
    const result = validateField(key, answers[key]);
    if (!result.valid) {
      ok = false;
      errors[key] = result.error;
    }
  }
  return { valid: ok, errors };
}

/**
 * Questions applicable given answers (industry-conditional filtering).
 * @param {Record<string, unknown>} answers
 */
export function applicableQuestions(answers = {}) {
  return QUESTIONS.filter((q) => {
    if (!q.industries) return true;
    return q.industries.includes(answers.industry || 'general');
  });
}

/**
 * Validate every required question is answered.
 * @param {Record<string, unknown>} answers
 */
export function validateAll(answers) {
  const keys = applicableQuestions(answers || {})
    .filter((q) => q.required)
    .map((q) => q.key);
  return validateFields(answers || {}, keys);
}

/**
 * Validate one wizard step.
 * @param {number} step
 * @param {Record<string, unknown>} answers
 */
export function validateStep(step, answers) {
  const keys = applicableQuestions(answers || {})
    .filter((q) => q.step === step)
    .map((q) => q.key);
  return validateFields(answers || {}, keys);
}
