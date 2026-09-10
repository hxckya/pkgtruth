/**
 * Read the package names a shell command would install or execute, so the
 * check that gates a manifest can also gate `npm install <name>` before it
 * runs. Backs `pkgtruth hook` (a Claude Code PreToolUse hook) and the
 * check_install_command MCP tool.
 *
 * This is a recogniser, not a shell. It tokenises with quote awareness,
 * splits on the usual command separators, and understands the install and
 * run subcommands of the common package managers. Anything it does not
 * understand yields no names — an unrecognised command is left alone rather
 * than guessed at, and never costs a network call.
 */

import { inspectMany, VERDICT_ORDER, blockingVerdicts } from './detect.js';
import { primeDownloads } from './registry.js';

/** Quote-aware split into simple commands, each a list of words. */
export function splitCommands(command) {
  const commands = [];
  let tokens = [];
  let cur = '';
  let has = false;
  let quote = null;
  const flushToken = () => { if (has) { tokens.push(cur); cur = ''; has = false; } };
  const flushCommand = () => { flushToken(); if (tokens.length) commands.push(tokens); tokens = []; };
  const s = String(command ?? '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) { quote = null; continue; }
      if (quote === '"' && ch === '\\' && i + 1 < s.length) { cur += s[++i]; continue; }
      cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; has = true; continue; }
    if (ch === '\\' && i + 1 < s.length) { cur += s[++i]; has = true; continue; }
    if (ch === '#' && !has) { while (i < s.length && s[i] !== '\n') i++; flushCommand(); continue; }
    if (ch === '\n' || ch === ';') { flushCommand(); continue; }
    if (ch === '&' || ch === '|') { if (s[i + 1] === ch) i++; flushCommand(); continue; }
    if (ch === '(' || ch === ')') { flushToken(); continue; }
    if (/\s/.test(ch)) { flushToken(); continue; }
    cur += ch;
    has = true;
  }
  flushCommand();
  return commands;
}

const base = (t) => String(t).replace(/^.*[\\/]/, '').replace(/\.(cmd|exe|ps1)$/i, '');

// Prefixes that do not change which command runs. Each maps to the options
// of that wrapper that take an argument, so `sudo -u deploy npm i x` still
// reads as an npm install.
const WRAPPERS = {
  sudo: /^-(u|g|C|D|p|r|t|T|U|h)$/,
  doas: /^-(u|C)$/,
  env: /^-(u|C|S)$/,
  nice: /^-n$/,
  nohup: /^$/,
  time: /^-(f|o)$/,
  command: /^$/,
  exec: /^-a$/,
};

function unwrap(tokens) {
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) { i++; continue; }
    const argOpt = WRAPPERS[base(t)];
    if (!argOpt) break;
    i++;
    while (i < tokens.length && tokens[i].startsWith('-')) {
      const o = tokens[i++];
      if (argOpt.test(o)) i++;
    }
  }
  return tokens.slice(i);
}

// --- Package-name readers ---------------------------------------------------

function npmName(token) {
  let s = token.trim();
  if (!s || s.startsWith('-')) return [];
  const alias = s.match(/@npm:(.+)$/); // my-alias@npm:real@1.2 → real
  if (alias) s = alias[1];
  // Anything with a protocol, a path, or an archive is not a registry name.
  if (s.includes(':') || /^[.~/]/.test(s) || /\.(tgz|tar\.gz|tar)$/i.test(s)) return [];
  if (!s.startsWith('@') && s.includes('/')) return []; // github shorthand user/repo
  const at = s.indexOf('@', 1); // version, tag or range after the name
  if (at !== -1) s = s.slice(0, at);
  return /^(@[a-z0-9][\w.~-]*\/)?[a-z0-9][\w.~-]*$/i.test(s) ? [s] : [];
}

function pyName(token) {
  const s = token.trim();
  if (!s || s.startsWith('-')) return [];
  if (s.includes('://') || /^(git|hg|svn|bzr)\+/.test(s) || /^[.~/]/.test(s) || /[\\/]/.test(s) || /\.(whl|tar\.gz|zip|tgz)$/i.test(s)) return [];
  const m = s.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/); // stops at [extras], ==, >=, @, ;
  return m ? [m[1]] : [];
}

// --- Option tables ------------------------------------------------------------
// withArg: options whose next word is a value, not a package. packageOpts:
// options whose value *is* a package; `suppresses` means the first positional
// is then a command name (npx -p typescript tsc) rather than a package.

