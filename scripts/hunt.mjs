#!/usr/bin/env node
/**
 * Generate the names a model plausibly emits instead of a popular package,
 * run each through pkgtruth, and write SLOPSQUATS.md — one section per
 * ecosystem.
 *
 * Only DANGER verdicts are considered, and the public page is held to a
 * stricter bar than the CLI: it lists npm's own security placeholders, and
 * packages whose own deprecation notice names the popular package. A
 * near-twin that is merely small is a fair DANGER for a gate that is about
 * to install it; it is not fair grounds for naming a project publicly, and
 * those verdicts are counted but withheld.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { inspectMany } from '../src/detect.js';
import { primeDownloads, flushDiskCache } from '../src/registry.js';
import { mutations as npmMutations } from './mutations.mjs';
import { mutations as pypiMutations } from './mutations-pypi.mjs';
import { isPlaceholder, isNoticeBacked, matchedTwin } from './publish-rules.mjs';

const ECOSYSTEMS = [
  {
    id: 'npm', label: 'npm', seeds: './seeds.txt', mutations: npmMutations,
    // Names that are pure garblings with no legitimate seed to derive from.
    extra: { 'node.js': 'node', 'nodejs': 'node', 'vue.js': 'vue' },
        reproduce: 'npx pkgtruth check <name>',
  },
  {
    id: 'pypi', label: 'PyPI', seeds: './seeds-pypi.txt', mutations: pypiMutations,
    extra: {},
        reproduce: 'npx pkgtruth check -e pypi <name>',
  },
];

const fmt = (n) => (n == null ? '?' : n.toLocaleString('en-US'));
const today = new Date().toISOString().slice(0, 10);

async function runEcosystem(eco) {
  const seeds = (await readFile(new URL(eco.seeds, import.meta.url), 'utf8'))
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const seedSet = new Set(seeds);
  const candidates = new Map();
  for (const [c, s] of Object.entries(eco.extra)) candidates.set(c, s);
  for (const s of seeds) for (const m of eco.mutations(s, seedSet)) if (!candidates.has(m)) candidates.set(m, s);
  const names = [...candidates.keys()];
  process.stderr.write(`[${eco.id}] seeds ${seeds.length} → candidates ${names.length}\n`);

  if (eco.id === 'npm') await primeDownloads(names);
  const results = await inspectMany(names, {
    ecosystem: eco.id, concurrency: 4,
    onProgress: (d, t) => { if (d % 100 === 0) process.stderr.write(`  [${eco.id}] ${d}/${t}\n`); },
  });
  const exist = results.filter((r) => r.exists).length;
  const hits = results.filter((r) => r.verdict === 'DANGER').map((r) => ({ ...r, seed: candidates.get(r.name) }));

  const placeholder = hits.filter(isPlaceholder);
  const other = hits.filter((h) => !isPlaceholder(h) && isNoticeBacked(h, h.seed, eco.id));
  const byDl = (a, b) => (b.weeklyDownloads ?? 0) - (a.weeklyDownloads ?? 0);
  placeholder.sort(byDl); other.sort(byDl);
  return { eco, seeds, names, exist, hits, placeholder, other, withheld: hits.length - placeholder.length - other.length, results };
}

const row = (h, col3) => {
  const why = h.signals.filter((s) => s.severity === 'critical' || s.severity === 'high')
    .map((s) => s.id.replace(/_/g, ' ')).join(', ');
  return `| \`${h.name}\` | ${fmt(h.weeklyDownloads)} | \`${col3}\` | ${why} |`;
};

function renderSection(r) {
  const { eco } = r;
  let md = `## ${eco.label}\n\n`;
  md += `Start from ${r.seeds.length} well-known packages, produce the names a model plausibly emits\n`;
  md += `instead of each one, and run every candidate through pkgtruth. **${r.names.length} candidates\n`;
  md += `checked; ${r.exist} exist on ${eco.label}; ${r.hits.length} came back DANGER;** ${r.placeholder.length + r.other.length} meet the\n`;
  md += `bar for this page and ${r.withheld} are withheld.\n\n`;
  if (eco.id === 'npm') {
    md += `### A. npm security placeholders — ${r.placeholder.length}\n\n`;
    md += `npm removed malicious code published under these names and left a \`-security\`\n`;
    md += `placeholder. Anything still installing them is installing the name an attacker chose.\n\n`;
    md += `| name | installs / week | garbled from | signals |\n|---|---|---|---|\n`;
    md += (r.placeholder.map((h) => row(h, h.seed)).join('\n') || '| — | | | |') + '\n\n';
  } else {
    md += `PyPI deletes malicious projects outright rather than leaving a placeholder, so a purged\n`;
    md += `name simply no longer exists and is not listed here. What remains are names that exist,\n`;
    md += `take real installs, and say in their own metadata that they are not the package you meant.\n\n`;
  }
  md += `### ${eco.id === 'npm' ? 'B' : 'A'}. Deprecated names whose own notice points elsewhere — ${r.other.length}\n\n`;
  md += `Not malicious. Each carries a deprecation message from its own maintainer naming the\n`;
  md += `package in the third column. The installs are real, and the maintainer has already said\n`;
  md += `they belong somewhere else.\n\n`;
  md += `| name | installs / week | points to | signals |\n|---|---|---|---|\n`;
  // Show the canonical name when the notice merely spells the seed differently
  // ("Express" for express); otherwise show what the notice actually said.
  const same = (a, b) => String(a).toLowerCase().replace(/[-_.]+/g, '-') === String(b).toLowerCase().replace(/[-_.]+/g, '-');
  md += (r.other.map((h) => row(h, h.pointsTo && same(h.pointsTo, h.seed) ? h.seed : (h.pointsTo || matchedTwin(h) || h.seed))).join('\n') || '| — | | | |') + '\n\n';
  return md;
}

const runs = [];
for (const eco of ECOSYSTEMS) runs.push(await runEcosystem(eco));
await flushDiskCache();
await writeFile(new URL('../.hunt-results.json', import.meta.url),
  JSON.stringify(runs.map((r) => ({ ecosystem: r.eco.id, generated: new Date().toISOString(), seeds: r.seeds.length, candidates: r.names.length, exist: r.exist, hits: r.hits })), null, 1));

let md = `# Live slopsquats\n\n_Generated ${today} by [\`scripts/hunt.mjs\`](scripts/hunt.mjs). Regenerated weekly._\n\n`;
md += `Garbling rules: scope dropped, dot↔hyphen, hyphen dropped, plugin prefix dropped, \`js\`\n`;
md += `appended (npm); \`python-\`/\`py\` prefix added or dropped, digit suffix confusion,\n`;
md += `plural/doubled letter, import-name-for-dist-name (PyPI).\n\n`;
md += `Only DANGER verdicts are considered, and only two kinds of evidence are published:\n`;
md += `npm's own security placeholders, and deprecation notices that name the real package.\n`;
md += `Everything else the CLI would block is counted and withheld — a package that is merely\n`;
md += `small or new is not evidence of anything.\n\n`;
for (const r of runs) md += renderSection(r);
md += `## Reproduce\n\n\`\`\`bash\ngit clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci\nnode scripts/hunt.mjs            # writes SLOPSQUATS.md\n`;
for (const eco of ECOSYSTEMS) md += `${eco.reproduce}\n`;
md += `\`\`\`\n\nIf a package here is legitimate and wrongly flagged, open an issue — that is exactly the\nreport this project most wants.\n`;
await writeFile(new URL('../SLOPSQUATS.md', import.meta.url), md);
for (const r of runs) process.stderr.write(`[${r.eco.id}] placeholders ${r.placeholder.length}, notice-backed ${r.other.length}, withheld ${r.withheld}\n`);
process.stderr.write('wrote SLOPSQUATS.md\n');
