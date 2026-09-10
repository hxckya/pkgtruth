#!/usr/bin/env node
/**
 * One version, everywhere it is written down. package.json is the source;
 * server.json, the Claude Code plugin manifest and marketplace entry, and the
 * `pkgtruth@x.y.z` pins in the plugin's hook and MCP config must all agree.
 * Optionally also with a tag passed as the first argument.
 *
 *   node scripts/check-versions.mjs [expected]
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const json = async (p) => JSON.parse(await readFile(path.join(root, p), 'utf8'));

const pkg = await json('package.json');
const v = pkg.version;
const problems = [];
const expect = (where, actual) => { if (actual !== v) problems.push(`${where}: ${actual} (package.json says ${v})`); };

const expected = process.argv[2]?.replace(/^v/, '');
if (expected && expected !== v) problems.push(`expected ${expected}, package.json says ${v}`);

const server = await json('server.json');
expect('server.json version', server.version);
for (const [i, p] of (server.packages || []).entries()) expect(`server.json packages[${i}].version`, p.version);

const plugin = await json('plugin/.claude-plugin/plugin.json');
expect('plugin.json version', plugin.version);

const market = await json('.claude-plugin/marketplace.json');
for (const [i, p] of (market.plugins || []).entries()) expect(`marketplace.json plugins[${i}].version`, p.version);

const hooks = await json('plugin/hooks/hooks.json');
const hookCmd = hooks.hooks?.PreToolUse?.[0]?.hooks?.[0]?.command || '';
const hookPin = (hookCmd.match(/pkgtruth@(\S+)/) || [])[1];
expect('plugin hooks.json pin', hookPin);

const mcp = await json('plugin/.mcp.json');
const mcpPin = ((mcp.mcpServers?.pkgtruth?.args || []).find((a) => a.startsWith('pkgtruth@')) || '').slice('pkgtruth@'.length);
expect('plugin .mcp.json pin', mcpPin);

if (problems.length) {
  console.error('Version mismatch:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`all version fields agree: ${v}`);
