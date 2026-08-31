/**
 * npm registry client. Zero dependencies — uses native fetch.
 * All network failures are returned as values, never thrown, so a
 * degraded network can never make the agent's gate fail open.
 */

import { getCachedDownloads, putCachedDownloads, flush as flushDiskCache } from './diskcache.js';

export { flushDiskCache };

const UA = 'pkgtruth (+https://github.com/pkgtruth/pkgtruth)';

// Read configuration per call, not at import. A long-lived MCP server should
// pick up a changed endpoint without a restart, and it keeps the module
// honestly testable.
const registryUrl = () => process.env.PKGTRUTH_REGISTRY || 'https://registry.npmjs.org';
const downloadsApi = () => process.env.PKGTRUTH_DOWNLOADS_API || 'https://api.npmjs.org';
const timeoutMs = () => Number(process.env.PKGTRUTH_TIMEOUT_MS || 8000);
const retries = () => Number(process.env.PKGTRUTH_RETRIES ?? 3);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Per-host request pacing.
 *
 * Measured against npm: paced sequential lookups succeed indefinitely, while
 * a burst of concurrent ones draws 429s. The downloads API is the strict one
 * and cannot be batched for scoped names, so it gets a narrow gate and a
 * minimum spacing; the registry tolerates far more. Callers should not have
 * to know any of this, so the ceiling lives here.
 */
const HOST_LIMITS = {
  // Measured: paced serial lookups against the downloads API succeed
  // indefinitely, two-at-a-time draws 429s. Bulk priming keeps the number of
  // individual calls small (only scoped names need one), so serialising them
  // costs little and buys a verdict that does not flicker.
  'api.npmjs.org': { concurrency: 1, minIntervalMs: 250 },
  default: { concurrency: 6, minIntervalMs: 0 },
};

const lanes = new Map();

function laneFor(url) {
  let host;
  try {
    host = new URL(url).host;
  } catch {
    host = 'default';
  }
  if (!lanes.has(host)) {
    const limit = HOST_LIMITS[host] || HOST_LIMITS.default;
    // Escape hatch for private registries that do not need this pacing.
    const override = Number(process.env.PKGTRUTH_MAX_CONCURRENCY);
    const concurrency = Number.isFinite(override) && override > 0 ? override : limit.concurrency;
    lanes.set(host, { ...limit, concurrency, active: 0, lastStart: 0, waiting: [] });
  }
  return lanes.get(host);
}

async function acquire(url) {
  const lane = laneFor(url);
  if (lane.active >= lane.concurrency) {
    await new Promise((resolve) => lane.waiting.push(resolve));
  }
  lane.active++;
  const gap = lane.lastStart + lane.minIntervalMs - Date.now();
  if (gap > 0) await sleep(gap);
  lane.lastStart = Date.now();
  return lane;
}

function release(lane) {
  lane.active--;
  lane.waiting.shift()?.();
}

async function once(url) {
  const lane = await acquire(url);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs());
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'application/json' },
    });
    if (res.status === 404) return { ok: false, status: 404 };
    if (!res.ok) {
      const after = Number(res.headers.get('retry-after'));
      return { ok: false, status: res.status, retryAfterMs: Number.isFinite(after) && after > 0 ? after * 1000 : null };
    }
    return { ok: true, status: res.status, data: await res.json() };
  } catch (err) {
    return { ok: false, status: 0, error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
    release(lane);
  }
}

// Scanning a manifest asks about the same popular packages over and over
// while hunting for impostors. Without this the tool rate-limits itself.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();
const inflight = new Map();

/**
 * A 404 is an answer; a 429 or a dropped socket is not. Retry only the
 * latter — a rate limit that silently degrades a verdict is how a security
 * gate quietly stops being one.
 */
async function fetchWithRetry(url) {
  const max = retries();
  let last;
  for (let attempt = 0; attempt <= max; attempt++) {
    last = await once(url);
    if (last.ok || last.status === 404) return last;
    const retryable = last.status === 429 || last.status >= 500 || last.status === 0;
    if (!retryable || attempt === max) return last;
    // When the server says how long to wait, waiting less is just a second
    // refusal. Otherwise back off exponentially with a little jitter so a
    // batch of parallel lookups does not retry in lockstep.
    const backoff = 400 * 2 ** attempt + Math.floor(Math.random() * 200);
    await sleep(last.retryAfterMs ?? backoff);
  }
  return last;
}

