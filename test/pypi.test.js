import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, coreName } from '../src/ecosystems/pypi.js';
import { parseRequirements, parsePyproject } from '../src/manifests.js';
import { inspectPackage } from '../src/detect.js';

test('PEP 503: case and separators collapse', () => {
  assert.equal(normalizeName('Typing_Extensions'), 'typing-extensions');
  assert.equal(normalizeName('zope.interface'), 'zope-interface');
  assert.equal(normalizeName('Pillow'), 'pillow');
});

test('coreName strips the python-/py-/-python decorations models add', () => {
  assert.equal(coreName('python-dateutil'), 'dateutil');
  assert.equal(coreName('pyyaml'), 'yaml');
  assert.equal(coreName('requests-python'), 'requests');
});

test('requirements.txt parsing keeps names, drops the rest', () => {
  const names = parseRequirements(`
    # comment
    requests>=2.31,<3   # pinned
    numpy==1.26.4
    uvicorn[standard]
    -r other.txt
    git+https://github.com/x/y.git#egg=y
    typing_extensions ; python_version < "3.11"
  `);
  assert.deepEqual(names, ['requests', 'numpy', 'uvicorn', 'typing_extensions']);
});

test('pyproject.toml parsing reads PEP 621 and Poetry tables', () => {
  const names = parsePyproject(`
[project]
name = "demo"
dependencies = [
  "fastapi>=0.110",
  "sqlalchemy[asyncio]",
]

[project.optional-dependencies]
dev = ["pytest", "ruff"]

[tool.poetry.dependencies]
python = "^3.11"
httpx = "^0.27"
`);
  assert.deepEqual(new Set(names), new Set(['fastapi', 'sqlalchemy', 'pytest', 'ruff', 'httpx']));
});

const online = process.env.PKGTRUTH_TEST_ONLINE === '1';

test('pypi: a popular package is SAFE', { skip: !online }, async () => {
  const r = await inspectPackage('requests', { ecosystem: 'pypi' });
  assert.equal(r.verdict, 'SAFE');
  assert.equal(r.ecosystem, 'pypi');
});

test('pypi: a name that does not exist is HALLUCINATED', { skip: !online }, async () => {
  const r = await inspectPackage('reqeusts-http-clientz', { ecosystem: 'pypi' });
  assert.equal(r.verdict, 'HALLUCINATED');
});

// `sklearn` is a deprecated shim whose own description says to use
// scikit-learn; it still takes hundreds of thousands of installs a week.
test('pypi: the sklearn shim is DANGER with a deprecation notice and a popular twin', { skip: !online }, async () => {
  const r = await inspectPackage('sklearn', { ecosystem: 'pypi' });
  assert.equal(r.verdict, 'DANGER');
  assert.ok(r.signals.some((s) => s.id === 'deprecated'));
  assert.ok(r.signals.some((s) => s.id === 'impersonates_popular_package'));
});

// `pytorch` is the famous decoy: its only content is a message that the real
// package is `torch`.
test('pypi: pytorch is not SAFE', { skip: !online }, async () => {
  const r = await inspectPackage('pytorch', { ecosystem: 'pypi' });
  assert.notEqual(r.verdict, 'SAFE');
  assert.ok(r.signals.some((s) => s.id === 'impersonates_popular_package' || s.id === 'deprecated'));
});

test('pypi: the legitimate twin is not flagged', { skip: !online }, async () => {
  const r = await inspectPackage('scikit-learn', { ecosystem: 'pypi' });
  assert.equal(r.verdict, 'SAFE');
});
