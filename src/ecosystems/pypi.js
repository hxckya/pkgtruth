/**
 * PyPI adapter.
 *
 * Differences from npm that shape this file:
 *  - PyPI deletes malicious projects outright, so there is no `-security`
 *    placeholder to detect; a purged name simply 404s and reads as
 *    HALLUCINATED. The impersonation check therefore carries more weight.
 *  - There is no public search API. Near-twins are found against a cached
 *    copy of the top-8,000 projects by monthly downloads (hugovk's
 *    top-pypi-packages), which also supplies the popular side's volume
 *    without a second network call.
 *  - Names normalise per PEP 503: case-insensitive, and `-`, `_`, `.` are
 *    one character. `typing_extensions` and `typing-extensions` are the same
 *    project and must not be reported as twins of each other.
 *  - Weekly downloads come from pypistats.org, which is generous but not
 *    unlimited; results are cached like npm's.
 */

import { getJson } from '../registry.js';
import { getCachedDownloads, putCachedDownloads } from '../diskcache.js';

const pypiUrl = () => process.env.PKGTRUTH_PYPI || 'https://pypi.org';
const statsUrl = () => process.env.PKGTRUTH_PYPISTATS || 'https://pypistats.org';
const topUrl = () => process.env.PKGTRUTH_PYPI_TOP || 'https://hugovk.github.io/top-pypi-packages/top-pypi-packages-30-days.min.json';

/** PEP 503 normalisation. */
export function normalizeName(name) {
  return String(name).trim().toLowerCase().replace(/[-_.]+/g, '-');
}

export function encodeName(name) {
  return encodeURIComponent(normalizeName(name));
}

/**
 * Fetch and normalise a project into the shape detect.js scores.
 * `{ exists: false }` on 404; `{ exists: null, error }` when unreachable.
 */
