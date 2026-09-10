# pkgtruth

[![npm](https://img.shields.io/npm/v/pkgtruth)](https://www.npmjs.com/package/pkgtruth)
[![CI](https://github.com/hxckya/pkgtruth/actions/workflows/ci.yml/badge.svg)](https://github.com/hxckya/pkgtruth/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/pkgtruth)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/pkgtruth)](LICENSE)

**Ground truth about npm and PyPI packages, for AI coding agents and CI.**

![pkgtruth catching a hallucinated package and a slopsquat](https://raw.githubusercontent.com/hxckya/pkgtruth/main/assets/demo.gif)

Your agent just wrote `npm install unused-imports`. That package is not the
linter plugin it meant. It is a name an attacker registered because models
kept inventing it — and npm has since replaced it with a security placeholder.

`pkgtruth` catches that before it reaches your lockfile.


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

## Found in the wild

Two names a model plausibly produces, both live on npm today:

| Name | What it is | Weekly installs | The real one |
| --- | --- | --- | --- |
| `types-node` | `0.0.1-security` — npm's placeholder after purging malware | 10 | `@types/node` (429M) |
| `socket-io` | Deprecated since 2022, "use the socket.io package instead" | 1,486 | `socket.io` (18M) |

`types-node` is what you get when a model drops the scope from `@types/node`.
npm removed it for malicious code in December 2024 and it is still installed
ten times a week.

`socket-io` is not malicious — it is an abandoned package with a confusable
name. That it takes 1,486 installs a week anyway is the point: a dot and a
hyphen are enough.

PyPI has the same shape without the placeholder:

| Name | What it is | Weekly installs | The real one |
| --- | --- | --- | --- |
| `sklearn` | Deprecated shim — its own notice says "use scikit-learn instead" | 321,887 | `scikit-learn` (42.6M) |
| `pytorch` | A decoy whose only content is "the package named for PyTorch is torch" | 41,026 | `torch` (14.4M) |

Neither is spelled anything like the package it stands in for, which is why
pkgtruth also reads what a deprecation notice *says*: when it names a far more
popular package, that name is the evidence.

```bash
npx pkgtruth check types-node socket-io
npx pkgtruth check -e pypi sklearn pytorch
```

Those two came from a hand check of twenty names. The systematic version —
242 well-known packages, every plausible garbling of each, regenerated every
Monday — lives in **[SLOPSQUATS.md](SLOPSQUATS.md)**. Section A there is
npm security placeholders alone: names npm purged for malware that are still
being installed this week.

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
| `check_package` | About to add, import, or recommend one dependency (`ecosystem: "npm" \| "pypi"`, default npm) |
| `check_dependencies` | About to write a `package.json` / `requirements.txt` or run an install command |

### As a CLI (for humans and CI)

```bash
npx pkgtruth check express unused-imports          # npm (default)
npx pkgtruth check -e pypi requests sklearn        # PyPI
npx pkgtruth scan .                                 # every manifest in the directory
```

`scan` reads `package.json`, `requirements*.txt` and `pyproject.toml`
(PEP 621 and Poetry), checks each against its own registry, and exits
non-zero when something is blocking, so it drops straight into CI.

### As a pull-request gate (GitHub Action)

[`hxckya/pkgtruth-action`](https://github.com/marketplace/actions/pkgtruth) (on the
GitHub Marketplace) runs the scan on every pull request, posts one sticky comment with the evidence, and
fails the check on `HALLUCINATED` or `DANGER`:

```yaml
on:
  pull_request:
    paths: ['package.json', '**/package.json']
permissions:
  contents: read
  pull-requests: write
jobs:
  pkgtruth:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: hxckya/pkgtruth-action@v1
```

This repository gates itself with it — see
[`.github/workflows/gate.yml`](.github/workflows/gate.yml), which also proves
the gate can fail by running it against a deliberately bad fixture.

## What it checks

| Signal | Meaning |
| --- | --- |
| **Not in registry** | The name is fabricated. Nothing to install. |
| **npm security placeholder** | npm removed malicious code published under this name. |
| **Impersonates a popular package** | A near-identical name with a fraction of the adoption — or a deprecation notice that itself names the package you meant (`sklearn` → `scikit-learn`, `pytorch` → `torch`). |
| **Yanked** (PyPI) | Every file of the latest release was yanked by its maintainer. |
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

**Popular packages are not flagged — measured, not asserted.** The
[false-positive audit](FP-AUDIT.md) runs the detector over the direct
dependency closure of 240 well-known packages: **1,523 real packages, 0
blocking verdicts, 0 UNKNOWN** after the built-in second pass, and 40 CAUTION
(deprecated or unmaintained — true statements, not blocked by default). A gate
that cries wolf gets switched off; this one has a number attached.

**No build step.** Two direct dependencies — the MCP SDK and `zod`, both only
needed for the server. `npx pkgtruth` starts immediately.

## Limitations

Read these before trusting it:

- **npm and PyPI only.** crates.io, Go modules, RubyGems are not covered yet.
- **PyPI has no purge marker.** npm leaves a `-security` placeholder where it
  removed malware; PyPI deletes the project, so a purged PyPI name simply
  reads as `HALLUCINATED`. PyPI also has no search API — near-twins are found
  against a daily snapshot of the top 15,000 projects by downloads, so an
  impostor of an obscure package will not be caught.
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
| `PKGTRUTH_PYPI` / `PKGTRUTH_PYPISTATS` | pypi.org / pypistats.org | Alternate PyPI endpoints |
| `PKGTRUTH_PYPI_TOP` | hugovk top-pypi-packages | Alternate popularity snapshot for PyPI twins |
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

A warm scan of ~18 dependencies takes about 1.4 seconds. Large scans that
draw 429s from the downloads API leave some packages `UNKNOWN` on the first
pass; every entry point then re-checks only those names, serially, after a
short pause. In the 1,523-package audit that second pass cleared all of them.
A throttled lookup never becomes `SAFE`.

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
