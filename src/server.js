/**
 * pkgtruth MCP server.
 *
 * Gives a coding agent ground truth about the npm and PyPI packages it is
 * about to add, so a hallucinated or slopsquatted name gets caught before it
 * lands in a manifest or an install command. Every answer carries the
 * evidence behind it — an agent should never have to take "DANGER" on faith.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { inspectPackage, inspectMany, VERDICT_ORDER as ORDER } from './detect.js';
import { primeDownloads, flushDiskCache } from './registry.js';
import { inspectInstallCommand } from './installcmd.js';
import { VERSION } from './version.js';

export { VERSION };

const CONCURRENCY = 5;

// Every tool only reads public registry data; nothing is installed or written.
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true };

const ECOSYSTEM = z.enum(['npm', 'pypi']);
const VERDICT = z.enum(['SAFE', 'CAUTION', 'DANGER', 'HALLUCINATED', 'UNKNOWN'])
  .describe('HALLUCINATED: no such package. DANGER: do not install as-is. CAUTION: review first. UNKNOWN: could not verify — never treat as safe. SAFE: nothing found.');

const SIGNAL = z.object({
  id: z.string().describe('Stable machine id, e.g. npm_security_placeholder, impersonates_popular_package, not_in_registry, incomplete_check.'),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  detail: z.string().describe('One sentence of evidence, written for the agent to relay.'),
});

/** The per-package verdict every tool returns. */
const RESULT_SHAPE = {
  name: z.string(),
  ecosystem: ECOSYSTEM,
  verdict: VERDICT,
  summary: z.string().describe('One-paragraph explanation with the suggested real package when there is one.'),
  signals: z.array(SIGNAL),
  score: z.number().nullable().optional().describe('0–100 risk score behind the verdict; null when the registry was unreachable.'),
  exists: z.boolean().nullable().optional(),
  complete: z.boolean().optional().describe('false when a check could not run (rate limit, outage); such a result is UNKNOWN unless already DANGER.'),
  version: z.string().nullable().optional().describe('Latest published version.'),
  ageDays: z.number().nullable().optional().describe('Days since first publish.'),
  weeklyDownloads: z.number().nullable().optional(),
  pointsTo: z.string().nullable().optional().describe('The package this one\'s own deprecation notice tells users to install instead, if any.'),
  repository: z.string().nullable().optional(),
  didYouMean: z.array(z.looseObject({ name: z.string() })).optional().describe('For HALLUCINATED names: real packages with a similar name.'),
};
const RESULT = z.looseObject(RESULT_SHAPE);

const LIST_SHAPE = {
  blocking: z.number().int().describe('How many results are HALLUCINATED or DANGER.'),
  total: z.number().int(),
  results: z.array(RESULT).describe('Sorted worst-first.'),
};

function renderOne(r) {
  const lines = [`${r.verdict}  ${r.name}${r.version ? `@${r.version}` : ''}${r.ecosystem && r.ecosystem !== 'npm' ? ` [${r.ecosystem}]` : ''}`, `  ${r.summary}`];
  for (const s of r.signals || []) lines.push(`  · [${s.severity}] ${s.detail}`);
  if (r.didYouMean?.length) lines.push(`  → did you mean: ${r.didYouMean.slice(0, 3).map((d) => d.name).join(', ')}`);
  return lines.join('\n');
}

function renderList(results) {
  const blocking = results.filter((r) => r.verdict === 'HALLUCINATED' || r.verdict === 'DANGER');
  const unverified = results.filter((r) => r.verdict === 'UNKNOWN');
  const header = blocking.length
    ? `⛔ ${blocking.length} of ${results.length} package(s) must not be installed as-is.`
    : unverified.length
      ? `⚠️ ${unverified.length} of ${results.length} package(s) could not be verified — do not treat as safe.`
      : `✅ ${results.length} package(s) checked, nothing blocking.`;
  return [header, '', ...results.map(renderOne)].join('\n');
}

