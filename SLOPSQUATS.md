# Live slopsquats

_Generated 2026-10-05 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 126 came back DANGER;** 49 meet the
bar for this page and 77 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 2,201 | `cross-env` | npm security placeholder, impersonates popular package |
| `node.js` | 1,534 | `node` | npm security placeholder |
| `supabase-js` | 1,098 | `@supabase/supabase-js` | npm security placeholder |
| `eslint-js` | 586 | `@eslint/js` | npm security placeholder |
| `mysqljs` | 225 | `mysql` | npm security placeholder, impersonates popular package |
| `unused-imports` | 202 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 147 | `nodemailer` | npm security placeholder |
| `azure-identity` | 121 | `@azure/identity` | npm security placeholder |
| `icons-material` | 111 | `@mui/icons-material` | npm security placeholder, impersonates popular package |
| `plugin-react` | 50 | `@vitejs/plugin-react` | npm security placeholder |
| `jestjs` | 31 | `jest` | npm security placeholder, almost no adoption |
| `types-node` | 30 | `@types/node` | npm security placeholder, almost no adoption |
| `client-s3` | 21 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 21 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `typescriptjs` | 21 | `typescript` | npm security placeholder, almost no adoption |
| `sveltejs` | 18 | `svelte` | npm security placeholder, almost no adoption |
| `node-pino` | 16 | `pino` | npm security placeholder, almost no adoption |
| `commander-js` | 3 | `commander` | npm security placeholder, almost no adoption |
| `vitestjs` | 2 | `vitest` | npm security placeholder, almost no adoption |
| `cypressjs` | 2 | `cypress` | npm security placeholder, almost no adoption |
| `luxon-js` | 2 | `luxon` | npm security placeholder, almost no adoption |
| `zod-js` | 2 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `yupjs` | 2 | `yup` | npm security placeholder, almost no adoption |
| `yargs-js` | 2 | `yargs` | npm security placeholder, almost no adoption, impersonates popular package |
| `nodemonjs` | 2 | `nodemon` | npm security placeholder, almost no adoption |
| `mocha-js` | 1 | `mocha` | npm security placeholder, almost no adoption |
| `jsdom-js` | 1 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `inquirer-js` | 1 | `inquirer` | npm security placeholder, almost no adoption |
| `winston-js` | 1 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `prettierjs` | 0 | `prettier` | npm security placeholder, almost no adoption |
| `node-prettier` | 0 | `prettier` | npm security placeholder, almost no adoption |
| `jsonwebtoken-js` | 0 | `jsonwebtoken` | npm security placeholder, almost no adoption, impersonates popular package |
| `nanoid-js` | 0 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-winston` | 0 | `winston` | npm security placeholder, almost no adoption |
| `immer-js` | 0 | `immer` | npm security placeholder, almost no adoption, impersonates popular package |
| `rxjs-js` | 0 | `rxjs` | npm security placeholder, almost no adoption, impersonates popular package |

### B. Deprecated names whose own notice points elsewhere — 13

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 1,080,187 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 780,778 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `jest-dom` | 138,345 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 125,915 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `react-testing-library` | 52,520 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 29,021 | `@turf/turf` | deprecated, impersonates popular package |
| `babel-macros` | 16,818 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `socket-io` | 1,317 | `socket.io` | deprecated, impersonates popular package |
| `node-tar` | 828 | `tar` | deprecated, impersonates popular package |
| `expressjs` | 755 | `express` | deprecated |
| `auth0-react` | 286 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `node-semver` | 76 | `semver` | deprecated |
| `clerk-nextjs` | 31 | `@clerk/nextjs` | deprecated, almost no adoption |

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
| `sklearn` | 360,097 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 41,588 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
