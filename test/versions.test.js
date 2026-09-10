import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);

// The npm package, the MCP registry manifest and the Claude Code plugin all
// carry the version. A release with any of them behind is a broken release.
test('every version field agrees with package.json', async () => {
  const { stdout } = await run(process.execPath, [path.resolve(import.meta.dirname, '../scripts/check-versions.mjs')]);
  assert.match(stdout, /all version fields agree/);
});
