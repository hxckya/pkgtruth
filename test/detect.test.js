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

// Regression: an early build let a rate-limited downloads API silently
// weaken a verdict. A check that could not run must never read as SAFE.
test('unreachable downloads API yields UNKNOWN, never SAFE', async () => {
  const prev = { api: process.env.PKGTRUTH_DOWNLOADS_API, retries: process.env.PKGTRUTH_RETRIES, timeout: process.env.PKGTRUTH_TIMEOUT_MS, disk: process.env.PKGTRUTH_NO_DISK_CACHE };
  process.env.PKGTRUTH_DOWNLOADS_API = 'https://127.0.0.1:9';
  process.env.PKGTRUTH_RETRIES = '0';
  process.env.PKGTRUTH_TIMEOUT_MS = '1500';
  // A cached figure legitimately survives an outage — that is the cache
  // doing its job. This test covers the cold path, where there is nothing
  // to fall back on.
  process.env.PKGTRUTH_NO_DISK_CACHE = '1';
  try {
    const { inspectPackage: fresh } = await import(`../src/detect.js?fault=${Date.now()}`);
    const r = await fresh('express');
    assert.notEqual(r.verdict, 'SAFE');
    assert.equal(r.verdict, 'UNKNOWN');
    assert.equal(r.complete, false);
    assert.ok(r.signals.some((s) => s.id === 'incomplete_check'));
  } finally {
    for (const [k, v] of [['PKGTRUTH_DOWNLOADS_API', prev.api], ['PKGTRUTH_RETRIES', prev.retries], ['PKGTRUTH_TIMEOUT_MS', prev.timeout], ['PKGTRUTH_NO_DISK_CACHE', prev.disk]]) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  }
});

test('disk cache round-trips a figure and keeps registries apart', async () => {
  const dir = `${process.env.TMPDIR || '/tmp'}/pkgtruth-test-${process.pid}`;
  const prev = process.env.PKGTRUTH_CACHE_DIR;
  process.env.PKGTRUTH_CACHE_DIR = dir;
  try {
    const dc = await import(`../src/diskcache.js?t=${Date.now()}`);
    await dc.putCachedDownloads('express', 1234, 'https://api.npmjs.org');
    assert.equal(await dc.getCachedDownloads('express', 'https://api.npmjs.org'), 1234);

    // A figure from npm must not answer for a different registry.
    assert.equal(await dc.getCachedDownloads('express', 'https://npm.internal'), undefined);

    // And it must survive a flush/reload cycle, which is the whole point.
    await dc.flush();
    const reloaded = await import(`../src/diskcache.js?t=${Date.now()}b`);
    assert.equal(await reloaded.getCachedDownloads('express', 'https://api.npmjs.org'), 1234);
  } finally {
    const { rm } = await import('node:fs/promises');
    await rm(dir, { recursive: true, force: true });
    if (prev === undefined) delete process.env.PKGTRUTH_CACHE_DIR; else process.env.PKGTRUTH_CACHE_DIR = prev;
  }
});
