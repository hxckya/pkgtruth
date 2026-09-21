# Live slopsquats

_Generated 2026-09-21 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 133 came back DANGER;** 50 meet the
bar for this page and 83 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `node.js` | 1,524 | `node` | npm security placeholder |
| `crossenv` | 1,223 | `cross-env` | npm security placeholder, impersonates popular package |
| `eslint-js` | 743 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 565 | `@supabase/supabase-js` | npm security placeholder, impersonates popular package |
| `mysqljs` | 181 | `mysql` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 135 | `nodemailer` | npm security placeholder |
| `unused-imports` | 112 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `icons-material` | 72 | `@mui/icons-material` | npm security placeholder |
| `plugin-react` | 69 | `@vitejs/plugin-react` | npm security placeholder |
| `azure-identity` | 23 | `@azure/identity` | npm security placeholder, almost no adoption |
| `jestjs` | 23 | `jest` | npm security placeholder, almost no adoption |
| `types-node` | 21 | `@types/node` | npm security placeholder, almost no adoption |
| `sveltejs` | 20 | `svelte` | npm security placeholder, almost no adoption |
| `client-s3` | 14 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption |
| `node-pino` | 13 | `pino` | npm security placeholder, very new, almost no adoption |
| `hookform-resolvers` | 9 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `commander-js` | 9 | `commander` | npm security placeholder, almost no adoption, impersonates popular package |
| `vitestjs` | 5 | `vitest` | npm security placeholder, almost no adoption |
| `nanoid-js` | 4 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `mocha-js` | 3 | `mocha` | npm security placeholder, almost no adoption, impersonates popular package |
| `luxon-js` | 3 | `luxon` | npm security placeholder, almost no adoption |
| `zod-js` | 3 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `nodemonjs` | 3 | `nodemon` | npm security placeholder, almost no adoption |
| `prettierjs` | 2 | `prettier` | npm security placeholder, almost no adoption |
| `node-prettier` | 2 | `prettier` | npm security placeholder, almost no adoption |
| `jsdom-js` | 2 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `yupjs` | 2 | `yup` | npm security placeholder, almost no adoption |
| `winston-js` | 2 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-winston` | 2 | `winston` | npm security placeholder, almost no adoption |
| `immer-js` | 2 | `immer` | npm security placeholder, almost no adoption |
| `rxjs-js` | 2 | `rxjs` | npm security placeholder, almost no adoption |
| `typescriptjs` | 1 | `typescript` | npm security placeholder, almost no adoption |
| `cypressjs` | 1 | `cypress` | npm security placeholder, almost no adoption |
| `yargs-js` | 1 | `yargs` | npm security placeholder, almost no adoption |
| `inquirer-js` | 1 | `inquirer` | npm security placeholder, almost no adoption |
| `jsonwebtoken-js` | 0 | `jsonwebtoken` | npm security placeholder, almost no adoption, impersonates popular package |

### B. Deprecated names whose own notice points elsewhere — 14

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 934,897 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 630,464 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 120,404 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `jest-dom` | 91,654 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `react-testing-library` | 39,680 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 18,617 | `@turf/turf` | deprecated, impersonates popular package |
| `babel-macros` | 9,930 | `babel-plugin-macros` | deprecated |
| `node-tar` | 1,093 | `tar` | deprecated |
| `socket-io` | 879 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 643 | `express` | deprecated |
| `auth0-react` | 482 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `vuejs` | 443 | `vue` | deprecated |
| `node-semver` | 255 | `semver` | deprecated |
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
| `sklearn` | 338,521 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 43,020 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