const NPM_FAMILY = {
  read: npmName,
  withArg: new Set(['--registry', '--prefix', '-w', '--workspace', '--tag', '--userconfig', '--cache', '--loglevel', '--otp',
    '--install-strategy', '--omit', '--include', '--script-shell', '-C', '--dir', '--filter', '-F', '--cwd', '--backend',
    '--modules-folder', '--mutex', '--network-concurrency', '--config', '-c', '--call', '--shell', '--node-options']),
  packageOpts: { '-p': true, '--package': true },
};

const PY_FAMILY = {
  read: pyName,
  withArg: new Set(['-r', '--requirement', '-c', '--constraint', '-i', '--index-url', '--extra-index-url', '-f', '--find-links',
    '-t', '--target', '--prefix', '--root', '--src', '-e', '--editable', '--python', '--platform', '--implementation', '--abi',
    '--no-binary', '--only-binary', '--progress-bar', '--proxy', '--retries', '--timeout', '--trusted-host', '--cert',
    '--client-cert', '--cache-dir', '--log', '--exists-action', '--config-settings', '-C', '--root-user-action', '--report',
    '-p', '--python-version', '--index', '--default-index', '--group', '-G', '--extras', '-E', '--source', '--optional',
    '--python-preference', '--resolution', '--exclude-newer', '--link-mode', '--config-file', '--project', '--directory',
    '--keyring-provider', '--category', '--spec']),
  packageOpts: { '--with': false, '--from': true, '--spec': true },
};

/**
 * Walk the words after a subcommand. `mode` is 'install' (every positional
 * is a package) or 'run' (only the first positional is, unless a package
 * option already named it; the rest are arguments to the tool being run).
 */
function collect(words, family, mode) {
  const names = [];
  let onlyPositional = false;
  let pending = null; // what the next word is: 'skip' | 'package'
  let positionals = 0;
  let namedByOption = false;
  for (const w of words) {
    if (pending) {
      if (pending === 'package') names.push(...family.read(w));
      pending = null;
      continue;
    }
    if (!onlyPositional) {
      if (w === '--') { onlyPositional = true; continue; }
      if (/^\d*[<>]/.test(w)) { if (/^\d*[<>]{1,2}&?$/.test(w)) pending = 'skip'; continue; } // redirects
      if (w.startsWith('-') && w.length > 1) {
        const eq = w.indexOf('=');
        const opt = eq === -1 ? w : w.slice(0, eq);
        const inline = eq === -1 ? null : w.slice(eq + 1);
        if (opt in family.packageOpts) {
          if (family.packageOpts[opt]) namedByOption = true;
          if (inline !== null) names.push(...family.read(inline)); else pending = 'package';
          continue;
        }
        if (inline === null && family.withArg.has(opt)) pending = 'skip';
        continue;
      }
    }
    if (mode === 'run') {
      if (positionals++ > 0) break;
      if (namedByOption) continue;
    }
    names.push(...family.read(w));
  }
  return names;
}

const NPM_INSTALL = new Set(['install', 'i', 'in', 'ins', 'inst', 'insta', 'instal', 'isnt', 'isnta', 'isntal', 'isntall', 'add']);