export async function fetchPackage(name) {
  const r = await getJson(`${pypiUrl()}/pypi/${encodeName(name)}/json`);
  if (r.status === 404) return { exists: false };
  if (!r.ok) return { exists: null, error: r.error || `pypi returned ${r.status}` };

  const info = r.data.info || {};
  const releases = r.data.releases || {};
  const uploads = Object.values(releases).flat().map((f) => f.upload_time_iso_8601 || f.upload_time).filter(Boolean).sort();
  const latestFiles = r.data.urls || [];
  const text = `${info.summary || ''}\n${(info.description || '').slice(0, 4000)}`;

  // PyPI has no deprecation flag. Maintainers say it in prose, and the prose
  // is remarkably consistent: "deprecated", "use X instead", "renamed to".
  const m = text.match(/\b(?:deprecated|no longer maintained|unmaintained|use\s+[`'"]?([A-Za-z0-9_.-]+)[`'"]?\s+instead|renamed to\s+[`'"]?([A-Za-z0-9_.-]+)|replaced by\s+[`'"]?([A-Za-z0-9_.-]+)|you tried to install|the package (?:named|you (?:want|are looking for))[^.\n]{0,40}\bis\s+[`'"]?([A-Za-z0-9_.-]+)|this package is a (?:placeholder|stub|dummy))/i);
  const deprecated = m ? tidy(text, m.index) : null;

  return {
    exists: true,
    name: info.name || name,
    latest: info.version || null,
    versionCount: Object.keys(releases).length,
    created: uploads[0] || null,
    modified: uploads[uploads.length - 1] || null,
    deprecated,
    deprecatedPointsTo: deprecated ? pointsToFrom(text) : null,
    yanked: latestFiles.length > 0 && latestFiles.every((f) => f.yanked),
    repository: pickRepo(info),
    installScripts: [],           // sdists can run setup.py, but that is every sdist — not a signal
    summary: info.summary || '',
  };
}

/** The sentence around `at`, stripped of markdown decoration. */
function tidy(text, at) {
  const start = Math.max(text.lastIndexOf('\n', at), text.lastIndexOf('. ', at) + 1, 0);
  let end = text.indexOf('\n', at); if (end === -1) end = text.length;
  const dot = text.indexOf('. ', at); if (dot !== -1 && dot < end) end = dot + 1;
  return text.slice(start, end).replace(/[#*_`>]+/g, ' ').replace(/[\u26A0\uFE0F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function pickRepo(info) {
  const urls = info.project_urls || {};
  for (const [k, v] of Object.entries(urls)) {
    if (/source|repository|code|github|gitlab|homepage/i.test(k) && /^https?:\/\//.test(v)) return v;
  }
  return info.home_page && /^https?:\/\//.test(info.home_page) ? info.home_page : null;
}


/** The package a deprecation notice tells you to use instead, if it names one. */
export function pointsToFrom(text) {
  if (!text) return null;
  const m = String(text).match(/(?:use|install|see|try)\s+(?:the\s+)?[`'"]?(@?[A-Za-z0-9][A-Za-z0-9_.\/-]*)[`'"]?(?:\s+package)?\s+instead|renamed to\s+[`'"]?(@?[A-Za-z0-9][A-Za-z0-9_.\/-]*)|replaced by\s+[`'"]?(@?[A-Za-z0-9][A-Za-z0-9_.\/-]*)|(?:named for|package (?:you want|you are looking for|is called)|is now)\s+[^.\n]{0,40}?[`'"]?(@?[A-Za-z0-9][A-Za-z0-9_.\/-]*)[`'"]?\s*$/im);
  if (!m) return null;
  const hit = m.slice(1).find(Boolean);
  return hit ? hit.replace(/[.,;:]+$/, '') : null;
}

/** Weekly downloads via pypistats. Same contract as the npm client. */
export async function fetchWeeklyDownloads(name) {
  const n = normalizeName(name);
  const origin = statsUrl();
  const cached = await getCachedDownloads(n, origin);
  if (cached !== undefined) return { downloads: cached };
  const r = await getJson(`${origin}/api/packages/${encodeURIComponent(n)}/recent`);
  if (r.ok && typeof r.data?.data?.last_week === 'number') {
    await putCachedDownloads(n, r.data.data.last_week, origin);
    return { downloads: r.data.data.last_week };
  }
  if (r.status === 404) return { downloads: null };
  return { downloads: null, failed: r.error || `pypistats returned ${r.status}` };
}

let topCache = null; // { at, rows: Map<normalizedName, monthlyDownloads> }
const TOP_TTL = 24 * 60 * 60 * 1000;

/** Top projects by monthly downloads, as a normalised-name → count map. */
export async function topProjects() {
  if (topCache && Date.now() - topCache.at < TOP_TTL) return topCache;
  const r = await getJson(topUrl());
  if (!r.ok) return { at: 0, rows: new Map(), failed: r.error || `top list returned ${r.status}` };
  const list = Array.isArray(r.data) ? r.data : r.data?.rows || [];
  const rows = new Map();
  for (const row of list) {
    const n = normalizeName(row.project || row.name || '');
    if (n) rows.set(n, Number(row.download_count || row.downloads || 0));
  }
  topCache = { at: Date.now(), rows };
  return topCache;
}

/** Strip the decorations models drop or add: `python-x`, `py-x`, `x-python`, `x-py`. */
export function coreName(name) {
  return normalizeName(name).replace(/^(python-|py-|py)/, '').replace(/(-python|-py)$/, '');
}

/**
 * A far more popular near-twin of `name`, or null. Same contract as the npm
 * adapter: `{ twin: {name, downloads, distance, ratio} | null, failed }`.
 * The top list carries monthly counts; they are scaled to weekly so the
 * ratio threshold means the same thing in both ecosystems.
 */
export async function findPopularTwin(name, editDistance, ownDownloads) {
  const top = await topProjects();
  if (top.failed) return { twin: null, failed: top.failed };
  const me = normalizeName(name);
  const meCore = coreName(name);
  let best = null;
  for (const [other, monthly] of top.rows) {
    if (other === me) continue;
    const weekly = Math.round(monthly / 4.35);
    if (weekly <= 5_000) continue;
    const otherCore = coreName(other);
    if (Math.abs(otherCore.length - meCore.length) > 3 && Math.abs(other.length - me.length) > 3) continue;
    const d = Math.min(editDistance(me, other, 3), editDistance(meCore, otherCore, 3));
    if (d > 3) continue;
    const ratio = weekly / Math.max(ownDownloads, 1);
    if (ratio <= 20) continue;
    if (!best || d < best.distance || (d === best.distance && weekly > best.downloads)) {
      best = { name: other, downloads: weekly, distance: d, ratio };
    }
  }
  return { twin: best };
}

/** Best-effort "did you mean" for a name that does not exist. */
export async function findRealPackage(name, editDistance) {
  const top = await topProjects();
  if (top.failed) return [];
  const me = normalizeName(name);
  const out = [];
  for (const [other, monthly] of top.rows) {
    if (Math.abs(other.length - me.length) > 4) continue;
    const d = editDistance(me, other, 4);
    if (d <= 4) out.push({ name: other, distance: d, weekly: Math.round(monthly / 4.35) });
  }
  out.sort((a, b) => a.distance - b.distance || b.weekly - a.weekly);
  return out.slice(0, 5).map(({ name, distance }) => ({ name, distance }));
}

export const id = 'pypi';
export const label = 'PyPI';
