# Live slopsquats

_Generated 2026-10-19 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 131 came back DANGER;** 50 meet the
bar for this page and 81 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 853 | `cross-env` | npm security placeholder, impersonates popular package |
| `node.js` | 589 | `node` | npm security placeholder |
| `eslint-js` | 581 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 167 | `@supabase/supabase-js` | npm security placeholder |
| `mysqljs` | 136 | `mysql` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 105 | `nodemailer` | npm security placeholder, impersonates popular package |
| `unused-imports` | 87 | `eslint-plugin-unused-imports` | npm security placeholder |
| `plugin-react` | 42 | `@vitejs/plugin-react` | npm security placeholder, almost no adoption |
| `icons-material` | 29 | `@mui/icons-material` | npm security placeholder, almost no adoption, impersonates popular package |
| `azure-identity` | 23 | `@azure/identity` | npm security placeholder, almost no adoption |
| `jestjs` | 15 | `jest` | npm security placeholder, almost no adoption |
| `types-node` | 14 | `@types/node` | npm security placeholder, almost no adoption |
| `client-s3` | 12 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption |
| `commander-js` | 10 | `commander` | npm security placeholder, almost no adoption |
| `sveltejs` | 9 | `svelte` | npm security placeholder, almost no adoption |
| `prettierjs` | 6 | `prettier` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 5 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `nanoid-js` | 5 | `nanoid` | npm security placeholder, almost no adoption |
| `typescriptjs` | 4 | `typescript` | npm security placeholder, almost no adoption |
| `node-pino` | 4 | `pino` | npm security placeholder, almost no adoption |
| `cypressjs` | 3 | `cypress` | npm security placeholder, almost no adoption |
| `yargs-js` | 3 | `yargs` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-winston` | 3 | `winston` | npm security placeholder, almost no adoption |
| `node-prettier` | 2 | `prettier` | npm security placeholder, almost no adoption |
| `mocha-js` | 2 | `mocha` | npm security placeholder, almost no adoption |
| `luxon-js` | 2 | `luxon` | npm security placeholder, almost no adoption, impersonates popular package |
| `yupjs` | 2 | `yup` | npm security placeholder, almost no adoption |
| `rxjs-js` | 2 | `rxjs` | npm security placeholder, almost no adoption |
| `nodemonjs` | 2 | `nodemon` | npm security placeholder, almost no adoption |
| `vitestjs` | 1 | `vitest` | npm security placeholder, almost no adoption |
| `jsdom-js` | 1 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `jsonwebtoken-js` | 1 | `jsonwebtoken` | npm security placeholder, almost no adoption |
| `immer-js` | 1 | `immer` | npm security placeholder, almost no adoption, impersonates popular package |
| `zod-js` | 0 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `inquirer-js` | 0 | `inquirer` | npm security placeholder, almost no adoption |
| `winston-js` | 0 | `winston` | npm security placeholder, almost no adoption |

### B. Deprecated names whose own notice points elsewhere — 14

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 582,518 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 406,581 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 72,133 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `jest-dom` | 62,693 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `react-testing-library` | 27,051 | `@testing-library/react` | deprecated, impersonates popular package |
| `babel-macros` | 10,509 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `turf` | 10,235 | `@turf/turf` | deprecated, impersonates popular package |
| `socket-io` | 728 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 418 | `express` | deprecated |
| `node-tar` | 293 | `tar` | deprecated, impersonates popular package |
| `vuejs` | 242 | `vue` | deprecated |
| `node-semver` | 80 | `semver` | deprecated |
| `auth0-react` | 17 | `@auth0/auth0-react` | deprecated, almost no adoption |
| `clerk-nextjs` | 1 | `@clerk/nextjs` | deprecated, almost no adoption |

## PyPI

Start from 124 well-known packages, produce the names a model plausibly emits
instead of each one, and run every candidate through pkgtruth. **1109 candidates
checked; 120 exist on PyPI; 87 came back DANGER;** 2 meet the
bar for this page and 85 are withheld.

PyPI deletes malicious projects outright rather than leaving a placeholder, so a purged
name simply no longer exists and is not listed here. What remains are names that exist,
take real installs, and say in their own metadata that they are not the package you meant.

### A. Deprecated names whose own notice points elsewhere — 2

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `sklearn` | 344,639 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 42,274 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
