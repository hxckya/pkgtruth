import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { extractInstalls, commandFromHookInput, splitCommands } from '../src/installcmd.js';

const npm = (cmd) => extractInstalls(cmd).filter((p) => p.ecosystem === 'npm').flatMap((p) => p.names);
const py = (cmd) => extractInstalls(cmd).filter((p) => p.ecosystem === 'pypi').flatMap((p) => p.names);

test('tokeniser honours quotes, separators and comments', () => {
  assert.deepEqual(splitCommands(`npm i "a b" && pip install 'x>=1' # note`), [['npm', 'i', 'a b'], ['pip', 'install', 'x>=1']]);
  assert.deepEqual(splitCommands('(cd app && npm ci)'), [['cd', 'app'], ['npm', 'ci']]);
});

test('npm install: names kept, flags, versions, paths and urls dropped', () => {
  assert.deepEqual(npm('npm install express'), ['express']);
  assert.deepEqual(npm('npm i -D typescript@5 @types/node@20 --save-exact'), ['typescript', '@types/node']);
  assert.deepEqual(npm('npm install'), []);
  assert.deepEqual(npm('npm install --save-dev'), []);
  assert.deepEqual(npm('npm i ./local ../x file:foo github:a/b user/repo https://x/y.tgz ~/z'), []);
  assert.deepEqual(npm('npm i --registry https://r.example.com crossenv'), ['crossenv']);
  assert.deepEqual(npm('npm i --registry=https://r.example.com crossenv'), ['crossenv']);
  assert.deepEqual(npm('npm i alias@npm:real@1'), ['real']);
  assert.deepEqual(npm('npm i express > out.log 2>&1'), ['express']);
  assert.deepEqual(npm('npm install express # add web'), ['express']);
});

test('other npm-family managers and runners', () => {
  assert.deepEqual(npm('pnpm add -w -D vitest'), ['vitest']);
  assert.deepEqual(npm('pnpm install'), []);
  assert.deepEqual(npm('pnpm dlx shadcn@latest add button'), ['shadcn']);
  assert.deepEqual(npm('yarn add react react-dom'), ['react', 'react-dom']);
  assert.deepEqual(npm('yarn global add serve'), ['serve']);
  assert.deepEqual(npm('bun add -d @types/bun'), ['@types/bun']);
  assert.deepEqual(npm('bunx --bun vite build'), ['vite']);
  assert.deepEqual(npm('npx create-vite my-app --template react'), ['create-vite']);
  assert.deepEqual(npm('npx -y -p typescript tsc --noEmit'), ['typescript']);
  assert.deepEqual(npm('npx --package=prettier -- prettier --check .'), ['prettier']);
  assert.deepEqual(npm('npm exec -- prettier --check .'), ['prettier']);
  assert.deepEqual(npm('deno add npm:express jsr:@std/path'), ['express']);
});

test('things that are not installs yield nothing and stay cheap', () => {
  assert.deepEqual(extractInstalls('npm run build && npm test'), []);
  assert.deepEqual(extractInstalls('git status'), []);
  assert.deepEqual(extractInstalls('echo "npm install evil"'), []);
  assert.deepEqual(extractInstalls('npm ci'), []);
  assert.deepEqual(extractInstalls(''), []);
});

test('wrappers, env assignments, chains and shells are seen through', () => {
  assert.deepEqual(npm('FOO=1 sudo -E npm i -g pkgtruth'), ['pkgtruth']);
  assert.deepEqual(npm('sudo -u deploy npm i left-pad'), ['left-pad']);
  assert.deepEqual(npm('cd app && npm ci && npx create-vite my-app'), ['create-vite']);
  assert.deepEqual(npm('bash -c "npm install crossenv"'), ['crossenv']);
  assert.deepEqual(npm('eval npm install crossenv'), ['crossenv']);
  assert.deepEqual(extractInstalls('npm i express && pip install requests').map((p) => p.ecosystem), ['npm', 'pypi']);
});

test('pip and friends: specifiers, extras, requirement files, editable and vcs', () => {
  assert.deepEqual(py('pip install requests'), ['requests']);
  assert.deepEqual(py('pip3 install -r requirements.txt'), []);
  assert.deepEqual(py('python -m pip install --upgrade "requests>=2.31" numpy==1.26'), ['requests', 'numpy']);
  assert.deepEqual(py('python3.12 -m pip install httpx'), ['httpx']);
  assert.deepEqual(py('pip install -e .'), []);
  assert.deepEqual(py('pip install git+https://github.com/x/y.git'), []);
  assert.deepEqual(py("uv add fastapi 'sqlalchemy[asyncio]'"), ['fastapi', 'sqlalchemy']);
  assert.deepEqual(py('uv pip install -i https://idx.example sklearn'), ['sklearn']);
  assert.deepEqual(py('uvx --from ruff==0.5 ruff check'), ['ruff']);
  assert.deepEqual(py('uvx ruff check .'), ['ruff']);
  assert.deepEqual(py('uvx --with rich textual'), ['rich', 'textual']);
  assert.deepEqual(py('poetry add requests@^2 -G dev pytest'), ['requests', 'pytest']);
  assert.deepEqual(py('pipx install black'), ['black']);
  assert.deepEqual(py('pipx run --spec httpie http'), ['httpie']);
  assert.deepEqual(py('pipenv install django'), ['django']);
});

