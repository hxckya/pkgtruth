/**
 * Risk scoring for a package an AI agent is about to install.
 *
 * Design rule: every verdict must be explainable by concrete, checkable
 * facts. An agent acting on "DANGER" deserves to know exactly why, and a
 * human reviewing the agent deserves to audit the reasoning.
 *
 * Ecosystem-specific fetching lives in ./ecosystems/*.js; this file scores
 * the normalised shape they return, so npm and PyPI are judged by the same
 * rules wherever the same evidence exists.
 */

import * as npm from './ecosystems/npm.js';
import * as pypi from './ecosystems/pypi.js';

const DAY = 86_400_000;

export const ECOSYSTEMS = { npm, pypi };

export function ecosystemFor(id = 'npm') {
  const eco = ECOSYSTEMS[id];
  if (!eco) throw new Error(`Unknown ecosystem "${id}". Known: ${Object.keys(ECOSYSTEMS).join(', ')}`);
  return eco;
}

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

const VERDICTS = { SAFE: 'SAFE', CAUTION: 'CAUTION', DANGER: 'DANGER', HALLUCINATED: 'HALLUCINATED', UNKNOWN: 'UNKNOWN' };

/**
 * Inspect one package name.
 * @param {string} name
 * @param {{ ecosystem?: 'npm'|'pypi', deep?: boolean }} [opts]
 * @returns {Promise<object>} verdict + the evidence behind it
 */
