# Installing pkgtruth (for agents)

pkgtruth is a stdio MCP server distributed on npm. There is nothing to build,
no API key, and no environment variable is required.

## 1. Add it to the MCP client configuration

```json
{
  "mcpServers": {
    "pkgtruth": {
      "command": "npx",
      "args": ["-y", "pkgtruth"]
    }
  }
}
```

Requirements: Node.js 20 or newer on PATH (`node --version`). `npx -y` downloads
the package on first run; later runs use the npm cache.

If the environment blocks `npx`, install globally instead and point the client
at the binary:

```bash
npm install -g pkgtruth
which pkgtruth   # use this path as "command", with no args
```

## 2. Verify

Run the CLI once outside the client. It should print verdicts and exit 1
(because two of these names are bad on purpose):

```bash
npx -y pkgtruth check express unused-imports imageprocessor-lite
```

Expected: `express` SAFE, `unused-imports` DANGER (npm security placeholder),
`imageprocessor-lite` HALLUCINATED (does not exist).

## 3. Tools exposed

| tool | arguments | use |
|---|---|---|
| `check_package` | `{ "name": "<npm package>" }` | before adding, importing, or recommending one dependency |
| `check_dependencies` | `{ "names": ["<pkg>", ...] }` (≤50) | before writing `package.json` or `requirements.txt` |
| `check_install_command` | `{ "command": "npm install <pkg>" }` | before running an install or `npx` command — pass the exact command |

Every tool takes an optional `"ecosystem": "npm" | "pypi"` (default npm);
`check_install_command` infers it from the command. All return a verdict per package — `SAFE`, `CAUTION`, `DANGER`, `HALLUCINATED`,
or `UNKNOWN` — with the evidence behind it. Treat `HALLUCINATED` and `DANGER`
as "do not install"; treat `UNKNOWN` as "could not verify", never as safe.

## 4. Optional: block the install command itself (Claude Code)

Add a PreToolUse hook so `npm install`, `npx`, `pip install`, `uv add` and
similar are denied when they name a blocked package, whether or not the
agent thought to call a tool first. In `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "npx -y pkgtruth hook" }] }
    ]
  }
}
```

Non-install commands pass through with no output. A blocked command returns
exit 2 and a `permissionDecision: "deny"` whose reason names the real package.

## Optional configuration

All optional; defaults work for the public npm registry.

| variable | purpose |
|---|---|
| `PKGTRUTH_REGISTRY` | alternate registry URL (private registries) |
| `PKGTRUTH_DOWNLOADS_API` | alternate downloads API |
| `PKGTRUTH_CACHE_DIR` | where adoption figures are cached (default `~/.cache/pkgtruth`) |
| `PKGTRUTH_TIMEOUT_MS` | per-request timeout (default 8000) |

## Troubleshooting

- **`UNKNOWN` for many packages** — the registry rate-limited a burst. Re-run;
  results are cached and the second pass is fast.
- **TLS errors behind a corporate proxy** — set `NODE_EXTRA_CA_CERTS` to your
  CA bundle for the process running the server.
- **Nothing happens in the client** — the server speaks only JSON-RPC on stdout;
  confirm the client is launching `npx -y pkgtruth` with **no** extra arguments
  (arguments switch it into CLI mode).
