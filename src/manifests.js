/**
 * Read dependency names out of the manifests a project directory may hold.
 * Returns one entry per ecosystem found: `{ ecosystem, file, names }`.
 */

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

export async function readNpmManifest(file) {
  const pkg = JSON.parse(await readFile(file, 'utf8'));
  const names = new Set();
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const name of Object.keys(pkg[field] || {})) names.add(name);
  }
  return [...names];
}

/**
 * requirements.txt: one requirement per line. Strip comments, options,
 * URLs, environment markers, extras and version specifiers; keep the name.
 */
export function parseRequirements(text) {
  const names = new Set();
  for (let raw of text.split('\n')) {
    const line = raw.replace(/(^|\s)#.*$/, '').trim();
    if (!line || line.startsWith('-') || /^https?:\/\//.test(line) || line.includes('://')) continue;
    const m = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/);
    if (m) names.add(m[1]);
  }
  return [...names];
}

/**
 * pyproject.toml: [project] dependencies, every array under
 * [project.optional-dependencies], and Poetry's [tool.poetry.dependencies].
 * A small section-aware parse — these are simple string lists in practice,
 * and a TOML parser would be the tool's only dependency besides the MCP SDK.
 */
export function parsePyproject(text) {
  const names = new Set();
  const add = (req) => {
    const m = String(req).trim().match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/);
    if (m && m[1].toLowerCase() !== 'python') names.add(m[1]);
  };
  const sections = {};
  let current = '';
  for (const line of text.split('\n')) {
    const h = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (h) { current = h[1].trim(); sections[current] ??= []; continue; }
    if (current) (sections[current] ??= []).push(line);
  }
  // Walk `key = [ ... ]` by hand: a lazy regex stops at the first `]`, and
  // requirement strings like "sqlalchemy[asyncio]" contain one.
  const arraysIn = (body, keyFilter) => {
    const joined = body.join('\n');
    const re = /^\s*([A-Za-z0-9_.-]+)\s*=\s*\[/gm;
    let m;
    while ((m = re.exec(joined))) {
      let i = m.index + m[0].length, depth = 1, quote = null, start = i;
      for (; i < joined.length && depth > 0; i++) {
        const ch = joined[i];
        if (quote) { if (ch === quote) quote = null; continue; }
        if (ch === '"' || ch === "'") quote = ch;
        else if (ch === '[') depth++;
        else if (ch === ']') depth--;
      }
      const inner = joined.slice(start, i - 1);
      re.lastIndex = i;
      if (keyFilter && !keyFilter(m[1])) continue;
      for (const s of inner.matchAll(/["']([^"']+)["']/g)) add(s[1]);
    }
  };
  if (sections['project']) arraysIn(sections['project'], (k) => k === 'dependencies');
  if (sections['project.optional-dependencies']) arraysIn(sections['project.optional-dependencies']);
  for (const key of ['tool.poetry.dependencies', 'tool.poetry.dev-dependencies']) {
    for (const line of sections[key] || []) {
      const m = line.match(/^\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*=/);
      if (m) add(m[1]);
    }
  }
  return [...names];
}

/** Discover manifests under `dir` (or a single manifest path). */
export async function discoverManifests(target) {
  const out = [];
  const p = path.resolve(target);
  const base = path.basename(p);

  if (base === 'package.json') return [{ ecosystem: 'npm', file: p, names: await readNpmManifest(p) }];
  if (base === 'requirements.txt' || /^requirements.*\.txt$/.test(base)) return [{ ecosystem: 'pypi', file: p, names: parseRequirements(await readFile(p, 'utf8')) }];
  if (base === 'pyproject.toml') return [{ ecosystem: 'pypi', file: p, names: parsePyproject(await readFile(p, 'utf8')) }];

  const pj = path.join(p, 'package.json');
  if (await exists(pj)) out.push({ ecosystem: 'npm', file: pj, names: await readNpmManifest(pj) });

  const py = new Set();
  const pyFiles = [];
  for (const f of ['requirements.txt', 'requirements-dev.txt', 'requirements/base.txt', 'requirements/dev.txt']) {
    const fp = path.join(p, f);
    if (await exists(fp)) { pyFiles.push(fp); for (const n of parseRequirements(await readFile(fp, 'utf8'))) py.add(n); }
  }
  const pp = path.join(p, 'pyproject.toml');
  if (await exists(pp)) { pyFiles.push(pp); for (const n of parsePyproject(await readFile(pp, 'utf8'))) py.add(n); }
  if (pyFiles.length) out.push({ ecosystem: 'pypi', file: pyFiles.join(', '), names: [...py] });

  return out;
}
