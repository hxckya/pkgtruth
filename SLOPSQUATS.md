# Live slopsquats

_Generated 2026-09-10 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 130 came back DANGER;** 50 meet the
bar for this page and 80 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 1,437 | `cross-env` | npm security placeholder |
| `node.js` | 813 | `node` | npm security placeholder |
| `eslint-js` | 612 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 397 | `@supabase/supabase-js` | npm security placeholder |
| `mysqljs` | 231 | `mysql` | npm security placeholder, impersonates popular package |
| `unused-imports` | 209 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 174 | `nodemailer` | npm security placeholder, impersonates popular package |
| `plugin-react` | 119 | `@vitejs/plugin-react` | npm security placeholder |
| `azure-identity` | 38 | `@azure/identity` | npm security placeholder, almost no adoption |
| `icons-material` | 31 | `@mui/icons-material` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-pino` | 18 | `pino` | npm security placeholder, very new, almost no adoption |
| `hookform-resolvers` | 14 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `sveltejs` | 12 | `svelte` | npm security placeholder, almost no adoption |
| `jestjs` | 11 | `jest` | npm security placeholder, almost no adoption |
| `types-node` | 10 | `@types/node` | npm security placeholder, almost no adoption |
| `commander-js` | 10 | `commander` | npm security placeholder, almost no adoption, impersonates popular package |
| `client-s3` | 5 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption, impersonates popular package |
| `cypressjs` | 5 | `cypress` | npm security placeholder, almost no adoption |
| `inquirer-js` | 5 | `inquirer` | npm security placeholder, almost no adoption |
| `rxjs-js` | 5 | `rxjs` | npm security placeholder, almost no adoption, impersonates popular package |
| `vitestjs` | 4 | `vitest` | npm security placeholder, almost no adoption |
| `jsdom-js` | 4 | `jsdom` | npm security placeholder, almost no adoption |
| `yargs-js` | 4 | `yargs` | npm security placeholder, almost no adoption, impersonates popular package |
| `prettierjs` | 3 | `prettier` | npm security placeholder, almost no adoption |
| `node-prettier` | 3 | `prettier` | npm security placeholder, almost no adoption |
| `nanoid-js` | 3 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `luxon-js` | 3 | `luxon` | npm security placeholder, almost no adoption, impersonates popular package |
| `nodemonjs` | 3 | `nodemon` | npm security placeholder, almost no adoption |
| `typescriptjs` | 2 | `typescript` | npm security placeholder, almost no adoption |
| `node-winston` | 2 | `winston` | npm security placeholder, almost no adoption |
| `mocha-js` | 1 | `mocha` | npm security placeholder, almost no adoption |
| `jsonwebtoken-js` | 1 | `jsonwebtoken` | npm security placeholder, almost no adoption, impersonates popular package |
| `yupjs` | 1 | `yup` | npm security placeholder, almost no adoption |
| `winston-js` | 1 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `immer-js` | 1 | `immer` | npm security placeholder, almost no adoption, impersonates popular package |
| `zod-js` | 0 | `zod` | npm security placeholder, almost no adoption |

### B. Deprecated names whose own notice points elsewhere — 14

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 888,354 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 653,951 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `jest-dom` | 111,480 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 74,739 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `react-testing-library` | 29,323 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 25,111 | `@turf/turf` | deprecated, impersonates popular package |
| `babel-macros` | 12,487 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `socket-io` | 1,094 | `socket.io` | deprecated, impersonates popular package |
| `auth0-react` | 888 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `expressjs` | 772 | `Express` | deprecated |
| `node-tar` | 456 | `tar` | deprecated, impersonates popular package |
| `vuejs` | 432 | `vue` | deprecated |
| `node-semver` | 50 | `semver` | deprecated |
| `clerk-nextjs` | 1 | `@clerk/nextjs` | deprecated, almost no adoption |

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
| `sklearn` | 321,887 | `scikit-learn` | deprecated |
| `pytorch` | 41,026 | `torch` | deprecated |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
