# Live slopsquats on npm

_Generated 2026-09-09 by [`scripts/hunt.mjs`](scripts/hunt.mjs). Regenerated weekly._

Start from 242 well-known packages, produce the names a model
plausibly emits instead of each one (scope dropped, dot↔hyphen, hyphen dropped,
plugin prefix dropped, `js` appended), and run every candidate through
pkgtruth. 772 candidates checked; 262 exist on npm;
**113 came back DANGER** from pkgtruth; **46** meet the
stricter bar for this page.

The CLI flags a near-twin with low adoption as DANGER because it is about to
be installed and the odds favour a mistake. That is not grounds for naming a
package publicly — many small, honest packages have generic names. So this
page lists only two kinds of evidence, and withholds the other 67
DANGER verdicts rather than risk accusing a legitimate project.

## A. npm security placeholders — 35

npm removed malicious code published under these names and left a
`-security` placeholder. Anything still installing them is installing the
name an attacker chose.

| name | installs / week | garbled from | signals |
|---|---|---|---|
| `crossenv` | 1,437 | `cross-env` | npm security placeholder, impersonates popular package |
| `eslint-js` | 612 | `@eslint/js` | npm security placeholder |
| `supabase-js` | 397 | `@supabase/supabase-js` | npm security placeholder, impersonates popular package |
| `mysqljs` | 231 | `mysql` | npm security placeholder, impersonates popular package |
| `unused-imports` | 209 | `eslint-plugin-unused-imports` | npm security placeholder, impersonates popular package |
| `nodemailer-js` | 174 | `nodemailer` | npm security placeholder, impersonates popular package |
| `plugin-react` | 119 | `@vitejs/plugin-react` | npm security placeholder, impersonates popular package |
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
| `rxjs-js` | 5 | `rxjs` | npm security placeholder, almost no adoption |
| `vitestjs` | 4 | `vitest` | npm security placeholder, almost no adoption |
| `jsdom-js` | 4 | `jsdom` | npm security placeholder, almost no adoption, impersonates popular package |
| `yargs-js` | 4 | `yargs` | npm security placeholder, almost no adoption, impersonates popular package |
| `node-prettier` | 3 | `prettier` | npm security placeholder, almost no adoption |
| `prettierjs` | 3 | `prettier` | npm security placeholder, almost no adoption |
| `nanoid-js` | 3 | `nanoid` | npm security placeholder, almost no adoption |
| `luxon-js` | 3 | `luxon` | npm security placeholder, almost no adoption |
| `nodemonjs` | 3 | `nodemon` | npm security placeholder, almost no adoption |
| `typescriptjs` | 2 | `typescript` | npm security placeholder, almost no adoption |
| `node-winston` | 2 | `winston` | npm security placeholder, almost no adoption |
| `mocha-js` | 1 | `mocha` | npm security placeholder, almost no adoption |
| `jsonwebtoken-js` | 1 | `jsonwebtoken` | npm security placeholder, almost no adoption |
| `yupjs` | 1 | `yup` | npm security placeholder, almost no adoption |
| `winston-js` | 1 | `winston` | npm security placeholder, almost no adoption, impersonates popular package |
| `immer-js` | 1 | `immer` | npm security placeholder, almost no adoption, impersonates popular package |
| `zod-js` | 0 | `zod` | npm security placeholder, almost no adoption |

## B. Deprecated names whose own notice points elsewhere — 11

Not malicious. Each of these carries a deprecation message from its own
maintainer naming the package in the third column. The installs are real,
and the maintainer has already said they belong somewhere else.

| name | installs / week | deprecation points to | signals |
|---|---|---|---|
| `node-sass` | 888,354 | `sass` | deprecated |
| `jest-dom` | 111,480 | `@testing-library/jest-dom` | deprecated |
| `react-testing-library` | 29,323 | `@testing-library/react` | deprecated |
| `babel-macros` | 12,487 | `babel-plugin-macros` | deprecated |
| `socket-io` | 1,094 | `socket.io` | deprecated, impersonates popular package |
| `auth0-react` | 888 | `@auth0/auth0-react` | deprecated, impersonates popular package |
| `expressjs` | 772 | `express` | deprecated |
| `node-tar` | 456 | `tar` | deprecated, impersonates popular package |
| `node-semver` | 50 | `semver` | deprecated |
| `twilio-conversations` | 37 | `@twilio/conversations` | deprecated, almost no adoption |
| `clerk-nextjs` | 1 | `@clerk/nextjs` | deprecated, almost no adoption |

## Reproduce

```bash
git clone https://github.com/hxckya/pkgtruth && cd pkgtruth && npm ci
node scripts/hunt.mjs            # writes SLOPSQUATS.md
npx pkgtruth check <any name above>
```

If a package here is legitimate and wrongly flagged, open an issue — that is
exactly the report this project most wants.