export async function inspectPackage(name, { ecosystem = 'npm', deep = true } = {}) {
  const eco = ecosystemFor(ecosystem);
  const signals = [];
  const pkg = await eco.fetchPackage(name);

  if (pkg.exists === null) {
    // Same contract as a partial verdict below: `complete` is false and an
    // incomplete_check signal is present, so a consumer can test one field
    // regardless of which lookup failed.
    return {
      name, ecosystem, verdict: VERDICTS.UNKNOWN, score: null, complete: false,
      signals: [
        { id: 'registry_unreachable', severity: 'info', detail: pkg.error },
        { id: 'incomplete_check', severity: 'medium', detail: `Checks that did not complete: registry lookup (${pkg.error}).` },
      ],
      summary: 'Registry unreachable — could not verify. Do not treat as safe.',
    };
  }

  // --- Case 1: the package simply does not exist ------------------------
  if (pkg.exists === false) {
    const near = deep ? await eco.findRealPackage(name, editDistance) : [];
    return {
      name, ecosystem,
      verdict: VERDICTS.HALLUCINATED,
      score: 100,
      exists: false,
      signals: [{ id: 'not_in_registry', severity: 'critical', detail: `No such package on ${eco.label}.` }],
      didYouMean: near,
      summary: near.length
        ? `"${name}" does not exist. Closest real packages: ${near.slice(0, 3).map((n) => n.name).join(', ')}.`
        : `"${name}" does not exist on ${eco.label}. Treat any code importing it as unverified.`,
    };
  }

  // --- Case 2: it exists — weigh how much to trust it -------------------
  const created = pkg.created ? new Date(pkg.created) : null;
  const modified = pkg.modified ? new Date(pkg.modified) : null;
  const ageDays = created ? Math.floor((Date.now() - created.getTime()) / DAY) : null;
  const staleDays = modified ? Math.floor((Date.now() - modified.getTime()) / DAY) : null;
  const dlResult = await eco.fetchWeeklyDownloads(name);
  const downloads = dlResult.downloads;
  // Every lookup that failed rather than answered. A verdict built on
  // missing evidence must say so instead of passing as a clean bill.
  const gaps = [];
  if (dlResult.failed) gaps.push(`adoption data unavailable (${dlResult.failed})`);

  let score = 0;

  if (pkg.securityPlaceholder) {
    score += 70;
    signals.push({ id: 'npm_security_placeholder', severity: 'critical', detail: `npm replaced this package with a security placeholder (${pkg.securityPlaceholder}). The name was used to publish malicious code.` });
  }
  if (pkg.deprecated) {
    score += 40;
    signals.push({ id: 'deprecated', severity: 'high', detail: pkg.deprecated });
  }
  if (pkg.yanked) {
    score += 30;
    signals.push({ id: 'yanked', severity: 'high', detail: 'Every file of the latest release has been yanked by its maintainer.' });
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

  if (pkg.installScripts?.length) {
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
      detail: `Runs on install: ${pkg.installScripts.join('; ')}`,
    });
  }
  if (!pkg.repository) {
    score += 15;
    signals.push({ id: 'no_repository', severity: 'medium', detail: 'No source repository declared.' });
  }
  if (pkg.versionCount <= 1) {
    score += 10;
    signals.push({ id: 'single_version', severity: 'low', detail: 'Only one version ever published.' });
  }
  if (staleDays !== null && staleDays > 730) {
    score += 10;
    signals.push({ id: 'unmaintained', severity: 'medium', detail: `No release in ${Math.floor(staleDays / 365)} year(s).` });
  }

  // Impersonation check: a far more popular near-twin is the classic
  // slopsquat shape, and the signal that matters most.
  // The test is a ratio against our own adoption. Without a real download
  // count that ratio is meaningless — treating "unknown" as zero makes every
  // popular near-name look like a 100,000x impostor, which is how a rate
  // limit turns into a wave of false accusations.
  if (deep && dlResult.failed) {
    gaps.push('impersonation check skipped (no adoption figure to compare against)');
  } else if (deep && downloads !== null && downloads < 10_000) {
    const { twin, failed } = await eco.findPopularTwin(name, editDistance, downloads);
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
  } else if (deep && pkg.deprecatedPointsTo && eco.normalizeName(pkg.deprecatedPointsTo) !== eco.normalizeName(name)) {
    // The maintainer has already named the package this one is standing in
    // for. That is stronger evidence than any edit distance — `sklearn` is
    // nowhere near `scikit-learn` by spelling, and its own notice says so.
    const target = pkg.deprecatedPointsTo;
    const t = await eco.fetchWeeklyDownloads(target);
    // A throttled lookup of the replacement must not read as "no twin":
    // the notice named it, and the verdict should say the comparison is
    // still owed rather than quietly drop the strongest signal.
    if (t.failed) gaps.push(`adoption of "${target}" unavailable (${t.failed})`);
    if (!t.failed && t.downloads !== null && downloads !== null) {
      const ratio = t.downloads / Math.max(downloads, 1);
      if (t.downloads > 5_000 && ratio > 20) {
        score += 45;
        signals.push({ id: 'impersonates_popular_package', severity: 'critical', detail: `Its own deprecation notice points at "${target}", which has ${t.downloads.toLocaleString()} weekly downloads (${Math.round(ratio).toLocaleString()}x this one). Installs of this name almost certainly belong there.` });
      }
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
    name, ecosystem, verdict, score, exists: true,
    version: pkg.latest,
    ageDays, weeklyDownloads: downloads,
    pointsTo: pkg.deprecatedPointsTo || null,
    complete: gaps.length === 0,
    repository: pkg.repository,
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

/**
 * Inspect many names with a bounded concurrency, then give every UNKNOWN a
 * second, slower pass. A burst large enough to draw 429s from the downloads
 * API leaves a tail of "could not verify"; most of it clears once the rate
 * window resets, and the gate should say so instead of shrugging.
 */
export async function inspectMany(names, { ecosystem = 'npm', concurrency = 4, retryUnknown = true, onProgress } = {}) {
  const unique = [...new Set(names)];
  const out = new Map();
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, async () => {
    while (next < unique.length) {
      const n = unique[next++];
      out.set(n, await inspectPackage(n, { ecosystem }));
      onProgress?.(out.size, unique.length);
    }
  }));
  if (retryUnknown) {
    const again = unique.filter((n) => out.get(n)?.verdict === 'UNKNOWN');
    if (again.length) {
      await new Promise((r) => setTimeout(r, 1500));
      for (const n of again) {
        const r = await inspectPackage(n, { ecosystem });
        if (r.verdict !== 'UNKNOWN') out.set(n, r);
      }
    }
  }
  return unique.map((n) => out.get(n));
}

// Kept for callers that imported the npm-only helpers directly.
export const findRealPackage = (name) => npm.findRealPackage(name, editDistance);
export const findPopularTwin = (name, ownDownloads) => npm.findPopularTwin(name, editDistance, ownDownloads);