export function createServer() {
  const server = new McpServer({ name: 'pkgtruth', version: VERSION });

  server.registerTool(
    'check_package',
    {
      title: 'Check one package',
      description:
        'Verify a single npm or PyPI package before installing, importing, or recommending it. ' +
        'Returns whether it actually exists, and flags slopsquatting (a low-adoption ' +
        'package impersonating a popular one), names npm removed for malware, install-time scripts, deprecation, and ' +
        'abandonment. Call this whenever you are about to introduce a dependency you ' +
        'have not verified in this session. Read-only; one or two requests to the public registry. ' +
        'A verdict of UNKNOWN means the registry did not answer — retry, never assume safe.',
      inputSchema: {
        name: z.string().min(1).max(214).describe('Exact package name as it would be installed, e.g. "express", "@scope/pkg", or for PyPI "requests". No version suffix.'),
        ecosystem: ECOSYSTEM.optional().describe('Registry to check against. Default npm.'),
      },
      outputSchema: RESULT_SHAPE,
      annotations: READ_ONLY,
    },
    async ({ name, ecosystem = 'npm' }) => {
      const r = await inspectPackage(name, { ecosystem });
      await flushDiskCache();
      return { content: [{ type: 'text', text: renderOne(r) }], structuredContent: r };
    },
  );

  server.registerTool(
    'check_dependencies',
    {
      title: 'Gate a whole dependency list',
      description:
        'Verify many npm or PyPI packages at once — use this before writing a package.json or requirements.txt, ' +
        'or handing a dependency list to a user. All names must belong to one ecosystem per call. Results ' +
        'are sorted worst-first so anything hallucinated or dangerous surfaces at the top. ' +
        'Read-only; batches registry requests and caches adoption figures, so 50 names take a few seconds.',
      inputSchema: {
        names: z.array(z.string().min(1).max(214)).min(1).max(50).describe('Package names to verify (max 50), without version suffixes.'),
        ecosystem: ECOSYSTEM.optional().describe('Registry to check against. Default npm.'),
      },
      outputSchema: LIST_SHAPE,
      annotations: READ_ONLY,
    },
    async ({ names, ecosystem = 'npm' }) => {
      const unique = [...new Set(names)];
      if (ecosystem === 'npm') await primeDownloads(unique);
      const results = await inspectMany(unique, { ecosystem, concurrency: CONCURRENCY });
      results.sort((a, b) => (ORDER[a.verdict] ?? 9) - (ORDER[b.verdict] ?? 9));
      const blocking = results.filter((r) => r.verdict === 'HALLUCINATED' || r.verdict === 'DANGER').length;
      await flushDiskCache();
      return {
        content: [{ type: 'text', text: renderList(results) }],
        structuredContent: { blocking, total: results.length, results },
      };
    },
  );

  server.registerTool(
    'check_install_command',
    {
      title: 'Check the packages an install command would fetch',
      description:
        'Verify the packages a shell command would install or execute, before running it: ' +
        '`npm install …`, `npx …`, `pnpm add`, `yarn add`, `bun add`, `pip install`, `uv add`, `poetry add` and similar, ' +
        'including behind `sudo`, `&&` chains and `sh -c`. Extracts the package names (npm and PyPI at once), ' +
        'checks each against its registry, and returns them worst-first. A command that installs nothing by name ' +
        '(a bare `npm install` from a lockfile, `git`, `npm test`, or `npx <bin>` of a tool already in node_modules) returns total 0 and costs no network call — ' +
        'use check_dependencies on the manifest in that case. Read-only.',
      inputSchema: {
        command: z.string().min(1).max(4000).describe('The exact shell command about to run, e.g. "npm install express crossenv" or "pip install -U requests".'),
        cwd: z.string().optional().describe('Directory the command will run in. Lets "npx <bin>" of an already-installed tool be recognised as fetching nothing. Defaults to the server\'s working directory.'),
      },
      outputSchema: {
        command: z.string(),
        packages: z.array(z.object({ ecosystem: ECOSYSTEM, tool: z.string(), names: z.array(z.string()) })).describe('What was recognised, per install command.'),
        ...LIST_SHAPE,
      },
      annotations: READ_ONLY,
    },
    async ({ command, cwd }) => {
      const report = await inspectInstallCommand(command, { concurrency: CONCURRENCY, cwd });
      await flushDiskCache();
      const text = report.total
        ? renderList(report.results)
        : 'No package names found in this command — nothing to check. If it installs from a lockfile or manifest, run check_dependencies on those names instead.';
      const { command: cmd, packages, total, blocking, results } = report;
      return { content: [{ type: 'text', text }], structuredContent: { command: cmd, packages, total, blocking, results } };
    },
  );

  return server;
}

export async function main() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
