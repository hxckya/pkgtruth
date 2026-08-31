/**
 * Risk scoring for a package an AI agent is about to install.
 *
 * Design rule: every verdict must be explainable by concrete, checkable
 * facts. An agent acting on "DANGER" deserves to know exactly why, and a
 * human reviewing the agent deserves to audit the reasoning.
 */

import { fetchPackument, fetchWeeklyDownloads, searchPackages } from './registry.js';

const DAY = 86_400_000;

/** Levenshtein distance, capped for early exit on hopeless pairs. */
export function editDistance(a, b, cap = 4) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > cap) return cap + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Strip scope and common decoration so `eslint-plugin-x` ~ `x`. */
function coreName(name) {
  return name.replace(/^@[^/]+\//, '').replace(/^(eslint-plugin-|babel-plugin-|@types\/)/, '');
}

const VERDICTS = { SAFE: 'SAFE', CAUTION: 'CAUTION', DANGER: 'DANGER', HALLUCINATED: 'HALLUCINATED', UNKNOWN: 'UNKNOWN' };

/**
 * Inspect one package name.
 * @returns {Promise<object>} verdict + the evidence behind it
 */
export async function inspectPackage(name, { deep = true } = {}) {
  const signals = [];
  const pack = await fetchPackument(name);

  if (pack.exists === null) {
    return { name, verdict: VERDICTS.UNKNOWN, score: null, signals: [{ id: 'registry_unreachable', severity: 'info', detail: pack.error }], summary: 'Registry unreachable — could not verify. Do not treat as safe.' };
  }

  // --- Case 1: the package simply does not exist ------------------------
  if (pack.exists === false) {
    const near = deep ? await findRealPackage(name) : [];
    return {
      name,
      verdict: VERDICTS.HALLUCINATED,
      score: 100,
      exists: false,
      signals: [{ id: 'not_in_registry', severity: 'critical', detail: 'No such package on the npm registry.' }],
      didYouMean: near,
      summary: near.length
        ? `"${name}" does not exist. Closest real packages: ${near.slice(0, 3).map((n) => n.name).join(', ')}.`
        : `"${name}" does not exist on npm. Treat any code importing it as unverified.`,
    };
  }

  // --- Case 2: it exists — weigh how much to trust it -------------------
  const d = pack.data;
  const versions = Object.keys(d.versions || {});
  const latestTag = d['dist-tags']?.latest;
  const latest = latestTag ? d.versions?.[latestTag] : undefined;
  const created = d.time?.created ? new Date(d.time.created) : null;
  const modified = d.time?.modified ? new Date(d.time.modified) : null;
  const ageDays = created ? Math.floor((Date.now() - created.getTime()) / DAY) : null;
  const staleDays = modified ? Math.floor((Date.now() - modified.getTime()) / DAY) : null;
  const dlResult = await fetchWeeklyDownloads(name);
  const downloads = dlResult.downloads;
  // Every lookup that failed rather than answered. A verdict built on
  // missing evidence must say so instead of passing as a clean bill.
  const gaps = [];
  if (dlResult.failed) gaps.push(`adoption data unavailable (${dlResult.failed})`);

  let score = 0;

  // npm unpublishes malicious packages and leaves a `x.y.z-security`
  // placeholder in their place. That is not a heuristic — it is npm
  // stating outright that this name was used for an attack.
  if (/-security$/.test(latestTag || '') || /security placeholder|security holding/i.test(String(latest?.description || ''))) {
    score += 70;
    signals.push({ id: 'npm_security_placeholder', severity: 'critical', detail: `npm replaced this package with a security placeholder (${latestTag}). The name was used to publish malicious code.` });
  }

  if (d.deprecated || latest?.deprecated) {
    score += 40;
    signals.push({ id: 'deprecated', severity: 'high', detail: String(d.deprecated || latest.deprecated).slice(0, 200) });
  }
  if (ageDays !== null && ageDays < 30) {
    score += 30;
    signals.push({ id: 'very_new', severity: 'high', detail: `Published ${ageDays} day(s) ago.` });
  } else if (ageDays !== null && ageDays < 90) {
    score += 15;
    signals.push({ id: 'new', severity: 'medium', detail: `Published ${ageDays} days ago.` });
  }
  if (downloads !== null && downloads < 50) {
    score += 25;
    signals.push({ id: 'almost_no_adoption', severity: 'high', detail: `${downloads} downloads last week.` });
  } else if (downloads !== null && downloads < 500) {
    score += 10;
    signals.push({ id: 'low_adoption', severity: 'medium', detail: `${downloads} downloads last week.` });
  }

  const scripts = latest?.scripts || {};
  const installHooks = ['preinstall', 'install', 'postinstall'].filter((k) => scripts[k]);
  if (installHooks.length) {
    // Native builds legitimately need install hooks, and the heavily used
    // ones (esbuild, sharp, bcrypt) are among the most scrutinised packages
    // on the registry. Scoring them like an unknown package trains people to
    // ignore the warning, which costs more than it catches — so report the
    // hook, but let adoption decide how much alarm it carries.
    const weight = downloads === null ? 25 : downloads > 1_000_000 ? 0 : downloads > 100_000 ? 10 : 25;
    score += weight;
    signals.push({
      id: 'install_scripts',
      severity: weight === 0 ? 'info' : weight <= 10 ? 'medium' : 'high',
      detail: `Runs on install: ${installHooks.map((h) => `${h}="${String(scripts[h]).slice(0, 80)}"`).join('; ')}`,
    });
  }
  if (!d.repository && !latest?.repository) {
    score += 15;
    signals.push({ id: 'no_repository', severity: 'medium', detail: 'No source repository declared.' });
  }
  if (versions.length <= 1) {
    score += 10;
    signals.push({ id: 'single_version', severity: 'low', detail: 'Only one version ever published.' });
  }
  if (staleDays !== null && staleDays > 730) {
    score += 10;
    signals.push({ id: 'unmaintained', severity: 'medium', detail: `No release in ${Math.floor(staleDays / 365)} year(s).` });
  }

  // Impersonation check: a far more popular near-twin is the classic
  // slopsquat shape, and the signal that matters most.
  // The impersonation test is a ratio against our own adoption. Without a
  // real download count that ratio is meaningless — treating "unknown" as
  // zero makes every popular near-name look like a 100,000x impostor, which
  // is how a rate limit turns into a wave of false accusations.
  if (deep && dlResult.failed) {
    gaps.push('impersonation check skipped (no adoption figure to compare against)');
  } else if (deep && downloads !== null && downloads < 10_000) {
    const { twin, failed } = await findPopularTwin(name, downloads);
    if (failed) gaps.push(`impersonation check incomplete (${failed})`);
    if (twin) {
      // An exact core-name collision is the textbook slopsquat and must be
      // damning on its own; a near-miss still warrants a hard look.
      score += twin.distance === 0 ? 60 : 45;
      const how = twin.distance === 0
        ? `resolves to the same name as "${twin.name}"`
        : `is ${twin.distance} edit(s) from "${twin.name}"`;
      signals.push({ id: 'impersonates_popular_package', severity: 'critical', detail: `Package ${how}, which has ${twin.downloads.toLocaleString()} weekly downloads (${Math.round(twin.ratio).toLocaleString()}x this one). Confirm you meant this package and not that one.` });
    }
  }

  if (gaps.length) {
    signals.push({ id: 'incomplete_check', severity: 'medium', detail: `Checks that did not complete: ${gaps.join('; ')}.` });
  }

  let verdict = score >= 60 ? VERDICTS.DANGER : score >= 25 ? VERDICTS.CAUTION : VERDICTS.SAFE;
  // A clean score reached without the evidence is not a clean bill of
  // health. Anything short of DANGER degrades to UNKNOWN so a rate limit
  // can never wave a package through.
  if (gaps.length && verdict !== VERDICTS.DANGER) verdict = VERDICTS.UNKNOWN;

  return {
    name, verdict, score, exists: true,
    version: latestTag,
    ageDays, weeklyDownloads: downloads,
    complete: gaps.length === 0,
    repository: d.repository?.url || latest?.repository?.url || null,
    signals,
    summary: buildSummary(name, verdict, signals, downloads),
  };
}

function buildSummary(name, verdict, signals, downloads) {
  const dl = downloads?.toLocaleString() ?? 'unknown';
  if (verdict === VERDICTS.UNKNOWN) {
    const why = signals.filter((s) => s.id === 'incomplete_check').map((s) => s.detail);
    return `"${name}" could not be fully verified. ${why.join(' ')} Do not treat this as safe — re-run the check.`;
  }
  if (verdict === VERDICTS.SAFE) {
    // Say "no risk signals" only when that is actually true — a SAFE verdict
    // can still carry minor ones, and claiming otherwise misleads the agent.
    return signals.length === 0
      ? `"${name}" looks legitimate (${dl} weekly downloads, no risk signals).`
      : `"${name}" looks legitimate (${dl} weekly downloads), with minor notes: ${signals.map((s) => s.id).join(', ')}.`;
  }
  const top = signals.filter((s) => s.severity === 'critical' || s.severity === 'high').slice(0, 3).map((s) => s.detail);
  return `"${name}" — ${verdict}. ${top.join(' ')}`;
}

/** For a name that does not exist, what did the model probably mean? */
export async function findRealPackage(name) {
  const { results } = await searchPackages(coreName(name), 10);
  return results
    .map((r) => ({ ...r, distance: editDistance(coreName(name), coreName(r.name), 8) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
}

/**
 * Find a much-more-popular package with a confusingly similar name.
 * Reports `failed` when the comparison could not be completed, so a
 * rate-limited lookup is never mistaken for "nothing suspicious found".
 */
export async function findPopularTwin(name, ownDownloads) {
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
    const { downloads: dl, failed: dlFailed } = await fetchWeeklyDownloads(c.name);
    if (dlFailed) return { twin: null, failed: dlFailed };
    if (dl === null) continue;
    const ratio = dl / Math.max(ownDownloads, 1);
    if (dl > 5_000 && ratio > 20) return { twin: { name: c.name, downloads: dl, distance: dist, ratio } };
  }
  return { twin: null };
}
