# Live slopsquats

_Generated 2026-09-14 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

Garbling rules: scope dropped, dot↔hyphen, hyphen dropped, plugin prefix dropped, `js`
appended (npm); `python-`/`py` prefix added or dropped, digit suffix confusion,
plural/doubled letter, import-name-for-dist-name (PyPI).

Only DANGER verdicts are considered, and only two kinds of evidence are published:
npm's own security placeholders, and deprecation notices that name the real package.
Everything else the CLI would block is counted and withheld — a package that is merely
small or new is not evidence of anything.

## npm

Start from 240 well-known packages, produce the names a model plausibly emits
instead of each one, and run every candidate through pkgtruth. **773 candidates
checked; 263 exist on npm; 132 came back DANGER;** 50 meet the
bar for this page and 82 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `node.js` | 1,325 | `node` | npm security placeholder |
| `crossenv` | 1,260 | `cross-env` | npm security placeholder |
| `eslint-js` | 619 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 413 | `@supabase/supabase-js` | npm security placeholder |
| `unused-imports` | 235 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `mysqljs` | 154 | `mysql` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 128 | `nodemailer` | npm security placeholder, impersonates popular package |
| `icons-material` | 40 | `@mui/icons-material` | npm security placeholder, almost no adoption, impersonates popular package |
| `plugin-react` | 30 | `@vitejs/plugin-react` | npm security placeholder, almost no adoption |
| `azure-identity` | 30 | `@azure/identity` | npm security placeholder, almost no adoption |
| `sveltejs` | 17 | `svelte` | npm security placeholder, almost no adoption |
| `jestjs` | 13 | `jest` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 12 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `node-pino` | 12 | `pino` | npm security placeholder, very new, almost no adoption |
| `types-node` | 10 | `@types/node` | npm security placeholder, almost no adoption |
| `commander-js` | 9 | `commander` | npm security placeholder, almost no adoption, impersonates popular package |
| `client-s3` | 3 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption, impersonates popular package |
| `typescriptjs` | 3 | `typescript` | npm security placeholder, almost no adoption |
| `prettierjs` | 3 | `prettier` | npm security placeholder, almost no adoption |
| `node-winston` | 3 | `winston` | npm security placeholder, almost no adoption |
| `rxjs-js` | 3 | `rxjs` | npm security placeholder, almost no adoption |
| `node-prettier` | 2 | `prettier` | npm security placeholder, almost no adoption |
| `mocha-js` | 2 | `mocha` | npm security placeholder, almost no adoption |
| `jsdom-js` | 2 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `jsonwebtoken-js` | 2 | `jsonwebtoken` | npm security placeholder, almost no adoption |
| `nanoid-js` | 2 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `luxon-js` | 2 | `luxon` | npm security placeholder, almost no adoption, impersonates popular package |
| `yargs-js` | 2 | `yargs` | npm security placeholder, almost no adoption, impersonates popular package |
| `nodemonjs` | 2 | `nodemon` | npm security placeholder, almost no adoption |
| `vitestjs` | 1 | `vitest` | npm security placeholder, almost no adoption |
| `cypressjs` | 1 | `cypress` | npm security placeholder, almost no adoption |
| `zod-js` | 1 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `inquirer-js` | 1 | `inquirer` | npm security placeholder, almost no adoption |
| `immer-js` | 1 | `immer` | npm security placeholder, almost no adoption |
| `yupjs` | 0 | `yup` | npm security placeholder, almost no adoption |
| `winston-js` | 0 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |

### B. Deprecated names whose own notice points elsewhere — 14

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 708,220 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 546,833 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `jest-dom` | 92,677 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 76,029 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `react-testing-library` | 31,417 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 18,481 | `@turf/turf` | deprecated, impersonates popular package |
| `babel-macros` | 6,418 | `babel-plugin-macros` | deprecated |
| `auth0-react` | 821 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `socket-io` | 770 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 676 | `express` | deprecated |
| `node-tar` | 667 | `tar` | deprecated |
| `vuejs` | 391 | `vue` | deprecated |
| `node-semver` | 105 | `semver` | deprecated |
| `clerk-nextjs` | 8 | `@clerk/nextjs` | deprecated, almost no adoption |

## PyPI

Start from 124 well-known packages, produce the names a model plausibly emits
instead of each one, and run every candidate through pkgtruth. **1109 candidates
checked; 120 exist on PyPI; 81 came back DANGER;** 2 meet the
bar for this page and 79 are withheld.

PyPI deletes malicious projects outright rather than leaving a placeholder, so a purged
name simply no longer exists and is not listed here. What remains are names that exist,
take real installs, and say in their own metadata that they are not the package you meant.

### A. Deprecated names whose own notice points elsewhere — 2

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `sklearn` | 331,110 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 42,840 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
