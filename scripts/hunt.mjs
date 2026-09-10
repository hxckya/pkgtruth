#!/usr/bin/env node
/**
 * Generate the names a model plausibly emits instead of a popular package,
 * run each through pkgtruth, and write SLOPSQUATS.md.
 *
 * Only DANGER verdicts are reported. CAUTION is deliberately excluded: a new
 * or small package is not an accusation, and a report that names legitimate
 * projects as suspects would be worse than no report.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { inspectPackage } from '../src/detect.js';
import { primeDownloads, flushDiskCache } from '../src/registry.js';
import { mutations } from './mutations.mjs';

const seeds = (await readFile(new URL('./seeds.txt', import.meta.url), 'utf8'))
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const seedSet = new Set(seeds);

// Names that are pure garblings with no legitimate seed to derive from.
const EXTRA_CANDIDATES = { 'node.js': 'node', 'nodejs': 'node' };
const candidates = new Map(); // candidate -> seed
for (const [c, s] of Object.entries(EXTRA_CANDIDATES)) candidates.set(c, s);
for (const s of seeds) for (const m of mutations(s, seedSet)) if (!candidates.has(m)) candidates.set(m, s);

const names = [...candidates.keys()];
process.stderr.write(`seeds ${seeds.length} → candidates ${names.length}\n`);
await primeDownloads(names);

const hits = [];
let done = 0, exist = 0;
const LIMIT = 4;
let next = 0;
await Promise.all(Array.from({ length: LIMIT }, async () => {
  while (next < names.length) {
    const n = names[next++];
    const r = await inspectPackage(n);
    done++;
    if (r.exists) exist++;
    if (r.verdict === 'DANGER') hits.push({ ...r, seed: candidates.get(n) });
    if (done % 50 === 0) process.stderr.write(`  ${done}/${names.length} (exist ${exist}, danger ${hits.length})\n`);
  }
}));
await flushDiskCache();
await writeFile(new URL('../.hunt-results.json', import.meta.url),
  JSON.stringify({ generated: new Date().toISOString(), seeds: seeds.length, candidates: names.length, exist, hits }, null, 1));

const placeholder = hits.filter((h) => h.signals.some((s) => s.id === 'npm_security_placeholder'));

// Section B is held to a stricter bar than the CLI verdict. A near-twin with
// low adoption is a fair DANGER for a gate that is about to install it; it is
// not fair grounds for naming a package in a public report — plenty of small,
// honest packages have generic names. So B lists only packages whose own
// deprecation notice points at the popular one: self-attested confusion.
const seedCore = (n) => n.replace(/^@[^/]+\//, '').toLowerCase();
const other = hits.filter((h) => {
  if (placeholder.includes(h)) return false;
  const dep = h.signals.find((s) => s.id === 'deprecated');
  if (!dep) return false;
  const text = dep.detail.toLowerCase();
  return text.includes(h.seed.toLowerCase()) || text.includes(seedCore(h.seed));
});
const withheld = hits.length - placeholder.length - other.length;
const byDl = (a, b) => (b.weeklyDownloads ?? 0) - (a.weeklyDownloads ?? 0);
placeholder.sort(byDl); other.sort(byDl);

const fmt = (n) => (n == null ? '?' : n.toLocaleString('en-US'));
const row = (h) => {
  const twin = h.signals.find((s) => s.id === 'impersonates_popular_package');
  const why = h.signals.filter((s) => s.severity === 'critical' || s.severity === 'high')
    .map((s) => s.id.replace(/_/g, ' ')).join(', ');
  return `| \`${h.name}\` | ${fmt(h.weeklyDownloads)} | \`${h.seed}\` | ${why} |`;
};
const today = new Date().toISOString().slice(0, 10);
const md = `# Live slopsquats on npm

_Generated ${today} by [\`scripts/hunt.mjs\`](scripts/hunt.mjs). Regenerated weekly._

Start from ${seeds.length} well-known packages, produce the names a model
plausibly emits instead of each one (scope dropped, dot↔hyphen, hyphen dropped,
plugin prefix dropped, \`js\` appended), and run every candidate through
pkgtruth. ${names.length} candidates checked; ${exist} exist on npm;
**${hits.length} came back DANGER** from pkgtruth; **${placeholder.length + other.length}** meet the
stricter bar for this page.

The CLI flags a near-twin with low adoption as DANGER because it is about to
be installed and the odds favour a mistake. That is not grounds for naming a
package publicly — many small, honest packages have generic names. So this
page lists only two kinds of evidence, and withholds the other ${withheld}
DANGER verdicts rather than risk accusing a legitimate project.

## A. npm security placeholders — ${placeholder.length}

npm removed malicious code published under these names and left a
\`-security\` placeholder. Anything still installing them is installing the
name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
${placeholder.map(row).join('\n') || '| — | | | |'}

## B. Deprecated names whose own notice points elsewhere — ${other.length}

Not malicious. Each of these carries a deprecation message from its own
maintainer naming the package in the third column. The installs are real,
and the maintainer has already said they belong somewhere else.

| name | installs / week | deprecation points to | signals |
|---|---|---|---|
${other.map(row).join('\n') || '| — | | | |'}

## Reproduce

\`\`\`bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <any name above>
\`\`\`

If a package here is legitimate and wrongly flagged, open an issue — that is
exactly the report this project most wants.
`;
await writeFile(new URL('../SLOPSQUATS.md', import.meta.url), md);
process.stderr.write(`\nwrote SLOPSQUATS.md — placeholders ${placeholder.length}, other DANGER ${other.length}\n`);