test('hook payloads: Claude Code JSON, plain JSON, bare text, nothing', () => {
  assert.equal(commandFromHookInput('{"tool_name":"Bash","tool_input":{"command":"npm i x"}}'), 'npm i x');
  assert.equal(commandFromHookInput('{"command":"pip install y"}'), 'pip install y');
  assert.equal(commandFromHookInput('{"tool_name":"Write","tool_input":{"file_path":"a"}}'), null);
  assert.equal(commandFromHookInput('npm i x'), 'npm i x');
  assert.equal(commandFromHookInput('   '), null);
  assert.equal(commandFromHookInput('[1,2]'), null);
});

// --- The hook end to end ------------------------------------------------------

const BIN = path.resolve(import.meta.dirname, '../bin/pkgtruth.js');

function hook(stdin, args = []) {
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [BIN, 'hook', ...args], (err, stdout, stderr) => {
      resolve({ code: err ? err.code : 0, stdout, stderr });
    });
    child.stdin.end(stdin);
  });
}

test('hook: a command that installs nothing exits 0 silently', async () => {
  const r = await hook('{"tool_name":"Bash","tool_input":{"command":"git status && npm test"}}');
  assert.equal(r.code, 0);
  assert.equal(r.stdout, '');
});

test('hook: a non-Bash tool payload and malformed input are ignored', async () => {
  assert.equal((await hook('{"tool_name":"Write","tool_input":{"file_path":"x"}}')).code, 0);
  assert.equal((await hook('{not json')).code, 0);
  assert.equal((await hook('')).code, 0);
});

const online = process.env.PKGTRUTH_TEST_ONLINE === '1';

test('hook: a blocked package denies the command with the evidence', { skip: !online }, async () => {
  const r = await hook('{"tool_name":"Bash","tool_input":{"command":"npm install crossenv express"}}');
  assert.equal(r.code, 2);
  const out = JSON.parse(r.stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /crossenv/);
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /cross-env/);
  assert.match(r.stderr, /blocked this command/);
});

test('hook: a hallucinated PyPI name is denied too', { skip: !online }, async () => {
  const r = await hook('{"tool_input":{"command":"pip install reqeusts-http-clientz"}}');
  assert.equal(r.code, 2);
  assert.match(r.stdout, /"deny"/);
});

test('hook: clean installs pass', { skip: !online }, async () => {
  const r = await hook('npm install express');
  assert.equal(r.code, 0);
});

// --- Run mode must not alarm on tools the project already has ------------------

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

test('npx of a locally installed bin fetches nothing, so it is not checked', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'pkgtruth-npx-'));
  try {
    mkdirSync(path.join(root, 'node_modules', '.bin'), { recursive: true });
    mkdirSync(path.join(root, 'node_modules', 'typescript'), { recursive: true });
    writeFileSync(path.join(root, 'node_modules', '.bin', 'tsc'), '#!/bin/sh\n');
    writeFileSync(path.join(root, 'node_modules', 'typescript', 'package.json'), '{}');
    mkdirSync(path.join(root, 'packages', 'app'), { recursive: true });
    const sub = path.join(root, 'packages', 'app');

    assert.deepEqual(extractInstalls('npx tsc --noEmit', { cwd: root }), []);
    assert.deepEqual(extractInstalls('npx tsc --noEmit', { cwd: sub }), [], 'walks up to the project root');
    assert.deepEqual(extractInstalls('npx -p typescript tsc', { cwd: root }), [], 'an installed package named by -p');
    assert.deepEqual(extractInstalls(`cd ${JSON.stringify(sub)} && npx tsc`, { cwd: tmpdir() }), [], 'cd earlier in the chain');
    assert.deepEqual(npm('npx tsc@5.4 --noEmit'), ['tsc'], 'an explicit version is always fetched');
    assert.deepEqual(extractInstalls('npx tsc', { cwd: tmpdir() }).flatMap((p) => p.names), ['tsc'], 'nothing local → checked');
    assert.deepEqual(extractInstalls('npm install tsc', { cwd: root }).flatMap((p) => p.names), ['tsc'], 'install mode is never skipped');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('hook input carries cwd when Claude Code sends it', async () => {
  const { hookInput } = await import('../src/installcmd.js');
  assert.deepEqual(hookInput('{"cwd":"/tmp/x","tool_input":{"command":"npx tsc"}}'), { command: 'npx tsc', cwd: '/tmp/x' });
  assert.deepEqual(hookInput('npx tsc'), { command: 'npx tsc', cwd: null });
});
