# Live slopsquats

_Generated 2026-11-09 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 118 came back DANGER;** 49 meet the
bar for this page and 69 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 2,325 | `cross-env` | npm security placeholder |
| `eslint-js` | 1,616 | `@eslint/js` | npm security placeholder |
| `node.js` | 1,282 | `node` | npm security placeholder |
| `supabase-js` | 1,031 | `@supabase/supabase-js` | npm security placeholder |
| `mysqljs` | 240 | `mysql` | npm security placeholder, impersonates popular package |
| `unused-imports` | 236 | `eslint-plugin-unused-imports` | npm security placeholder |
| `plugin-react` | 211 | `@vitejs/plugin-react` | npm security placeholder |
| `nodemailer-js` | 183 | `nodemailer` | npm security placeholder |
| `azure-identity` | 174 | `@azure/identity` | npm security placeholder |
| `icons-material` | 98 | `@mui/icons-material` | npm security placeholder, impersonates popular package |
| `client-s3` | 61 | `@aws-sdk/client-s3` | npm security placeholder, impersonates popular package |
| `types-node` | 40 | `@types/node` | npm security placeholder, almost no adoption |
| `sveltejs` | 37 | `svelte` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 28 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `jestjs` | 26 | `jest` | npm security placeholder, almost no adoption |
| `commander-js` | 24 | `commander` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-pino` | 13 | `pino` | npm security placeholder, almost no adoption |
| `vitestjs` | 6 | `vitest` | npm security placeholder, almost no adoption |
| `prettierjs` | 4 | `prettier` | npm security placeholder, almost no adoption |
| `yupjs` | 4 | `yup` | npm security placeholder, almost no adoption |
| `immer-js` | 4 | `immer` | npm security placeholder, almost no adoption |
| `cypressjs` | 3 | `cypress` | npm security placeholder, almost no adoption |
| `jsdom-js` | 3 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `luxon-js` | 3 | `luxon` | npm security placeholder, almost no adoption |
| `winston-js` | 3 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `typescriptjs` | 2 | `typescript` | npm security placeholder, almost no adoption |
| `node-prettier` | 2 | `prettier` | npm security placeholder, almost no adoption |
| `zod-js` | 2 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `yargs-js` | 2 | `yargs` | npm security placeholder, almost no adoption |
| `nodemonjs` | 2 | `nodemon` | npm security placeholder, almost no adoption |
| `mocha-js` | 1 | `mocha` | npm security placeholder, almost no adoption, impersonates popular package |
| `nanoid-js` | 1 | `nanoid` | npm security placeholder, almost no adoption |
| `inquirer-js` | 1 | `inquirer` | npm security placeholder, almost no adoption |
| `node-winston` | 1 | `winston` | npm security placeholder, almost no adoption |
| `rxjs-js` | 1 | `rxjs` | npm security placeholder, almost no adoption |
| `jsonwebtoken-js` | 0 | `jsonwebtoken` | npm security placeholder, almost no adoption, impersonates popular package |

### B. Deprecated names whose own notice points elsewhere — 13

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `rollup-plugin-node-resolve` | 969,049 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `node-sass` | 849,528 | `sass` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 148,177 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `jest-dom` | 145,906 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `react-testing-library` | 53,502 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 25,310 | `@turf/turf` | deprecated, impersonates popular package |
| `babel-macros` | 11,205 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `socket-io` | 2,619 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 644 | `express` | deprecated |
| `node-tar` | 361 | `tar` | deprecated, impersonates popular package |
| `node-semver` | 303 | `semver` | deprecated |
| `auth0-react` | 241 | `@auth0/auth0-react` | deprecated |
| `clerk-nextjs` | 10 | `@clerk/nextjs` | deprecated, almost no adoption |

## PyPI

Start from 124 well-known packages, produce the names a model plausibly emits
instead of each one, and run every candidate through pkgtruth. **1109 candidates
checked; 120 exist on PyPI; 88 came back DANGER;** 2 meet the
bar for this page and 86 are withheld.

PyPI deletes malicious projects outright rather than leaving a placeholder, so a purged
name simply no longer exists and is not listed here. What remains are names that exist,
take real installs, and say in their own metadata that they are not the package you meant.

### A. Deprecated names whose own notice points elsewhere — 2

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `sklearn` | 436,463 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 41,147 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
