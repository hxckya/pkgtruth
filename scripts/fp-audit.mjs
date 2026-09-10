#!/usr/bin/env node
/**
 * False-positive audit.
 *
 * Take the seed list, resolve each seed's direct dependencies from the
 * registry, and run every unique package in that closure through
 * pkgtruth. These are real dependencies of real, popular packages — the
 * population a gate meets in practice. Anything HALLUCINATED or DANGER
 * here is either a false positive to fix or a genuine problem in a popular
 * dependency tree; both are worth publishing.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { inspectMany } from '../src/detect.js';
import { fetchPackument, primeDownloads, flushDiskCache } from '../src/registry.js';

const seeds = (await readFile(new URL('./seeds.txt', import.meta.url), 'utf8'))
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

// 1) direct dependency closure (one level) of the seeds
const pool = new Set(seeds);
let resolved = 0;
const LIMIT = 6;
let i = 0;
await Promise.all(Array.from({ length: LIMIT }, async () => {
  while (i < seeds.length) {
    const s = seeds[i++];
    const p = await fetchPackument(s);
    if (!p.exists) continue;
    const latest = p.data['dist-tags']?.latest;
    const deps = p.data.versions?.[latest]?.dependencies || {};
    for (const d of Object.keys(deps)) pool.add(d);
    resolved++;
    if (resolved % 40 === 0) process.stderr.write(`  resolved ${resolved}/${seeds.length} seeds → pool ${pool.size}\n`);
  }
}));
const names = [...pool];
process.stderr.write(`population: ${names.length} unique packages (seeds + direct deps)\n`);

// 2) inspect (with a second pass over UNKNOWN)
await primeDownloads(names);
const results = await inspectMany(names, { concurrency: 4, onProgress: (d, t) => { if (d % 100 === 0) process.stderr.write(`  ${d}/${t}
`); } });
await flushDiskCache();
await writeFile(new URL('../.fp-audit.json', import.meta.url), JSON.stringify(results.map(({ name, verdict, score, weeklyDownloads, signals }) => ({ name, verdict, score, weeklyDownloads, signals: signals.map((s) => s.id) }))));

const by = {};
for (const r of results) by[r.verdict] = (by[r.verdict] || 0) + 1;
const flagged = results.filter((r) => r.verdict === 'DANGER' || r.verdict === 'HALLUCINATED')
  .sort((a, b) => (b.weeklyDownloads ?? 0) - (a.weeklyDownloads ?? 0));
const caution = results.filter((r) => r.verdict === 'CAUTION');
const fmt = (n) => (n == null ? '?' : n.toLocaleString('en-US'));
const today = new Date().toISOString().slice(0, 10);

const md = `# False-positive audit

_Generated ${today} by [\`scripts/fp-audit.mjs\`](scripts/fp-audit.mjs)._

**Population:** the ${seeds.length} well-known packages in \`scripts/seeds.txt\` plus every
direct dependency of each — **${names.length} unique real packages**. This is what a
dependency gate actually meets in practice: not a curated "known good" list,
but the dependency trees of popular software as published.

| verdict | count | share |
|---|---|---|
${['SAFE', 'CAUTION', 'DANGER', 'HALLUCINATED', 'UNKNOWN'].map((v) => `| ${v} | ${by[v] || 0} | ${(((by[v] || 0) / names.length) * 100).toFixed(1)}% |`).join('\n')}

**Blocking rate (DANGER + HALLUCINATED): ${flagged.length} of ${names.length} = ${((flagged.length / names.length) * 100).toFixed(2)}%.**

## Blocking verdicts in this population — ${flagged.length}

Each row is either a false positive (open an issue — it becomes a regression
test) or a genuine problem in a popular package's dependency tree.

| verdict | package | installs / week | signals |
|---|---|---|---|
${flagged.map((r) => `| ${r.verdict} | \`${r.name}\` | ${fmt(r.weeklyDownloads)} | ${r.signals.filter((s) => s.severity === 'critical' || s.severity === 'high').map((s) => s.id.replace(/_/g, ' ')).join(', ')} |`).join('\n') || '| — | | | |'}

## CAUTION — ${caution.length}

Not blocking by default. Listed by signal so the noise profile is visible.

| signal | count |
|---|---|
${Object.entries(caution.flatMap((r) => r.signals.map((s) => s.id)).reduce((m, id) => ((m[id] = (m[id] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k.replace(/_/g, ' ')} | ${v} |`).join('\n')}

## Reproduce

\`\`\`bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/fp-audit.mjs     # writes FP-AUDIT.md
\`\`\`
`;
await writeFile(new URL('../FP-AUDIT.md', import.meta.url), md);
process.stderr.write(`wrote FP-AUDIT.md — ${JSON.stringify(by)} blocking=${flagged.length}\n`);
