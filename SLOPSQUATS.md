# Live slopsquats

_Generated 2026-11-23 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 116 came back DANGER;** 49 meet the
bar for this page and 67 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 2,460 | `cross-env` | npm security placeholder, impersonates popular package |
| `eslint-js` | 2,207 | `@eslint/js` | npm security placeholder |
| `node.js` | 1,266 | `node` | npm security placeholder |
| `supabase-js` | 576 | `@supabase/supabase-js` | npm security placeholder |
| `unused-imports` | 244 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `mysqljs` | 240 | `mysql` | npm security placeholder, impersonates popular package |
| `plugin-react` | 204 | `@vitejs/plugin-react` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 195 | `nodemailer` | npm security placeholder |
| `azure-identity` | 99 | `@azure/identity` | npm security placeholder |
| `icons-material` | 70 | `@mui/icons-material` | npm security placeholder, impersonates popular package |
| `sveltejs` | 31 | `svelte` | npm security placeholder, almost no adoption |
| `client-s3` | 28 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption, impersonates popular package |
| `jestjs` | 27 | `jest` | npm security placeholder, almost no adoption |
| `types-node` | 19 | `@types/node` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 15 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `commander-js` | 15 | `commander` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-pino` | 12 | `pino` | npm security placeholder, almost no adoption |
| `typescriptjs` | 6 | `typescript` | npm security placeholder, almost no adoption |
| `prettierjs` | 6 | `prettier` | npm security placeholder, almost no adoption |
| `luxon-js` | 6 | `luxon` | npm security placeholder, almost no adoption |
| `mocha-js` | 5 | `mocha` | npm security placeholder, almost no adoption |
| `vitestjs` | 5 | `vitest` | npm security placeholder, almost no adoption |
| `cypressjs` | 5 | `cypress` | npm security placeholder, almost no adoption |
| `jsdom-js` | 5 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `winston-js` | 5 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `immer-js` | 5 | `immer` | npm security placeholder, almost no adoption, impersonates popular package |
| `nodemonjs` | 5 | `nodemon` | npm security placeholder, almost no adoption |
| `node-prettier` | 4 | `prettier` | npm security placeholder, almost no adoption |
| `nanoid-js` | 4 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `inquirer-js` | 4 | `inquirer` | npm security placeholder, almost no adoption |
| `node-winston` | 4 | `winston` | npm security placeholder, almost no adoption |
| `zod-js` | 3 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `yupjs` | 3 | `yup` | npm security placeholder, almost no adoption |
| `yargs-js` | 3 | `yargs` | npm security placeholder, almost no adoption, impersonates popular package |
| `rxjs-js` | 3 | `rxjs` | npm security placeholder, almost no adoption, impersonates popular package |
| `jsonwebtoken-js` | 0 | `jsonwebtoken` | npm security placeholder, almost no adoption, impersonates popular package |

### B. Deprecated names whose own notice points elsewhere — 13

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `rollup-plugin-node-resolve` | 895,446 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `node-sass` | 788,528 | `sass` | deprecated, impersonates popular package |
| `babel-macros` | 218,660 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `jest-dom` | 155,421 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 137,350 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `react-testing-library` | 47,728 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 21,429 | `@turf/turf` | deprecated, impersonates popular package |
| `socket-io` | 2,829 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 1,026 | `express` | deprecated |
| `auth0-react` | 557 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `node-tar` | 383 | `tar` | deprecated, impersonates popular package |
| `node-semver` | 109 | `semver` | deprecated |
| `clerk-nextjs` | 22 | `@clerk/nextjs` | deprecated, almost no adoption |

## PyPI

Start from 124 well-known packages, produce the names a model plausibly emits
instead of each one, and run every candidate through pkgtruth. **1109 candidates
checked; 118 exist on PyPI; 87 came back DANGER;** 2 meet the
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
| `sklearn` | 353,396 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 40,411 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
