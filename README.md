# pkgtruth

[![npm](https://img.shields.io/npm/v/pkgtruth)](https://www.npmjs.com/package/pkgtruth)
[![CI](https://github.com/hxckya/pkgtruth/actions/workflows/ci.yml/badge.svg)](https://github.com/hxckya/pkgtruth/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/pkgtruth)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/pkgtruth)](LICENSE)

**Ground truth about npm packages, for AI coding agents and CI.**

Your agent just wrote `npm install unused-imports`. That package is not the
linter plugin it meant. It is a name an attacker registered because models
kept inventing it — and npm has since replaced it with a security placeholder.

`pkgtruth` catches that before it reaches your lockfile.

```
⛔ 2 of 4 package(s) must not be installed as-is.

HALLUCINATED  reqeusts-http-client
  "reqeusts-http-client" does not exist on npm.
  → did you mean: @actions/http-client, ws, @azure/core-http-compat

DANGER        unused-imports@0.0.1-security
  · npm replaced this package with a security placeholder (0.0.1-security).
    The name was used to publish malicious code.
  · Resolves to the same name as "eslint-plugin-unused-imports", which has
    9,603,111 weekly downloads (22,756x this one).

SAFE          express@5.2.1
SAFE          lodash@4.18.1
```

## Why this exists

Large language models invent package names. Measured across models,
**19.7% of generated package names were hallucinated**, and when researchers
re-ran the prompts, **43% of those names came back every single time.**

That reproducibility is the whole attack. An attacker does not need to
compromise a maintainer, poison a build server, or find a vulnerability. They
watch what models invent, register the name, and wait. The technique is called
**slopsquatting**, and it is already happening in the wild.

The standing security advice is that agents with package-management
capabilities should not install anything without a review gate. `pkgtruth` is
that gate, in a form an agent can call on its own.

## Install

### As an MCP server (for coding agents)

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

Two tools become available:

| Tool | Use it when |
| --- | --- |
| `check_package` | About to add, import, or recommend one dependency |
| `check_dependencies` | About to write a `package.json` or run an install command |

### As a CLI (for humans and CI)

```bash
npx pkgtruth check express unused-imports
npx pkgtruth scan .
```

`scan` reads every dependency in a `package.json` and exits non-zero when
something is blocking, so it drops straight into CI:

```yaml
- name: Block hallucinated and slopsquatted dependencies
  run: npx pkgtruth scan . --fail-on danger
```

## What it checks

| Signal | Meaning |
| --- | --- |
| **Not in registry** | The name is fabricated. Nothing to install. |
| **npm security placeholder** | npm removed malicious code published under this name. |
| **Impersonates a popular package** | A near-identical name with a fraction of the adoption. |
| **Install-time scripts** | `preinstall`/`install`/`postinstall` run code on `npm install`. |
| **Deprecated** | Upstream says stop using it. |
| **Very new / almost no adoption** | Days old with single-digit installs. |
| **No repository** | No source to audit. |
| **Unmaintained** | No release in years. |

Verdicts are `SAFE`, `CAUTION`, `DANGER`, `HALLUCINATED`, or `UNKNOWN`. Every
one arrives with the evidence behind it — an agent should never have to take
"DANGER" on faith, and neither should you.

## Design notes

**Network failures never open the gate.** If the registry is unreachable, the
verdict is `UNKNOWN`, never `SAFE`. A degraded network must not silently turn
a security check into a no-op.

**Popular packages are not flagged.** Checked against a real 18-dependency
project, zero false positives. A gate that cries wolf gets switched off.

**No build step.** Two direct dependencies — the MCP SDK and `zod`, both only
needed for the server. `npx pkgtruth` starts immediately.

## Limitations

Read these before trusting it:

- **npm only.** PyPI, crates.io, and Go modules are not covered yet.
- **Registry metadata only.** It does not analyze package source code, so a
  legitimate-looking package with a malicious payload can still pass.
- **Not a replacement for `npm audit` or Snyk.** Those find known CVEs in code
  you already trust. `pkgtruth` asks the earlier question: should this package
  be here at all?
- **New legitimate packages will get `CAUTION`.** That is deliberate. Newness
  genuinely is a risk signal; use `--fail-on danger` so it does not block.

## Options

```
--json              Machine-readable output
--fail-on <level>   danger (default) | caution
```

`--fail-on caution` also blocks packages that could not be verified at all,
since "we could not check" is not a pass.

Exit codes: `0` clean, `1` blocking packages found, `2` usage or runtime error.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PKGTRUTH_TIMEOUT_MS` | `8000` | Per-request timeout |
| `PKGTRUTH_RETRIES` | `3` | Retries for 429/5xx/network errors |
| `PKGTRUTH_MAX_CONCURRENCY` | per-host | Override request pacing |
| `PKGTRUTH_REGISTRY` | npm | Alternate registry |
| `PKGTRUTH_DOWNLOADS_API` | npm | Alternate downloads API |
| `PKGTRUTH_CACHE_DIR` | `~/.cache/pkgtruth` | Where adoption figures are cached |
| `PKGTRUTH_DISK_TTL_MS` | 6 hours | How long a cached figure stays usable |
| `PKGTRUTH_NO_DISK_CACHE` | unset | Set to `1` to disable the cache |

### On speed and rate limits

Adoption figures come from npm's downloads API, which throttles bursts and
cannot batch scoped names — a project with several `@scope/pkg` dependencies
would spend its whole budget on every scan.

Three things keep that in check: the bulk endpoint resolves all unscoped names
in one request, requests to that host are paced serially, and figures are
cached on disk for six hours. Weekly download counts move slowly, so a
six-hour-old number is no less true.

A warm scan of ~18 dependencies takes about 1.4 seconds. A cold one after
heavy use may return `UNKNOWN` for some packages — that is the intended
failure mode. A throttled lookup never becomes `SAFE`; re-run, and the cache
will answer.

Cached figures are keyed by the API they came from, so pointing
`PKGTRUTH_DOWNLOADS_API` at a private registry never reuses npm's numbers.

## Contributing

Issues and pull requests are welcome at
[github.com/hxckya/pkgtruth](https://github.com/hxckya/pkgtruth).

Two things make a report especially useful: a legitimate package that gets
flagged, and a malicious one that slips through. Both are regression tests
waiting to be written.

```bash
npm test                 # offline
npm run test:online      # includes live registry checks
```

## License

MIT © hxckya
