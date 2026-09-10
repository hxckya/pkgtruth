/**
 * Human- and CI-facing CLI. Shares one detection engine with the MCP
 * server, so a package blocked in an agent's gate is blocked in CI too.
 */

import { inspectMany, ECOSYSTEMS, VERDICT_ORDER as ORDER, blockingVerdicts } from './detect.js';
import { discoverManifests } from './manifests.js';
import { primeDownloads, flushDiskCache } from './registry.js';
import { hookInput, inspectInstallCommand } from './installcmd.js';

const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
const PAINT = {
  HALLUCINATED: (s) => c('1;35', s),
  DANGER: (s) => c('1;31', s),
  CAUTION: (s) => c('1;33', s),
  UNKNOWN: (s) => c('1;90', s),
  SAFE: (s) => c('1;32', s),
};

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

const HELP = `pkgtruth — ground truth about npm and PyPI packages, for agents and CI

USAGE
  pkgtruth                        Run as an MCP server over stdio (for coding agents)
  pkgtruth check <pkg...>         Check one or more package names
  pkgtruth scan [dir|manifest]    Check every dependency in package.json,
                                  requirements*.txt and/or pyproject.toml
  pkgtruth hook                   Claude Code PreToolUse hook: reads the hook
                                  JSON on stdin and denies install commands
                                  (npm/npx/pnpm/yarn/bun/pip/uv/poetry) that
                                  name a blocked package
  pkgtruth --help                 Show this help

OPTIONS
  --ecosystem <npm|pypi>, -e      Registry for 'check' (default npm). 'scan'
                                  and 'hook' pick it from the input.
  --json                          Emit JSON instead of human output
  --fail-on <level>               Exit non-zero at this level or worse.
                                  danger (default) | caution

EXIT CODES
  0  nothing at or above the fail-on level
  1  blocking packages found
  2  usage or runtime error (and, for 'hook', "deny this command")

EXAMPLES
  npx pkgtruth check express unused-imports
  npx pkgtruth check -e pypi requests sklearn
  npx pkgtruth scan .
  npx pkgtruth scan . --fail-on caution --json
  echo '{"tool_input":{"command":"npm i crossenv"}}' | npx pkgtruth hook
`;

async function readStdin() {
  if (process.stdin.isTTY) return null;
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return text;
}

/**
 * Claude Code PreToolUse hook. Commands that install nothing by name pass
 * through with no output and no network call. A blocked command answers
 * with a deny decision on stdout and exit code 2 — Claude Code honours
 * either — carrying the evidence as the reason so the agent can pick the
 * real package instead.
 */
async function runHook({ failOn }) {
  const raw = await readStdin();
  if (raw === null) {
    process.stderr.write('pkgtruth hook: expects the hook JSON on stdin — see README, "As a Claude Code hook"\n');
    return 2;
  }
  const { command, cwd } = hookInput(raw);
  if (!command) return 0;
  const report = await inspectInstallCommand(command, { failOn, concurrency: 5, cwd: cwd || process.cwd() });
  await flushDiskCache();
  if (!report.total) return 0;

  const emit = (fields) => process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', ...fields } }) + '\n');
  if (report.blocking) {
    const lines = [`pkgtruth blocked this command: ${report.blocking} of ${report.total} package(s) must not be installed as-is.`];
    for (const r of report.blocked) {
      // The summary opens with the same name and verdict; say them once.
      const prefix = `"${r.name}" — ${r.verdict}.`;
      const why = r.summary.startsWith(prefix) ? r.summary.slice(prefix.length).trim() : r.summary;
      lines.push(`  ✖ ${r.name}${r.ecosystem !== 'npm' ? ` [${r.ecosystem}]` : ''} ${r.verdict} — ${why}`);
    }
    lines.push('Run "npx pkgtruth check <name>" for the full evidence. False positive? https://github.com/hxckya/pkgtruth/issues');
    const reason = lines.join('\n');
    emit({ permissionDecision: 'deny', permissionDecisionReason: reason });
    process.stderr.write(reason + '\n');
    return 2;
  }
  const unverified = report.results.filter((r) => r.verdict === 'UNKNOWN');
  if (unverified.length) {
    // Not blocked at this level, but it must never read as vetted either.
    emit({ additionalContext: `pkgtruth could not verify ${unverified.map((r) => r.name).join(', ')} (the registry did not answer). Not blocked under --fail-on ${failOn}; do not treat as vetted.` });
  }
  return 0;
}

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
  const blocking = blockingVerdicts(failOn);

  const positional = args.filter((a, i) => !a.startsWith('-') && args[i - 1] !== '--fail-on' && args[i - 1] !== '--ecosystem' && args[i - 1] !== '-e');
  const cmd = positional[0];
  if (cmd === 'hook') return runHook({ failOn });

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
