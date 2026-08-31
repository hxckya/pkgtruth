/**
 * pkgtruth MCP server.
 *
 * Gives a coding agent ground truth about npm packages it is about to add,
 * so a hallucinated or slopsquatted name gets caught before it lands in a
 * manifest. Every answer carries the evidence behind it — an agent should
 * never have to take "DANGER" on faith.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { inspectPackage } from './detect.js';

export const VERSION = '0.1.0';

const CONCURRENCY = 5;

/** Run `fn` over `items`, a few at a time, preserving input order. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

const ORDER = { HALLUCINATED: 0, DANGER: 1, CAUTION: 2, UNKNOWN: 3, SAFE: 4 };

function renderOne(r) {
  const lines = [`${r.verdict}  ${r.name}${r.version ? `@${r.version}` : ''}`, `  ${r.summary}`];
  for (const s of r.signals || []) lines.push(`  · [${s.severity}] ${s.detail}`);
  if (r.didYouMean?.length) lines.push(`  → did you mean: ${r.didYouMean.slice(0, 3).map((d) => d.name).join(', ')}`);
  return lines.join('\n');
}

export function createServer() {
  const server = new McpServer({ name: 'pkgtruth', version: VERSION });

  server.registerTool(
    'check_package',
    {
      title: 'Check one npm package',
      description:
        'Verify a single npm package before installing, importing, or recommending it. ' +
        'Returns whether it actually exists, and flags slopsquatting (a low-adoption ' +
        'package impersonating a popular one), install-time scripts, deprecation, and ' +
        'abandonment. Call this whenever you are about to introduce a dependency you ' +
        'have not verified in this session.',
      inputSchema: { name: z.string().describe('Exact npm package name, e.g. "express" or "@scope/pkg".') },
    },
    async ({ name }) => {
      const r = await inspectPackage(name);
      return { content: [{ type: 'text', text: renderOne(r) }], structuredContent: r };
    },
  );

  server.registerTool(
    'check_dependencies',
    {
      title: 'Gate a whole dependency list',
      description:
        'Verify many npm packages at once — use this before writing a package.json, ' +
        'running an install command, or handing a dependency list to a user. Results ' +
        'are sorted worst-first so anything hallucinated or dangerous surfaces at the top.',
      inputSchema: {
        names: z.array(z.string()).min(1).max(50).describe('Package names to verify (max 50).'),
      },
    },
    async ({ names }) => {
      const unique = [...new Set(names)];
      const results = await mapLimit(unique, CONCURRENCY, (n) => inspectPackage(n));
      results.sort((a, b) => (ORDER[a.verdict] ?? 9) - (ORDER[b.verdict] ?? 9));

      const blocking = results.filter((r) => r.verdict === 'HALLUCINATED' || r.verdict === 'DANGER');
      const header = blocking.length
        ? `⛔ ${blocking.length} of ${results.length} package(s) must not be installed as-is.`
        : `✅ ${results.length} package(s) checked, nothing blocking.`;

      return {
        content: [{ type: 'text', text: [header, '', ...results.map(renderOne)].join('\n') }],
        structuredContent: { blocking: blocking.length, total: results.length, results },
      };
    },
  );

  return server;
}

export async function main() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
