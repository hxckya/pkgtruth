import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mutations } from '../scripts/mutations-pypi.mjs';

test('reproduces the documented PyPI confusables', () => {
  assert.ok(mutations('scikit-learn').includes('sklearn'));
  assert.ok(mutations('torch').includes('pytorch'));
  assert.ok(mutations('beautifulsoup4').includes('beautifulsoup'));
  assert.ok(mutations('python-dateutil').includes('dateutil'));
  assert.ok(mutations('requests').includes('requestss'));
  assert.ok(mutations('pyyaml').includes('yaml'));
});

test('never proposes a PEP 503 spelling of the same project as a garbling', () => {
  // typing_extensions and typing-extensions are one project.
  assert.ok(!mutations('typing-extensions').includes('typing_extensions'));
  assert.ok(!mutations('typing-extensions').includes('typing-extensions'));
});

test('never emits a famous name', () => {
  const known = new Set(['requests', 'urllib3', 'python-dateutil']);
  assert.ok(!mutations('request', known).includes('requests'));
  assert.ok(!mutations('dateutil', known).includes('python-dateutil'));
});

test('emits only valid normalised names', () => {
  for (const seed of ['requests', 'scikit-learn', 'pyyaml', 'beautifulsoup4'])
    for (const c of mutations(seed)) assert.match(c, /^[a-z0-9][a-z0-9-]*$/);
});
