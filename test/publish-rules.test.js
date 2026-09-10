import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNoticeBacked, isPlaceholder } from '../scripts/publish-rules.mjs';

const hit = (o) => ({ name: 'x', signals: [], pointsTo: null, ...o });

test('a parsed "use X instead" that names the seed clears the bar', () => {
  assert.ok(isNoticeBacked(hit({ name: 'sklearn', pointsTo: 'scikit-learn' }), 'scikit-learn'));
});

test('naming the detector-matched twin also clears it', () => {
  const h = hit({ name: 'socket-io', pointsTo: 'socket.io', signals: [{ id: 'impersonates_popular_package', severity: 'critical', detail: 'Package is 1 edit(s) from "socket.io", which has 17,995,724 weekly downloads' }] });
  assert.ok(isNoticeBacked(h, 'socket.io'));
});

test('a fork whose text merely mentions the seed does not', () => {
  // redis3: "use the version 3.xx of redis is import redis" — no replacement parsed.
  assert.ok(!isNoticeBacked(hit({ name: 'redis3', pointsTo: null, signals: [{ id: 'deprecated', severity: 'high', detail: 'Normally, use the version 3.xx of redis is import redis' }] }), 'redis'));
});

test('pointing at some unrelated package does not', () => {
  assert.ok(!isNoticeBacked(hit({ name: 'foo', pointsTo: 'bar' }), 'baz'));
});

test('PEP 503 spellings compare equal on PyPI only', () => {
  assert.ok(isNoticeBacked(hit({ name: 'x', pointsTo: 'typing_extensions' }), 'typing-extensions', 'pypi'));
  // On npm, socket-io and socket.io are different packages — a notice on the
  // former pointing at the latter must count, not be read as self-reference.
  assert.ok(isNoticeBacked(hit({ name: 'socket-io', pointsTo: 'socket.io' }), 'socket.io', 'npm'));
});

test('placeholder detection keys on the npm signal only', () => {
  assert.ok(isPlaceholder(hit({ signals: [{ id: 'npm_security_placeholder' }] })));
  assert.ok(!isPlaceholder(hit({ signals: [{ id: 'deprecated' }] })));
});
