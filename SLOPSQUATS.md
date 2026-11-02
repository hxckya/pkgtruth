# Live slopsquats

_Generated 2026-11-02 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 114 came back DANGER;** 49 meet the
bar for this page and 65 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 2,854 | `cross-env` | npm security placeholder |
| `node.js` | 1,292 | `node` | npm security placeholder |
| `eslint-js` | 1,133 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 827 | `@supabase/supabase-js` | npm security placeholder, impersonates popular package |
| `mysqljs` | 262 | `mysql` | npm security placeholder, impersonates popular package |
| `unused-imports` | 221 | `eslint-plugin-unused-imports` | npm security placeholder |
| `nodemailer-js` | 190 | `nodemailer` | npm security placeholder, impersonates popular package |
| `plugin-react` | 93 | `@vitejs/plugin-react` | npm security placeholder |
| `icons-material` | 88 | `@mui/icons-material` | npm security placeholder, impersonates popular package |
| `azure-identity` | 82 | `@azure/identity` | npm security placeholder |
| `client-s3` | 48 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption |
| `sveltejs` | 48 | `svelte` | npm security placeholder, almost no adoption |
| `types-node` | 46 | `@types/node` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 40 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `jestjs` | 17 | `jest` | npm security placeholder, almost no adoption |
| `node-pino` | 17 | `pino` | npm security placeholder, almost no adoption |
| `commander-js` | 15 | `commander` | npm security placeholder, almost no adoption, impersonates popular package |
| `jsdom-js` | 8 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `nanoid-js` | 8 | `nanoid` | npm security placeholder, almost no adoption |
| `zod-js` | 8 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `typescriptjs` | 7 | `typescript` | npm security placeholder, almost no adoption |
| `prettierjs` | 7 | `prettier` | npm security placeholder, almost no adoption |
| `node-prettier` | 7 | `prettier` | npm security placeholder, almost no adoption |
| `luxon-js` | 7 | `luxon` | npm security placeholder, almost no adoption |
| `yargs-js` | 7 | `yargs` | npm security placeholder, almost no adoption |
| `inquirer-js` | 7 | `inquirer` | npm security placeholder, almost no adoption |
| `node-winston` | 7 | `winston` | npm security placeholder, almost no adoption |
| `immer-js` | 7 | `immer` | npm security placeholder, almost no adoption |
| `nodemonjs` | 7 | `nodemon` | npm security placeholder, almost no adoption |
| `mocha-js` | 6 | `mocha` | npm security placeholder, almost no adoption, impersonates popular package |
| `vitestjs` | 6 | `vitest` | npm security placeholder, almost no adoption |
| `cypressjs` | 6 | `cypress` | npm security placeholder, almost no adoption |
| `winston-js` | 6 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `rxjs-js` | 6 | `rxjs` | npm security placeholder, almost no adoption, impersonates popular package |
| `yupjs` | 5 | `yup` | npm security placeholder, almost no adoption |
| `jsonwebtoken-js` | 2 | `jsonwebtoken` | npm security placeholder, almost no adoption |

### B. Deprecated names whose own notice points elsewhere — 13

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 1,096,642 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 873,282 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `jest-dom` | 161,391 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 129,559 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `react-testing-library` | 51,160 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 24,313 | `@turf/turf` | deprecated, impersonates popular package |
| `babel-macros` | 12,298 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `socket-io` | 1,608 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 938 | `express` | deprecated |
| `node-tar` | 485 | `tar` | deprecated, impersonates popular package |
| `auth0-react` | 280 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `node-semver` | 92 | `semver` | deprecated |
| `clerk-nextjs` | 6 | `@clerk/nextjs` | deprecated, almost no adoption |

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
| `sklearn` | 474,138 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 41,103 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
