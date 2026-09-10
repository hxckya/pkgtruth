import { createRequire } from 'node:module';

// One source of truth for the version string: package.json. The MCP server
// reports it in its handshake and the CLI prints it for --version.
export const VERSION = createRequire(import.meta.url)('../package.json').version;
