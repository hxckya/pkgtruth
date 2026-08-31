# pkgtruth

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

Exit codes: `0` clean, `1` blocking packages found, `2` usage or runtime error.

## License

MIT
