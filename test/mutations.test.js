import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mutations } from '../scripts/mutations.mjs';

// Each case is a real incident the weekly report exists to catch. If a
// refactor stops producing one of these names, the report goes quietly blind.
test('reproduces the documented slopsquat names', () => {
  assert.ok(mutations('@types/node').includes('types-node'));
  assert.ok(mutations('socket.io').includes('socket-io'));
  assert.ok(mutations('cross-env').includes('crossenv'));
  assert.ok(mutations('eslint-plugin-unused-imports').includes('unused-imports'));
  assert.ok(mutations('@supabase/supabase-js').includes('supabase-js'));
  assert.ok(mutations('nodemailer').includes('nodemailer-js'));
});

test('never emits the original or a famous name', () => {
  const known = new Set(['node-fetch', 'core']);
  assert.ok(!mutations('fetch', known).includes('node-fetch'));
  assert.ok(!mutations('@babel/core', known).includes('core'));
  assert.ok(!mutations('react').includes('react'));
});

test('emits only valid npm names', () => {
  for (const seed of ['@scope/x', 'a.b', 'a-b', 'plain'])
    for (const n of mutations(seed)) assert.match(n, /^[a-z0-9][a-z0-9._-]*$/);
});
