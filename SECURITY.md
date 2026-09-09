# Security

## Reporting

If you find a way to make pkgtruth say **SAFE** about something it should not
— a bypass of the impersonation check, a way to make a registry failure read
as a clean verdict, anything that opens the gate — please report it privately
first: open a [GitHub security advisory](https://github.com/hxckya/pkgtruth/security/advisories/new)
rather than a public issue. You will get a reply within a few days.

False positives (a legitimate package flagged) are not security-sensitive;
please open a normal issue for those. They are the most useful reports this
project gets.

## What pkgtruth does and does not access

- Reads public metadata from the npm registry and downloads API. No auth, no
  tokens, nothing sent but package names.
- Never downloads, unpacks, or executes package contents.
- Caches adoption figures under `~/.cache/pkgtruth` (override with
  `PKGTRUTH_CACHE_DIR`, disable with `PKGTRUTH_NO_DISK_CACHE=1`).
- Runs no install scripts of its own.

## Supply chain of this package

- Published to npm from GitHub Actions via OIDC trusted publishing; no
  long-lived npm token exists for this package.
- The publishing account requires 2FA for all writes.
- Every release is tagged, and the tag must match `package.json` and
  `server.json` or the workflow refuses to publish.
- `npm ci` in CI runs pkgtruth against its own dependencies before release.