/** Recognise one simple command. Returns { ecosystem, tool, names } or null. */
function recognise(tokens) {
  const t = unwrap(tokens);
  if (!t.length) return null;
  const cmd = base(t[0]);
  const sub = t[1];
  const npm = (tool, words, mode = 'install') => ({ ecosystem: 'npm', tool, names: collect(words, NPM_FAMILY, mode) });
  const py = (tool, words, mode = 'install') => ({ ecosystem: 'pypi', tool, names: collect(words, PY_FAMILY, mode) });

  switch (cmd) {
    case 'npm':
      if (NPM_INSTALL.has(sub)) return npm(`npm ${sub}`, t.slice(2));
      if (sub === 'exec' || sub === 'x') return npm(`npm ${sub}`, t.slice(2), 'run');
      return null;
    case 'pnpm':
      if (['add', 'install', 'i'].includes(sub)) return npm(`pnpm ${sub}`, t.slice(2));
      if (sub === 'dlx') return npm('pnpm dlx', t.slice(2), 'run');
      return null;
    case 'yarn': {
      const g = sub === 'global' ? 1 : 0;
      const s2 = t[1 + g];
      if (s2 === 'add') return npm(g ? 'yarn global add' : 'yarn add', t.slice(2 + g));
      if (s2 === 'dlx') return npm('yarn dlx', t.slice(2 + g), 'run');
      return null;
    }
    case 'bun':
      if (['add', 'install', 'i', 'a'].includes(sub)) return npm(`bun ${sub}`, t.slice(2));
      if (sub === 'x') return npm('bun x', t.slice(2), 'run');
      return null;
    case 'npx':
    case 'bunx':
      return npm(cmd, t.slice(1), 'run');
    case 'deno':
      if (['add', 'install'].includes(sub)) {
        const names = t.slice(2).filter((w) => w.startsWith('npm:')).flatMap((w) => npmName(w.slice(4)));
        return { ecosystem: 'npm', tool: `deno ${sub}`, names };
      }
      return null;
    case 'pip':
    case 'pip3':
      if (sub === 'install') return py(`${cmd} install`, t.slice(2));
      return null;
    case 'python':
    case 'python3':
    case 'py':
      if (sub === '-m' && /^pip3?$/.test(t[2] || '') && t[3] === 'install') return py('pip install', t.slice(4));
      return null;
    case 'uv':
      if (sub === 'add') return py('uv add', t.slice(2));
      if (sub === 'pip' && t[2] === 'install') return py('uv pip install', t.slice(3));
      if (sub === 'tool' && t[2] === 'install') return py('uv tool install', t.slice(3));
      if (sub === 'tool' && t[2] === 'run') return py('uv tool run', t.slice(3), 'run');
      return null;
    case 'uvx':
      return py('uvx', t.slice(1), 'run');
    case 'pipx':
      if (sub === 'install') return py('pipx install', t.slice(2));
      if (sub === 'run') return py('pipx run', t.slice(2), 'run');
      return null;
    case 'poetry':
      if (sub === 'add') return py('poetry add', t.slice(2));
      return null;
    case 'pipenv':
      if (sub === 'install') return py('pipenv install', t.slice(2));
      return null;
    case 'pdm':
      if (sub === 'add') return py('pdm add', t.slice(2));
      return null;
    default:
      if (/^(pip3?\.\d+|python3\.\d+)$/.test(cmd)) return recognise([cmd.startsWith('pip') ? 'pip' : 'python', ...t.slice(1)]);
      return null;
  }
}

/**
 * All package names a command would fetch, grouped by the install it came
 * from: [{ ecosystem: 'npm' | 'pypi', tool: 'npm install', names: [...] }].
 * Commands that install nothing by name give [].
 */
export function extractInstalls(command, depth = 0) {
  const out = [];
  for (const tokens of splitCommands(command)) {
    const t = unwrap(tokens);
    const cmd = base(t[0] || '');
    // `sh -c "npm i x"` and `eval npm i x` run whatever is inside; look there.
    if (depth < 3 && /^(sh|bash|zsh|dash|ksh|fish)$/.test(cmd)) {
      const c = t.indexOf('-c');
      if (c !== -1 && t[c + 1]) out.push(...extractInstalls(t[c + 1], depth + 1));
      continue;
    }
    if (depth < 3 && cmd === 'eval') { out.push(...extractInstalls(t.slice(1).join(' '), depth + 1)); continue; }
    const hit = recognise(tokens);
    if (hit && hit.names.length) out.push({ ...hit, names: [...new Set(hit.names)] });
  }
  return out;
}

/**
 * Pull the shell command out of a hook payload. Understands Claude Code's
 * PreToolUse JSON (`tool_input.command`), a plain `{ "command": ... }`, and a
 * bare command string; anything else yields null.
 */
export function commandFromHookInput(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  let input;
  try {
    input = JSON.parse(text);
  } catch {
    return text;
  }
  if (!input || typeof input !== 'object') return null;
  const c = input.tool_input?.command ?? input.command;
  return typeof c === 'string' && c.trim() ? c : null;
}

/**
 * Check every package a command would install. The result mirrors the CLI's
 * JSON: worst-first `results`, plus `blocked` at the given --fail-on level.
 */
export async function inspectInstallCommand(command, { failOn = 'danger', concurrency = 5 } = {}) {
  const packages = extractInstalls(command);
  const byEcosystem = new Map();
  for (const p of packages) {
    const set = byEcosystem.get(p.ecosystem) || new Set();
    for (const n of p.names) set.add(n);
    byEcosystem.set(p.ecosystem, set);
  }
  const results = [];
  for (const [ecosystem, set] of byEcosystem) {
    const names = [...set];
    if (ecosystem === 'npm') await primeDownloads(names);
    results.push(...await inspectMany(names, { ecosystem, concurrency }));
  }
  results.sort((a, b) => (VERDICT_ORDER[a.verdict] ?? 9) - (VERDICT_ORDER[b.verdict] ?? 9));
  const blocking = blockingVerdicts(failOn);
  const blocked = results.filter((r) => blocking.has(r.verdict));
  return { command, packages, total: results.length, blocking: blocked.length, blocked, results };
}
