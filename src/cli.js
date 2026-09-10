/**
 * Human- and CI-facing CLI. Shares one detection engine with the MCP
 * server, so a package blocked in an agent's gate is blocked in CI too.
 */

import { inspectMany, ECOSYSTEMS } from './detect.js';
import { discoverManifests } from './manifests.js';
import { primeDownloads, flushDiskCache } from './registry.js';

const BLOCKING = new Set(['HALLUCINATED', 'DANGER']);

const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
const PAINT = {
  HALLUCINATED: (s) => c('1;35', s),
  DANGER: (s) => c('1;31', s),
  CAUTION: (s) => c('1;33', s),
  UNKNOWN: (s) => c('1;90', s),
  SAFE: (s) => c('1;32', s),
};

const ORDER = { HALLUCINATED: 0, DANGER: 1, CAUTION: 2, UNKNOWN: 3, SAFE: 4 };

function render(results) {
  const lines = [];
  for (const r of results) {
    const paint = PAINT[r.verdict] || ((s) => s);
    const tag = r.ecosystem && r.ecosystem !== 'npm' ? c('90', ` [${r.ecosystem}]`) : '';
    lines.push(`${paint(r.verdict.padEnd(13))} ${r.name}${r.version ? c('90', `@${r.version}`) : ''}${tag}`);
    // The summary is a prose join of these same signals, so printing both
    // says everything twice. Show the itemised evidence where there is any,
    // and fall back to the sentence when there is nothing to itemise.
    const notable = (r.signals || []).filter((s) => s.severity === 'critical' || s.severity === 'high');
    if (notable.length) {
      for (const s of notable) lines.push(`  ${c('90', '·')} ${s.detail}`);
    } else {
      lines.push(`  ${r.summary}`);
    }
    if (r.didYouMean?.length) lines.push(`    ${c('90', '→')} did you mean: ${r.didYouMean.slice(0, 3).map((d) => d.name).join(', ')}`);
    lines.push('');
  }
  return lines.join('\n');
}

const HELP = `pkgtruth — ground truth about npm packages, for agents and CI

USAGE
  pkgtruth                        Run as an MCP server over stdio (for coding agents)
  pkgtruth check <pkg...>         Check one or more package names
  pkgtruth scan [dir|manifest]    Check every dependency in package.json,
                                  requirements*.txt and/or pyproject.toml
  pkgtruth --help                 Show this help

OPTIONS
  --ecosystem <npm|pypi>, -e      Registry for 'check' (default npm). 'scan'
                                  picks it from the manifest.
  --json                          Emit JSON instead of human output
  --fail-on <level>               Exit non-zero at this level or worse.
                                  danger (default) | caution

EXIT CODES
  0  nothing at or above the fail-on level
  1  blocking packages found
  2  usage or runtime error

EXAMPLES
  npx pkgtruth check express unused-imports
  npx pkgtruth check -e pypi requests sklearn
  npx pkgtruth scan .
  npx pkgtruth scan . --fail-on caution --json
`;

export async function runCli(argv) {
  const args = argv.slice();
  const json = args.includes('--json');
  const failIdx = args.indexOf('--fail-on');
  const failOn = failIdx !== -1 ? args[failIdx + 1] : 'danger';
  const ecoIdx = Math.max(args.indexOf('--ecosystem'), args.indexOf('-e'));
  const ecosystem = ecoIdx !== -1 ? args[ecoIdx + 1] : 'npm';
  if (!ECOSYSTEMS[ecosystem]) {
    process.stderr.write(`pkgtruth: --ecosystem must be one of ${Object.keys(ECOSYSTEMS).join(', ')}\n`);
    return 2;
  }
  if (!['danger', 'caution'].includes(failOn)) {
    process.stderr.write(`pkgtruth: --fail-on must be "danger" or "caution"\n`);
    return 2;
  }
  // Strict mode also refuses packages that could not be verified at all —
  // "we could not check" is not a pass.
  const blocking = failOn === 'caution' ? new Set([...BLOCKING, 'CAUTION', 'UNKNOWN']) : BLOCKING;

  const positional = args.filter((a, i) => !a.startsWith('-') && args[i - 1] !== '--fail-on' && args[i - 1] !== '--ecosystem' && args[i - 1] !== '-e');
  const cmd = positional[0];

  // One batch per ecosystem: { ecosystem, file, names }
  let batches;
  if (cmd === 'check') {
    const names = positional.slice(1);
    if (!names.length) {
      process.stderr.write('pkgtruth: `check` needs at least one package name\n');
      return 2;
    }
    batches = [{ ecosystem, file: '', names }];
  } else if (cmd === 'scan') {
    try {
      batches = await discoverManifests(positional[1] || '.');
    } catch (err) {
      process.stderr.write(`pkgtruth: ${err.message}\n`);
      return 2;
    }
    if (!batches.length) {
      process.stderr.write(`pkgtruth: No package.json, requirements*.txt or pyproject.toml at ${positional[1] || '.'}\n`);
      return 2;
    }
    if (!batches.some((b) => b.names.length)) {
      process.stdout.write('No dependencies declared.\n');
      return 0;
    }
  } else {
    process.stderr.write(`pkgtruth: unknown command "${cmd}"\n\n${HELP}`);
    return 2;
  }

  const results = [];
  for (const b of batches) {
    const unique = [...new Set(b.names)];
    if (!unique.length) continue;
    if (b.ecosystem === 'npm') await primeDownloads(unique);
    results.push(...await inspectMany(unique, { ecosystem: b.ecosystem, concurrency: 5 }));
  }
  results.sort((a, b) => (ORDER[a.verdict] ?? 9) - (ORDER[b.verdict] ?? 9));
  const bad = results.filter((r) => blocking.has(r.verdict));
  const origin = batches.map((b) => b.file).filter(Boolean).join(', ');

  if (json) {
    process.stdout.write(JSON.stringify({ origin, total: results.length, blocking: bad.length, results }, null, 2) + '\n');
  } else {
    if (origin) process.stdout.write(`${c('90', origin)}\n\n`);
    process.stdout.write(render(results));
    const unverified = results.filter((r) => r.verdict === 'UNKNOWN');
    if (bad.length) {
      process.stdout.write(`${PAINT.DANGER(`⛔ ${bad.length} of ${results.length} package(s) blocked`)}: ${bad.map((r) => r.name).join(', ')}\n`);
    } else if (unverified.length) {
      // Never sign off with a checkmark on packages we could not check.
      process.stdout.write(`${PAINT.UNKNOWN(`⚠️  ${unverified.length} of ${results.length} package(s) could not be verified`)}: ${unverified.map((r) => r.name).join(', ')}\n`);
    } else {
      process.stdout.write(`${PAINT.SAFE(`✅ ${results.length} package(s) checked, nothing blocking`)}\n`);
    }
  }
  await flushDiskCache();
  return bad.length ? 1 : 0;
}

export { HELP };
