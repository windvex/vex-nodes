import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicHttps, loadRegistry, validateRegistry } from './validate-registry.mjs';

test('registry is valid', () => assert.ok(loadRegistry().entries.length >= 4));
test('internal URLs and embedded credentials rejected', () => {
  for (const url of ['http://host.org','https://localhost','https://127.0.0.1','https://host.internal','https://user:pass@host.org','https://host.org?token=secret']) {
    assert.equal(isPublicHttps(url), false, url);
  }
});
test('duplicates rejected', () => {
  const { network, entries } = loadRegistry();
  assert.throws(() => validateRegistry(network, [entries[0],entries[0]]), /Duplicate/);
});
