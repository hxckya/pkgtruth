import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editDistance, inspectPackage } from '../src/detect.js';

test('editDistance: identical and simple typos', () => {
  assert.equal(editDistance('express', 'express'), 0);
  assert.equal(editDistance('expres', 'express'), 1);
  assert.equal(editDistance('lodash', 'lodahs'), 2);
});

test('editDistance: bails out past the cap instead of scanning', () => {
  assert.ok(editDistance('a'.repeat(40), 'b'.repeat(40), 4) > 4);
});

// Network-backed. Guarded so CI without egress skips rather than fails.
const online = process.env.PKGTRUTH_TEST_ONLINE === '1';

test('known-good package is not flagged', { skip: !online }, async () => {
  const r = await inspectPackage('express');
  assert.equal(r.verdict, 'SAFE');
});

test('nonexistent package is reported as hallucinated', { skip: !online }, async () => {
  const r = await inspectPackage('reqeusts-http-client');
  assert.equal(r.verdict, 'HALLUCINATED');
  assert.equal(r.exists, false);
});

// Regression: this exact package is the documented slopsquat from the
// Cloud Security Alliance write-up. An early build scored it SAFE because
// the impersonation check discarded distance-0 core-name collisions.
test('documented slopsquat `unused-imports` is caught', { skip: !online }, async () => {
  const r = await inspectPackage('unused-imports');
  assert.equal(r.verdict, 'DANGER');
  assert.ok(r.signals.some((s) => s.id === 'impersonates_popular_package'));
});

test('the legitimate twin is NOT flagged', { skip: !online }, async () => {
  const r = await inspectPackage('eslint-plugin-unused-imports');
  assert.equal(r.verdict, 'SAFE');
});
