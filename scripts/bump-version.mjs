#!/usr/bin/env node
/**
 * Set the release version in every file that carries it, through a JSON
 * parse/serialise round-trip so a typo can never produce an unparseable
 * manifest again. Then verify.
 *
 *   node scripts/bump-version.mjs 0.3.0
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const v = process.argv[2]?.replace(/^v/, '');
if (!v || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(v)) {
  console.error('usage: bump-version.mjs <semver>');
  process.exit(2);
}
const root = path.resolve(import.meta.dirname, '..');
const edit = async (rel, fn) => {
  const p = path.join(root, rel);
  const data = JSON.parse(await readFile(p, 'utf8'));
  fn(data);
  await writeFile(p, JSON.stringify(data, null, 2) + '\n');
  console.log('updated', rel);
};

await edit('package.json', (d) => { d.version = v; });
await edit('package-lock.json', (d) => { d.version = v; if (d.packages?.['']) d.packages[''].version = v; });
await edit('server.json', (d) => { d.version = v; for (const p of d.packages || []) p.version = v; });
await edit('plugin/.claude-plugin/plugin.json', (d) => { d.version = v; });
await edit('.claude-plugin/marketplace.json', (d) => { for (const p of d.plugins || []) p.version = v; });
await edit('plugin/hooks/hooks.json', (d) => {
  for (const group of d.hooks.PreToolUse) for (const h of group.hooks) h.command = h.command.replace(/pkgtruth@\S+/, `pkgtruth@${v}`);
});
await edit('plugin/.mcp.json', (d) => {
  const s = d.mcpServers.pkgtruth;
  s.args = s.args.map((a) => (a.startsWith('pkgtruth@') ? `pkgtruth@${v}` : a));
});
execFileSync(process.execPath, [path.join(root, 'scripts/check-versions.mjs')], { stdio: 'inherit' });
