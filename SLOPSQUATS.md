# Live slopsquats

_Generated 2026-10-26 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 125 came back DANGER;** 50 meet the
bar for this page and 75 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 1,040 | `cross-env` | npm security placeholder, impersonates popular package |
| `node.js` | 694 | `node` | npm security placeholder |
| `eslint-js` | 230 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 222 | `@supabase/supabase-js` | npm security placeholder, impersonates popular package |
| `mysqljs` | 126 | `mysql` | npm security placeholder, impersonates popular package |
| `unused-imports` | 92 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 75 | `nodemailer` | npm security placeholder, impersonates popular package |
| `azure-identity` | 37 | `@azure/identity` | npm security placeholder, almost no adoption |
| `icons-material` | 34 | `@mui/icons-material` | npm security placeholder, almost no adoption |
| `plugin-react` | 34 | `@vitejs/plugin-react` | npm security placeholder, almost no adoption |
| `types-node` | 20 | `@types/node` | npm security placeholder, almost no adoption |
| `client-s3` | 11 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption, impersonates popular package |
| `sveltejs` | 11 | `svelte` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 8 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `prettierjs` | 5 | `prettier` | npm security placeholder, almost no adoption |
| `jestjs` | 5 | `jest` | npm security placeholder, almost no adoption |
| `nanoid-js` | 4 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `mocha-js` | 3 | `mocha` | npm security placeholder, almost no adoption, impersonates popular package |
| `vitestjs` | 3 | `vitest` | npm security placeholder, almost no adoption |
| `commander-js` | 3 | `commander` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-pino` | 3 | `pino` | npm security placeholder, almost no adoption |
| `typescriptjs` | 2 | `typescript` | npm security placeholder, almost no adoption |
| `node-prettier` | 2 | `prettier` | npm security placeholder, almost no adoption |
| `cypressjs` | 2 | `cypress` | npm security placeholder, almost no adoption |
| `node-winston` | 2 | `winston` | npm security placeholder, almost no adoption |
| `nodemonjs` | 2 | `nodemon` | npm security placeholder, almost no adoption |
| `jsdom-js` | 1 | `jsdom` | npm security placeholder, almost no adoption |
| `luxon-js` | 1 | `luxon` | npm security placeholder, almost no adoption, impersonates popular package |
| `zod-js` | 1 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `yargs-js` | 1 | `yargs` | npm security placeholder, almost no adoption |
| `winston-js` | 1 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `immer-js` | 1 | `immer` | npm security placeholder, almost no adoption |
| `jsonwebtoken-js` | 0 | `jsonwebtoken` | npm security placeholder, almost no adoption, impersonates popular package |
| `yupjs` | 0 | `yup` | npm security placeholder, almost no adoption |
| `inquirer-js` | 0 | `inquirer` | npm security placeholder, almost no adoption |
| `rxjs-js` | 0 | `rxjs` | npm security placeholder, almost no adoption, impersonates popular package |

### B. Deprecated names whose own notice points elsewhere — 14

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 538,182 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 430,335 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 76,647 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `jest-dom` | 72,090 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `react-testing-library` | 28,714 | `@testing-library/react` | deprecated, impersonates popular package |
| `babel-macros` | 12,994 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `turf` | 10,294 | `@turf/turf` | deprecated, impersonates popular package |
| `socket-io` | 573 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 369 | `express` | deprecated |
| `vuejs` | 337 | `vue` | deprecated |
| `node-tar` | 213 | `tar` | deprecated, impersonates popular package |
| `auth0-react` | 129 | `@auth0/auth0-react` | deprecated |
| `node-semver` | 72 | `semver` | deprecated |
| `clerk-nextjs` | 13 | `@clerk/nextjs` | deprecated, almost no adoption |

## PyPI

Start from 124 well-known packages, produce the names a model plausibly emits
instead of each one, and run every candidate through pkgtruth. **1109 candidates
checked; 120 exist on PyPI; 86 came back DANGER;** 2 meet the
bar for this page and 84 are withheld.

PyPI deletes malicious projects outright rather than leaving a placeholder, so a purged
name simply no longer exists and is not listed here. What remains are names that exist,
take real installs, and say in their own metadata that they are not the package you meant.

### A. Deprecated names whose own notice points elsewhere — 2

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `sklearn` | 316,966 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 42,046 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
