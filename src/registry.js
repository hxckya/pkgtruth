/**
 * npm registry client. Zero dependencies — uses native fetch.
 * All network failures are returned as values, never thrown, so a
 * degraded network can never make the agent's gate fail open.
 */

const REGISTRY = process.env.PKGTRUTH_REGISTRY || 'https://registry.npmjs.org';
const API = process.env.PKGTRUTH_DOWNLOADS_API || 'https://api.npmjs.org';
const UA = 'pkgtruth (+https://github.com/pkgtruth/pkgtruth)';

const TIMEOUT_MS = Number(process.env.PKGTRUTH_TIMEOUT_MS || 8000);

async function getJson(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'application/json' },
    });
    if (res.status === 404) return { ok: false, status: 404 };
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, data: await res.json() };
  } catch (err) {
    return { ok: false, status: 0, error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

/** Encode a package name for use in a registry path (scoped names keep one slash). */
export function encodeName(name) {
  return name.startsWith('@') ? '@' + encodeURIComponent(name.slice(1)).replace('%2F', '/') : encodeURIComponent(name);
}

/** Full packument. `{ exists: false }` when the registry says 404. */
export async function fetchPackument(name) {
  const r = await getJson(`${REGISTRY}/${encodeName(name)}`);
  if (r.ok) return { exists: true, data: r.data };
  if (r.status === 404) return { exists: false };
  return { exists: null, error: r.error || `registry returned ${r.status}` };
}

/** Weekly downloads. null when unknown — never guessed. */
export async function fetchWeeklyDownloads(name) {
  const r = await getJson(`${API}/downloads/point/last-week/${encodeName(name)}`);
  if (r.ok && typeof r.data?.downloads === 'number') return r.data.downloads;
  return null;
}

/** Search the registry — used to find what the agent probably meant. */
export async function searchPackages(text, size = 10) {
  const r = await getJson(`${REGISTRY}/-/v1/search?text=${encodeURIComponent(text)}&size=${size}`);
  if (!r.ok) return [];
  return (r.data?.objects || []).map((o) => ({
    name: o.package.name,
    description: o.package.description || '',
    version: o.package.version,
  }));
}
