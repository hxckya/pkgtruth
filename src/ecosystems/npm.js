/**
 * npm adapter. This is the behaviour pkgtruth shipped with, moved behind the
 * same interface the PyPI adapter implements so detect.js scores both the
 * same way.
 */

import { fetchPackument, fetchWeeklyDownloads as fetchDownloads, searchPackages } from '../registry.js';
import { pointsToFrom } from '../notice.js';

export { pointsToFrom };

export const id = 'npm';
export const label = 'npm';

export function normalizeName(name) {
  return String(name).trim();
}

/** Strip scope and common decoration so `eslint-plugin-x` ~ `x`. */
export function coreName(name) {
  return name.replace(/^@[^/]+\//, '').replace(/^(eslint-plugin-|babel-plugin-|@types\/)/, '');
}

export async function fetchPackage(name) {
  const pack = await fetchPackument(name);
  if (pack.exists === false) return { exists: false };
  if (pack.exists === null) return { exists: null, error: pack.error };

  const d = pack.data;
  const versions = Object.keys(d.versions || {});
  const latestTag = d['dist-tags']?.latest || null;
  const latest = latestTag ? d.versions?.[latestTag] : undefined;
  const scripts = latest?.scripts || {};
  const installScripts = ['preinstall', 'install', 'postinstall']
    .filter((k) => scripts[k])
    .map((h) => `${h}="${String(scripts[h]).slice(0, 80)}"`);

  // npm unpublishes malicious packages and leaves a `x.y.z-security`
  // placeholder in their place. That is not a heuristic — it is npm stating
  // outright that this name was used for an attack.
  const placeholder = /-security$/.test(latestTag || '') || /security placeholder|security holding/i.test(String(latest?.description || ''));

  return {
    exists: true,
    name: d.name || name,
    latest: latestTag,
    versionCount: versions.length,
    created: d.time?.created || null,
    modified: d.time?.modified || null,
    deprecated: d.deprecated || latest?.deprecated ? String(d.deprecated || latest.deprecated).slice(0, 200) : null,
    deprecatedPointsTo: pointsToFrom(d.deprecated || latest?.deprecated),
    securityPlaceholder: placeholder ? latestTag : null,
    yanked: false,
    repository: d.repository?.url || latest?.repository?.url || null,
    installScripts,
    summary: latest?.description || '',
  };
}



export const fetchWeeklyDownloads = fetchDownloads;

/**
 * Find a much-more-popular package with a confusingly similar name.
 * Reports `failed` when the comparison could not be completed, so a
 * rate-limited lookup is never mistaken for "nothing suspicious found".
 */
export async function findPopularTwin(name, editDistance, ownDownloads) {
  const core = coreName(name);
  const { results: candidates, failed } = await searchPackages(core, 10);
  if (failed) return { twin: null, failed };
  for (const c of candidates) {
    if (c.name === name) continue;
    // Distance 0 means a different package resolves to the SAME core name
    // — `unused-imports` vs `eslint-plugin-unused-imports`. That is the
    // strongest impersonation signal there is, not a self-match to skip.
    const dist = editDistance(coreName(c.name), core, 4);
    if (dist > 3) continue;
    const { downloads: dl, failed: dlFailed } = await fetchDownloads(c.name);
    if (dlFailed) return { twin: null, failed: dlFailed };
    if (dl === null) continue;
    const ratio = dl / Math.max(ownDownloads, 1);
    if (dl > 5_000 && ratio > 20) return { twin: { name: c.name, downloads: dl, distance: dist, ratio } };
  }
  return { twin: null };
}

/** For a name that does not exist, what did the model probably mean? */
export async function findRealPackage(name, editDistance) {
  const { results } = await searchPackages(coreName(name), 10);
  return results
    .map((r) => ({ ...r, distance: editDistance(coreName(name), coreName(r.name), 8) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
}
