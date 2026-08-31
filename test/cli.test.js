import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const BIN = path.resolve(import.meta.dirname, '../bin/pkgtruth.js');

/** Run the CLI and hand back its exit code instead of throwing. */
async function cli(args) {
  try {
    const { stdout, stderr } = await run(process.execPath, [BIN, ...args]);
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

test('--help exits 0 and describes both modes', async () => {
  const r = await cli(['--help']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /MCP server over stdio/);
  assert.match(r.stdout, /pkgtruth scan/);
});

test('unknown command exits 2', async () => {
  assert.equal((await cli(['bogus'])).code, 2);
});

test('check with no package names exits 2', async () => {
  assert.equal((await cli(['check'])).code, 2);
});

test('invalid --fail-on exits 2', async () => {
  assert.equal((await cli(['check', 'express', '--fail-on', 'whatever'])).code, 2);
});

test('scan on a directory with no package.json exits 2', async () => {
  const r = await cli(['scan', path.resolve(import.meta.dirname, '../.git')]);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /No package\.json/);
});

// The CI contract: a blocking package must fail the build.
const online = process.env.PKGTRUTH_TEST_ONLINE === '1';

test('blocking package exits 1', { skip: !online }, async () => {
  assert.equal((await cli(['check', 'unused-imports'])).code, 1);
});

test('clean package exits 0', { skip: !online }, async () => {
  assert.equal((await cli(['check', 'express'])).code, 0);
});

test('--json emits parseable output', { skip: !online }, async () => {
  const r = await cli(['check', 'unused-imports', '--json']);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.blocking, 1);
  assert.equal(parsed.results[0].verdict, 'DANGER');
});