async function getJson(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  // Collapse concurrent requests for the same URL into one round trip.
  const pending = inflight.get(url);
  if (pending) return pending;

  const p = fetchWithRetry(url).then((value) => {
    // Only successes and definitive 404s are worth remembering; caching a
    // transient failure would keep a package unverifiable for five minutes.
    if (value.ok || value.status === 404) cache.set(url, { at: Date.now(), value });
    inflight.delete(url);
    return value;
  }).catch((err) => {
    inflight.delete(url);
    throw err;
  });

  inflight.set(url, p);
  return p;
}

/** Drop everything remembered. Exposed for tests and long-lived servers. */
export function clearCache() {
  cache.clear();
  inflight.clear();
}

/** Encode a package name for use in a registry path (scoped names keep one slash). */
export function encodeName(name) {
  return name.startsWith('@') ? '@' + encodeURIComponent(name.slice(1)).replace('%2F', '/') : encodeURIComponent(name);
}

/** Full packument. `{ exists: false }` when the registry says 404. */
export async function fetchPackument(name) {
  const r = await getJson(`${registryUrl()}/${encodeName(name)}`);
  if (r.ok) return { exists: true, data: r.data };
  if (r.status === 404) return { exists: false };
  return { exists: null, error: r.error || `registry returned ${r.status}` };
}

/**
 * Weekly downloads.
 * `{ downloads: n }`            — the registry answered
 * `{ downloads: null }`         — answered, but has no figure for this name
 * `{ downloads: null, failed }` — we never got an answer. Callers must not
 *                                 read this as "unpopular"; it means unknown.
 */
export async function fetchWeeklyDownloads(name) {
  const api = downloadsApi();
  const cached = await getCachedDownloads(name, api);
  if (cached !== undefined) return { downloads: cached };

  const r = await getJson(`${downloadsApi()}/downloads/point/last-week/${encodeName(name)}`);
  if (r.ok && typeof r.data?.downloads === 'number') {
    await putCachedDownloads(name, r.data.downloads, api);
    return { downloads: r.data.downloads };
  }
  if (r.status === 404) return { downloads: null };
  return { downloads: null, failed: r.error || `downloads API returned ${r.status}` };
}

/** Search the registry — used to find what the agent probably meant. */
export async function searchPackages(text, size = 10) {
  const r = await getJson(`${registryUrl()}/-/v1/search?text=${encodeURIComponent(text)}&size=${size}`);
  if (!r.ok) return { results: [], failed: r.error || `search returned ${r.status}` };
  return {
    results: (r.data?.objects || []).map((o) => ({
      name: o.package.name,
      description: o.package.description || '',
      version: o.package.version,
    })),
  };
}

/**
 * Warm the cache for many packages using npm's bulk downloads endpoint,
 * which answers up to 128 names per request. Scanning a manifest one name
 * at a time is what provokes the rate limiting in the first place.
 *
 * Scoped names are not supported in bulk and are left for the per-package
 * path. Failures here are silent by design: this is an optimisation, and
 * every name it misses still gets its own verified lookup later.
 */
export async function primeDownloads(names) {
  // Anything already on disk needs no network call at all.
  const unresolved = [];
  for (const n of new Set(names)) {
    if ((await getCachedDownloads(n, downloadsApi())) === undefined) unresolved.push(n);
  }
  const plain = unresolved.filter((n) => !n.startsWith('@'));
  const CHUNK = 128;
  for (let i = 0; i < plain.length; i += CHUNK) {
    const batch = plain.slice(i, i + CHUNK);
    if (batch.length < 2) break; // the bulk endpoint needs a real list
    const url = `${downloadsApi()}/downloads/point/last-week/${batch.join(',')}`;
    const r = await fetchWithRetry(url);
    if (!r.ok || !r.data || typeof r.data.downloads === 'number') continue;
    for (const name of batch) {
      const entry = r.data[name];
      if (!entry || typeof entry.downloads !== 'number') continue;
      await putCachedDownloads(name, entry.downloads, downloadsApi());
      cache.set(`${downloadsApi()}/downloads/point/last-week/${encodeName(name)}`, {
        at: Date.now(),
        value: { ok: true, status: 200, data: { downloads: entry.downloads } },
      });
    }
  }
}
