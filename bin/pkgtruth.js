#!/usr/bin/env node
/**
 * No arguments  → MCP server on stdio. Nothing but JSON-RPC may touch
 *                 stdout in this mode or the agent's parser breaks.
 * Any arguments → CLI for humans and CI.
 */
const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h')) {
  const { HELP } = await import('../src/cli.js');
  process.stdout.write(HELP);
  process.exit(0);
}

if (argv.includes('--version') || argv.includes('-v')) {
  const { VERSION } = await import('../src/server.js');
  process.stdout.write(`${VERSION}\n`);
  process.exit(0);
}

try {
  if (argv.length === 0) {
    const { main } = await import('../src/server.js');
    await main();
  } else {
    const { runCli } = await import('../src/cli.js');
    process.exitCode = await runCli(argv);
  }
} catch (err) {
  process.stderr.write(`[pkgtruth] fatal: ${err?.message || err}\n`);
  process.exit(2);
}
