# Live slopsquats

_Generated 2026-10-12 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 127 came back DANGER;** 49 meet the
bar for this page and 78 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 1,848 | `cross-env` | npm security placeholder |
| `node.js` | 1,230 | `node` | npm security placeholder |
| `eslint-js` | 1,174 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 794 | `@supabase/supabase-js` | npm security placeholder |
| `mysqljs` | 156 | `mysql` | npm security placeholder |
| `unused-imports` | 150 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 132 | `nodemailer` | npm security placeholder |
| `azure-identity` | 94 | `@azure/identity` | npm security placeholder |
| `plugin-react` | 77 | `@vitejs/plugin-react` | npm security placeholder |
| `hookform-resolvers` | 72 | `@hookform/resolvers` | npm security placeholder |
| `icons-material` | 67 | `@mui/icons-material` | npm security placeholder, impersonates popular package |
| `types-node` | 32 | `@types/node` | npm security placeholder, almost no adoption |
| `commander-js` | 17 | `commander` | npm security placeholder, almost no adoption |
| `client-s3` | 16 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption |
| `sveltejs` | 16 | `svelte` | npm security placeholder, almost no adoption |
| `jestjs` | 11 | `jest` | npm security placeholder, almost no adoption |
| `node-pino` | 7 | `pino` | npm security placeholder, almost no adoption |
| `typescriptjs` | 3 | `typescript` | npm security placeholder, almost no adoption |
| `prettierjs` | 0 | `prettier` | npm security placeholder, almost no adoption |
| `node-prettier` | 0 | `prettier` | npm security placeholder, almost no adoption |
| `mocha-js` | 0 | `mocha` | npm security placeholder, almost no adoption |
| `vitestjs` | 0 | `vitest` | npm security placeholder, almost no adoption |
| `cypressjs` | 0 | `cypress` | npm security placeholder, almost no adoption |
| `jsdom-js` | 0 | `jsdom` | npm security placeholder, almost no adoption |
| `jsonwebtoken-js` | 0 | `jsonwebtoken` | npm security placeholder, almost no adoption |
| `nanoid-js` | 0 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `luxon-js` | 0 | `luxon` | npm security placeholder, almost no adoption, impersonates popular package |
| `zod-js` | 0 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `yupjs` | 0 | `yup` | npm security placeholder, almost no adoption |
| `yargs-js` | 0 | `yargs` | npm security placeholder, almost no adoption, impersonates popular package |
| `inquirer-js` | 0 | `inquirer` | npm security placeholder, almost no adoption |
| `winston-js` | 0 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-winston` | 0 | `winston` | npm security placeholder, almost no adoption |
| `immer-js` | 0 | `immer` | npm security placeholder, almost no adoption |
| `rxjs-js` | 0 | `rxjs` | npm security placeholder, almost no adoption, impersonates popular package |
| `nodemonjs` | 0 | `nodemon` | npm security placeholder, almost no adoption |

### B. Deprecated names whose own notice points elsewhere — 13

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 835,576 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 530,174 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 126,062 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `jest-dom` | 111,507 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `react-testing-library` | 44,400 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 21,541 | `@turf/turf` | deprecated, impersonates popular package |
| `babel-macros` | 16,935 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `socket-io` | 846 | `socket.io` | deprecated, impersonates popular package |
| `node-tar` | 676 | `tar` | deprecated |
| `expressjs` | 590 | `express` | deprecated |
| `auth0-react` | 113 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `node-semver` | 80 | `semver` | deprecated |
| `clerk-nextjs` | 23 | `@clerk/nextjs` | deprecated, almost no adoption |

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
| `sklearn` | 339,245 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 41,690 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
