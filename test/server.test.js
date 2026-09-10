import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer, VERSION } from '../src/server.js';

async function connected() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  const client = new Client({ name: 'test', version: '0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  return { client, close: () => Promise.all([client.close(), server.close()]) };
}

test('server reports the package.json version', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+/);
});

test('three read-only tools, each with an output schema', async () => {
  const { client, close } = await connected();
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), ['check_dependencies', 'check_install_command', 'check_package']);
    for (const t of tools) {
      assert.ok(t.outputSchema, `${t.name} has an output schema`);
      assert.equal(t.annotations?.readOnlyHint, true);
    }
  } finally {
    await close();
  }
});

test('check_install_command on a non-install command answers without a network call', async () => {
  const { client, close } = await connected();
  try {
    const r = await client.callTool({ name: 'check_install_command', arguments: { command: 'git status && npm ci' } });
    assert.equal(r.isError, undefined);
    assert.equal(r.structuredContent.total, 0);
    assert.deepEqual(r.structuredContent.packages, []);
    assert.match(r.content[0].text, /No package names found/);
  } finally {
    await close();
  }
});

const online = process.env.PKGTRUTH_TEST_ONLINE === '1';

test('check_install_command blocks a placeholder and validates against the schema', { skip: !online }, async () => {
  const { client, close } = await connected();
  try {
    const r = await client.callTool({ name: 'check_install_command', arguments: { command: 'npm install crossenv express' } });
    assert.equal(r.isError, undefined, JSON.stringify(r.content));
    assert.equal(r.structuredContent.blocking, 1);
    assert.equal(r.structuredContent.results[0].name, 'crossenv');
  } finally {
    await close();
  }
});

test('check_package structured output passes the declared schema for a hallucinated name', { skip: !online }, async () => {
  const { client, close } = await connected();
  try {
    const r = await client.callTool({ name: 'check_package', arguments: { name: 'reqeusts-http-client' } });
    assert.equal(r.isError, undefined, JSON.stringify(r.content));
    assert.equal(r.structuredContent.verdict, 'HALLUCINATED');
  } finally {
    await close();
  }
});
