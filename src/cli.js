/**
 * Human- and CI-facing CLI. Shares one detection engine with the MCP
 * server, so a package blocked in an agent's gate is blocked in CI too.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { inspectPackage } from './detect.js';
import { primeDownloads } from './registry.js';

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

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

/** Collect every dependency name from a package.json. */
async function readManifest(dir) {
  const file = path.resolve(dir.endsWith('package.json') ? dir : path.join(dir, 'package.json'));
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    throw new Error(`No package.json at ${file}`);
  }
  const pkg = JSON.parse(raw);
  const names = new Set();
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const name of Object.keys(pkg[field] || {})) names.add(name);
  }
  return { file, names: [...names] };
}

function render(results) {
  const lines = [];
  for (const r of results) {
    const paint = PAINT[r.verdict] || ((s) => s);
    lines.push(`${paint(r.verdict.padEnd(13))} ${r.name}${r.version ? c('90', `@${r.version}`) : ''}`);
    lines.push(`  ${r.summary}`);
    for (const s of r.signals || []) {
      if (s.severity === 'critical' || s.severity === 'high') lines.push(`    ${c('90', '·')} ${s.detail}`);
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
  pkgtruth scan [dir]             Check every dependency in a package.json
  pkgtruth --help                 Show this help

OPTIONS
  --json                          Emit JSON instead of human output
  --fail-on <level>               Exit non-zero at this level or worse.
                                  danger (default) | caution

EXIT CODES
  0  nothing at or above the fail-on level
  1  blocking packages found
  2  usage or runtime error

EXAMPLES
  npx pkgtruth check express unused-imports
  npx pkgtruth scan .
  npx pkgtruth scan . --fail-on caution --json
`;

export async function runCli(argv) {
  const args = argv.slice();
  const json = args.includes('--json');
  const failIdx = args.indexOf('--fail-on');
  const failOn = failIdx !== -1 ? args[failIdx + 1] : 'danger';
  if (!['danger', 'caution'].includes(failOn)) {
    process.stderr.write(`pkgtruth: --fail-on must be "danger" or "caution"\n`);
    return 2;
  }
  // Strict mode also refuses packages that could not be verified at all —
  // "we could not check" is not a pass.
  const blocking = failOn === 'caution' ? new Set([...BLOCKING, 'CAUTION', 'UNKNOWN']) : BLOCKING;

  const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--fail-on');
  const cmd = positional[0];

  let names;
  let origin = '';
  if (cmd === 'check') {
    names = positional.slice(1);
    if (!names.length) {
      process.stderr.write('pkgtruth: `check` needs at least one package name\n');
      return 2;
    }
  } else if (cmd === 'scan') {
    try {
      const m = await readManifest(positional[1] || '.');
      names = m.names;
      origin = m.file;
    } catch (err) {
      process.stderr.write(`pkgtruth: ${err.message}\n`);
      return 2;
    }
    if (!names.length) {
      process.stdout.write('No dependencies declared.\n');
      return 0;
    }
  } else {
    process.stderr.write(`pkgtruth: unknown command "${cmd}"\n\n${HELP}`);
    return 2;
  }

  const unique = [...new Set(names)];
  await primeDownloads(unique);
  const results = await mapLimit(unique, 5, (n) => inspectPackage(n));
  results.sort((a, b) => (ORDER[a.verdict] ?? 9) - (ORDER[b.verdict] ?? 9));
  const bad = results.filter((r) => blocking.has(r.verdict));

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
  return bad.length ? 1 : 0;
}

export { HELP };
