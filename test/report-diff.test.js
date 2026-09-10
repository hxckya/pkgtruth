import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const run = promisify(execFile);
const SCRIPT = path.resolve(import.meta.dirname, '../scripts/report-diff.mjs');

const report = (rows) => `# Live slopsquats

_Generated 2026-09-15 by scripts/hunt.mjs._

## npm

### A. npm security placeholders — ${rows.length}

| name | installs / week | garbled from | signals |
|---|---|---|---|
${rows.map(([n, i, t]) => `| \`${n}\` | ${i} | \`${t}\` | npm security placeholder |`).join('\n')}

## Reproduce
`;

async function diff(a, b) {
  const dir = await mkdtemp(path.join(tmpdir(), 'pkgtruth-diff-'));
  try {
    await writeFile(path.join(dir, 'a.md'), a);
    await writeFile(path.join(dir, 'b.md'), b);
    try {
      const { stdout } = await run(process.execPath, [SCRIPT, path.join(dir, 'a.md'), path.join(dir, 'b.md')]);
      return { code: 0, stdout };
    } catch (err) {
      return { code: err.code, stdout: err.stdout ?? '' };
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('a name entering the list is reported as new', async () => {
  const r = await diff(report([['crossenv', '1,437', 'cross-env']]), report([['crossenv', '1,437', 'cross-env'], ['eslint-js', '612', '@eslint/js']]));
  assert.equal(r.code, 0);
  assert.match(r.stdout, /New this week/);
  assert.match(r.stdout, /`eslint-js`/);
  assert.doesNotMatch(r.stdout, /New this week[\s\S]*`crossenv`/);
});

test('a name leaving the list is reported as removed', async () => {
  const r = await diff(report([['crossenv', '1,437', 'cross-env'], ['mysqljs', '231', 'mysql']]), report([['crossenv', '1,437', 'cross-env']]));
  assert.equal(r.code, 0);
  assert.match(r.stdout, /No longer listed[^\n]*`mysqljs`/);
});

test('identical reports exit 3 so the workflow skips the release', async () => {
  const same = report([['crossenv', '1,437', 'cross-env']]);
  const r = await diff(same, same);
  assert.equal(r.code, 3);
  assert.match(r.stdout, /No change/);
});
