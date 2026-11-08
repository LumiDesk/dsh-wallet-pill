/**
 * Query-string metadata for account balance reads. The browser supplies the
 * values; the Host validates them before they become Platform request headers.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { clientMetadataOf } from '../src/host/metadata.ts'

test('a request without metadata gets neutral defaults', () => {
  assert.deepEqual(clientMetadataOf(undefined, 28_800), {
    version: '0.0.0',
    locale: 'en-US',
    timezoneOffsetSeconds: 28_800,
  })
  assert.deepEqual(clientMetadataOf('/wallet-pill/state', 0), {
    version: '0.0.0',
    locale: 'en-US',
    timezoneOffsetSeconds: 0,
  })
})

test('the browser values pass through unchanged', () => {
  const url = '/wallet-pill/state?refresh=1&locale=zh-CN&tz=28800&v=1.1.0'
  assert.deepEqual(clientMetadataOf(url, -18_000), {
    version: '1.1.0',
    locale: 'zh-CN',
    timezoneOffsetSeconds: 28_800,
  })
})

test('prerelease versions and underscored locales survive validation', () => {
  const url = '/wallet-pill/state?v=0.2.2-rc.1&locale=zh_CN'
  const metadata = clientMetadataOf(url, 0)
  assert.equal(metadata.version, '0.2.2-rc.1')
  assert.equal(metadata.locale, 'zh_CN')
})

test('a malformed version falls back instead of reaching Platform', () => {
  for (const value of ['', ' two words', '../1.0.0', '-1.0.0', 'x'.repeat(40)]) {
    const url = `/wallet-pill/state?v=${encodeURIComponent(value)}`
    assert.equal(clientMetadataOf(url, 0).version, '0.0.0', `version ${JSON.stringify(value)}`)
  }
})

test('a malformed locale falls back instead of reaching Platform', () => {
  for (const value of ['', 'zh/../en', 'chinese-simplified-mainland', 'zh-', '12']) {
    const url = `/wallet-pill/state?locale=${encodeURIComponent(value)}`
    assert.equal(clientMetadataOf(url, 0).locale, 'en-US', `locale ${JSON.stringify(value)}`)
  }
})

test('an out-of-range offset clamps, a missing one uses the Host offset', () => {
  assert.equal(
    clientMetadataOf('/wallet-pill/state?tz=999999', 28_800).timezoneOffsetSeconds,
    86_400,
  )
  assert.equal(
    clientMetadataOf('/wallet-pill/state?tz=-999999', 28_800).timezoneOffsetSeconds,
    -86_400,
  )
  assert.equal(clientMetadataOf('/wallet-pill/state?tz=', 28_800).timezoneOffsetSeconds, 28_800)
  assert.equal(clientMetadataOf('/wallet-pill/state?tz=abc', 28_800).timezoneOffsetSeconds, 28_800)
  assert.equal(
    clientMetadataOf('/wallet-pill/state?tz=28_800', 0).timezoneOffsetSeconds,
    0,
    'underscores are not part of a number and fall back to the Host offset',
  )
})

test('a fractional offset truncates to whole seconds', () => {
  assert.equal(clientMetadataOf('/wallet-pill/state?tz=28800.9', 0).timezoneOffsetSeconds, 28_800)
})
