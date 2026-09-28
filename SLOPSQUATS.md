# Live slopsquats

_Generated 2026-09-28 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

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
checked; 263 exist on npm; 125 came back DANGER;** 49 meet the
bar for this page and 76 are withheld.

### A. npm security placeholders — 36

npm removed malicious code published under these names and left a `-security`
placeholder. Anything still installing them is installing the name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `node.js` | 2,316 | `node` | npm security placeholder |
| `crossenv` | 2,035 | `cross-env` | npm security placeholder, impersonates popular package |
| `eslint-js` | 720 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 487 | `@supabase/supabase-js` | npm security placeholder |
| `mysqljs` | 247 | `mysql` | npm security placeholder, impersonates popular package |
| `unused-imports` | 239 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 184 | `nodemailer` | npm security placeholder, impersonates popular package |
| `icons-material` | 168 | `@mui/icons-material` | npm security placeholder, impersonates popular package |
| `plugin-react` | 69 | `@vitejs/plugin-react` | npm security placeholder |
| `types-node` | 50 | `@types/node` | npm security placeholder |
| `azure-identity` | 42 | `@azure/identity` | npm security placeholder, almost no adoption |
| `client-s3` | 30 | `@aws-sdk/client-s3` | npm security placeholder, almost no adoption, impersonates popular package |
| `jestjs` | 20 | `jest` | npm security placeholder, almost no adoption |
| `hookform-resolvers` | 17 | `@hookform/resolvers` | npm security placeholder, almost no adoption |
| `sveltejs` | 16 | `svelte` | npm security placeholder, almost no adoption |
| `node-pino` | 7 | `pino` | npm security placeholder, almost no adoption |
| `commander-js` | 6 | `commander` | npm security placeholder, almost no adoption |
| `typescriptjs` | 2 | `typescript` | npm security placeholder, almost no adoption |
| `prettierjs` | 2 | `prettier` | npm security placeholder, almost no adoption |
| `zod-js` | 2 | `zod` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-prettier` | 1 | `prettier` | npm security placeholder, almost no adoption |
| `mocha-js` | 1 | `mocha` | npm security placeholder, almost no adoption, impersonates popular package |
| `vitestjs` | 1 | `vitest` | npm security placeholder, almost no adoption |
| `cypressjs` | 1 | `cypress` | npm security placeholder, almost no adoption |
| `yupjs` | 1 | `yup` | npm security placeholder, almost no adoption |
| `yargs-js` | 1 | `yargs` | npm security placeholder, almost no adoption |
| `immer-js` | 1 | `immer` | npm security placeholder, almost no adoption, impersonates popular package |
| `rxjs-js` | 1 | `rxjs` | npm security placeholder, almost no adoption, impersonates popular package |
| `jsdom-js` | 0 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `jsonwebtoken-js` | 0 | `jsonwebtoken` | npm security placeholder, almost no adoption, impersonates popular package |
| `nanoid-js` | 0 | `nanoid` | npm security placeholder, almost no adoption, impersonates popular package |
| `luxon-js` | 0 | `luxon` | npm security placeholder, almost no adoption, impersonates popular package |
| `inquirer-js` | 0 | `inquirer` | npm security placeholder, almost no adoption |
| `winston-js` | 0 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-winston` | 0 | `winston` | npm security placeholder, almost no adoption |
| `nodemonjs` | 0 | `nodemon` | npm security placeholder, almost no adoption |

### B. Deprecated names whose own notice points elsewhere — 13

Not malicious. Each carries a deprecation message from its own maintainer naming the
package in the third column. The installs are real, and the maintainer has already said
they belong somewhere else.

| name | installs / week | points to | signals |
|---|---|---|---|
| `node-sass` | 1,639,704 | `sass` | deprecated, impersonates popular package |
| `rollup-plugin-node-resolve` | 892,570 | `@rollup/plugin-node-resolve` | deprecated, impersonates popular package |
| `typescript-eslint-parser` | 168,934 | `@typescript-eslint/parser` | deprecated, impersonates popular package |
| `jest-dom` | 144,387 | `@testing-library/jest-dom` | deprecated, impersonates popular package |
| `react-testing-library` | 61,658 | `@testing-library/react` | deprecated, impersonates popular package |
| `turf` | 31,243 | `@turf/turf` | deprecated, impersonates popular package |
| `babel-macros` | 17,772 | `babel-plugin-macros` | deprecated, impersonates popular package |
| `socket-io` | 1,379 | `socket.io` | deprecated, impersonates popular package |
| `expressjs` | 945 | `express` | deprecated |
| `node-tar` | 938 | `tar` | deprecated, impersonates popular package |
| `auth0-react` | 264 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `node-semver` | 97 | `semver` | deprecated |
| `clerk-nextjs` | 9 | `@clerk/nextjs` | deprecated, almost no adoption |

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
| `sklearn` | 341,673 | `scikit-learn` | deprecated, impersonates popular package |
| `pytorch` | 60,188 | `torch` | deprecated, impersonates popular package |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <name>
npx pkgtruth check -e pypi <name>
```

If a package here is legitimate and wrongly flagged, open an issue — that is exactly the
report this project most wants.
