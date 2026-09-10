/**
 * What SLOPSQUATS.md is allowed to publish.
 *
 * The CLI may say DANGER for a small package with a famous near-twin; that is
 * a fair verdict for a gate about to install it. It is not fair grounds for
 * naming a project on a public page. Two kinds of evidence clear that bar:
 *
 *  - npm's own security placeholder: the registry says the name carried malware.
 *  - a deprecation notice that itself names the popular package — parsed, not
 *    string-matched. "use scikit-learn instead" clears it; a fork whose README
 *    merely mentions "redis" does not.
 */
// npm names are exact apart from case; PyPI treats `-`, `_` and `.` as one
// character (PEP 503). Collapsing separators for npm would make `socket-io`
// equal to `socket.io`, which is the very confusion this page documents.
const norm = (s, ecosystem = 'npm') => {
  const t = String(s || '').trim().toLowerCase();
  return ecosystem === 'pypi' ? t.replace(/[-_.]+/g, '-') : t;
};

export function isPlaceholder(hit) {
  return hit.signals.some((s) => s.id === 'npm_security_placeholder');
}

/** The twin the detector matched, if any, from the impersonation signal text. */
export function matchedTwin(hit) {
  const s = hit.signals.find((x) => x.id === 'impersonates_popular_package');
  const m = s && s.detail.match(/"([^"]+)"/);
  return m ? m[1] : null;
}

export function isNoticeBacked(hit, seed, ecosystem = hit.ecosystem || 'npm') {
  if (!hit.pointsTo) return false;
  const target = norm(hit.pointsTo, ecosystem);
  if (target === norm(hit.name, ecosystem)) return false;
  const twin = matchedTwin(hit);
  return target === norm(seed, ecosystem) || (twin && target === norm(twin, ecosystem));
}
