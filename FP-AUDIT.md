# False-positive audit

_Generated 2026-09-10 by [`scripts/fp-audit.mjs`](scripts/fp-audit.mjs)._

**Population:** the 240 well-known packages in `scripts/seeds.txt` plus every
direct dependency of each — **1523 unique real packages**. This is what a
dependency gate actually meets in practice: not a curated "known good" list,
but the dependency trees of popular software as published.

| verdict | count | share |
|---|---|---|
| SAFE | 1483 | 97.4% |
| CAUTION | 40 | 2.6% |
| DANGER | 0 | 0.0% |
| HALLUCINATED | 0 | 0.0% |
| UNKNOWN | 0 | 0.0% |

**Blocking rate (DANGER + HALLUCINATED): 0 of 1523 = 0.00%.**

## Blocking verdicts in this population — 0

Each row is either a false positive (open an issue — it becomes a regression
test) or a genuine problem in a popular package's dependency tree.

| verdict | package | installs / week | signals |
|---|---|---|---|
| — | | | |

## CAUTION — 40

Not blocking by default. Listed by signal so the noise profile is visible.

| signal | count |
|---|---|
| deprecated | 32 |
| unmaintained | 25 |
| no repository | 6 |
| very new | 3 |
| single version | 3 |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/fp-audit.mjs     # writes FP-AUDIT.md
```
