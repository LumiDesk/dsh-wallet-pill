/**
 * Host scaffold checks. The plugin has no features yet, so this only pins the
 * routing contract the Client half and any future route share.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ROUTE_PATH, endpointOf, name } from '../src/host/index.ts'

test('route prefix and loader name stay in sync with the package name', () => {
  assert.equal(name, 'wallet-pill')
  assert.equal(ROUTE_PATH, '/wallet-pill')
})

test('endpointOf resolves one flat endpoint under the prefix', () => {
  assert.equal(endpointOf('/wallet-pill/status'), 'status')
  assert.equal(endpointOf('/wallet-pill/status?probe=1'), 'status')
})

test('endpointOf rejects everything that is not one flat endpoint', () => {
  assert.equal(endpointOf(undefined), undefined)
  assert.equal(endpointOf('/'), undefined)
  assert.equal(endpointOf('/wallet-pill'), undefined)
  assert.equal(endpointOf('/wallet-pill/'), undefined)
  assert.equal(endpointOf('/wallet-pill/a/b'), undefined)
  assert.equal(endpointOf('/other/status'), undefined)
})
