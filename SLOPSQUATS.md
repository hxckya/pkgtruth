# Live slopsquats

_Generated 2026-11-16 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 115 came back DANGER;** 49 meet the
bar for this page and 66 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 2,224 | `cross-env` | npm security placeholder |
| `eslint-js` | 1,964 | `@eslint/js` | npm security placeholder |
| `node.js` | 1,128 | `node` | npm security placeholder |
| `supabase-js` | 720 | `@supabase/supabase-js` | npm security placeholder, impersonates popular package |
| `plugin-react` | 226 | `@vitejs/plugin-react` | npm security placeholder, impersonates popular package |
| `mysqljs` | 226 | `mysql` | npm security placeholder, impersonates popular package |
| `unused-imports` | 223 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 183 | `nodemailer` | npm security placeholder, impersonates popular package |
| `icons-material` | 92 | `@mui/icons-material` | npm security placeholder |
| `azure-identity` | 61 | `@azure/identity` | npm security placeholder |
| `sveltejs` | 46 | `svelte` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 33 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `types-node` | 23 | `@types/node` | npm security placeholder, almost no adoption |
| `client-s3` | 16 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption |
| `jestjs` | 16 | `jest` | npm security placeholder, almost no adoption |
| `node-pino` | 14 | `pino` | npm security placeholder, almost no adoption |
| `commander-js` | 8 | `commander` | npm security placeholder, almost no adoption |
| `mocha-js` | 4 | `mocha` | npm security placeholder, almost no adoption, impersonates popular package |
| `luxon-js` | 4 | `luxon` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-prettier` | 3 | `prettier` | npm security placeholder, almost no adoption |
| `yargs-js` | 3 | `yargs` | npm security placeholder, almost no adoption, impersonates popular package |
| `nodemonjs` | 3 | `nodemon` | npm security placeholder, almost no adoption |
| `typescriptjs` | 2 | `typescript` | npm security placeholder, almost no adoption |
| `prettierjs` | 2 | `prettier` | npm security placeholder, almost no adoption |
| `vitestjs` | 2 | `vitest` | npm security placeholder, almost no adoption |
| `cypressjs` | 2 | `cypress` | npm security placeholder, almost no adoption |
| `jsdom-js` | 2 | `jsdom` | npm security placeholder, almost no adoption |
| `nanoid-js` | 2 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `zod-js` | 2 | `zod` | npm security placeholder, almost no adoption |
| `yupjs` | 2 | `yup` | npm security placeholder, almost no adoption |
| `inquirer-js` | 2 | `inquirer` | npm security placeholder, almost no adoption |
| `winston-js` | 2 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-winston` | 2 | `winston` | npm security placeholder, almost no adoption |
| `immer-js` | 2 | `immer` | npm security placeholder, almost no adoption, impersonates popular package |
| `rxjs-js` | 2 | `rxjs` | npm security placeholder, almost no adoption, impersonates popular package |
| `jsonwebtoken-js` | 1 | `jsonwebtoken` | npm security placeholder, almost no adoption, impersonates popular package |

### B. Deprecated names whose own notice points elsewhere — 13

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `rollup-plugin-node-resolve` | 886,404 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `node-sass` | 772,743 | `sass` | deprecated, impersonates popular package |
| `jest-dom` | 137,106 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 131,154 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `babel-macros` | 69,859 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `react-testing-library` | 47,576 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 22,423 | `@turf/turf` | deprecated, impersonates popular package |
| `socket-io` | 1,798 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 1,101 | `express` | deprecated |
| `node-tar` | 621 | `tar` | deprecated, impersonates popular package |
| `auth0-react` | 318 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `node-semver` | 129 | `semver` | deprecated |
| `clerk-nextjs` | 31 | `@clerk/nextjs` | deprecated, almost no adoption |

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
| `sklearn` | 376,580 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 39,830 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
