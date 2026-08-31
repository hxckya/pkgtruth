/**
 * Disk cache for adoption figures.
 *
 * npm's downloads API is the rate-limited resource, and it cannot batch
 * scoped names — so a project with several `@scope/pkg` dependencies spends
 * its budget on every scan. Weekly download counts move slowly enough that
 * reusing yesterday's figure costs nothing in accuracy and saves the budget
 * for the lookups that matter.
 *
 * Packuments are deliberately not persisted: they are large, they carry the
 * signals that must stay fresh (new versions, deprecations, security
 * placeholders), and the registry that serves them is not the bottleneck.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const TTL_MS = Number(process.env.PKGTRUTH_DISK_TTL_MS || 6 * 60 * 60 * 1000);
const DISABLED = process.env.PKGTRUTH_NO_DISK_CACHE === '1';

function cacheFile() {
  const base = process.env.PKGTRUTH_CACHE_DIR
    || (process.env.XDG_CACHE_HOME ? path.join(process.env.XDG_CACHE_HOME, 'pkgtruth') : path.join(os.homedir(), '.cache', 'pkgtruth'));
  return path.join(base, 'downloads.json');
}

let entries = null;   // name -> { downloads, at }
let dirty = false;

async function ensureLoaded() {
  if (entries) return entries;
  entries = new Map();
  if (DISABLED) return entries;
  try {
    const raw = JSON.parse(await readFile(cacheFile(), 'utf8'));
    const now = Date.now();
    for (const [name, rec] of Object.entries(raw)) {
      if (rec && typeof rec.downloads === 'number' && now - rec.at < TTL_MS) entries.set(name, rec);
    }
  } catch {
    // A missing or corrupt cache is not an error — it just means a cold run.
  }
  return entries;
}

/**
 * Figures are keyed by the API they came from. A count fetched from npm must
 * never be served for a private registry that happens to host the same name.
 */
function key(name, origin) {
  return `${origin}\u0000${name}`;
}

/** Cached weekly downloads for `name`, or undefined when not usefully cached. */
export async function getCachedDownloads(name, origin) {
  const map = await ensureLoaded();
  const rec = map.get(key(name, origin));
  if (!rec) return undefined;
  if (Date.now() - rec.at >= TTL_MS) {
    map.delete(key(name, origin));
    return undefined;
  }
  return rec.downloads;
}

export async function putCachedDownloads(name, downloads, origin) {
  if (DISABLED || typeof downloads !== 'number') return;
  const map = await ensureLoaded();
  map.set(key(name, origin), { downloads, at: Date.now() });
  dirty = true;
}

/** Persist. Never throws — a cache that cannot be written must not fail a scan. */
export async function flush() {
  if (DISABLED || !dirty || !entries) return;
  dirty = false;
  try {
    const file = cacheFile();
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(Object.fromEntries(entries)), 'utf8');
  } catch {
    // Best effort only.
  }
}
