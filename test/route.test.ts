/**
 * Route contract: trust fence first, then method, then endpoint, then payload.
 * The reader, the fence and the clock are all injected, so this file covers the
 * HTTP surface without a Host process.
 */
import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { test } from 'node:test'

import { handleRequest, type RouteDeps } from '../src/host/index.ts'

interface Captured {
  status: number
  headers: Record<string, string>
  body: string
}

function request(method: string, url: string): IncomingMessage {
  return { method, url } as unknown as IncomingMessage
}

function response(): { res: ServerResponse; captured: Captured } {
  const captured: Captured = { status: 0, headers: {}, body: '' }
  const res = {
    get statusCode(): number {
      return captured.status
    },
    set statusCode(value: number) {
      captured.status = value
    },
    setHeader(name: string, value: string): void {
      captured.headers[name.toLowerCase()] = value
    },
    end(chunk?: string): void {
      captured.body = chunk ?? ''
    },
  }
  return { res: res as unknown as ServerResponse, captured }
}

const ready = {
  status: 'ready' as const,
  wallet: { currency: 'CNY', total: '6.19', granted: '0', toppedUp: '6.19' },
  at: 1_000,
}

function deps(overrides: Partial<RouteDeps> = {}): RouteDeps {
  return {
    reader: { read: async () => ready },
    rejection: () => undefined,
    now: () => Date.UTC(2026, 9, 26, 2, 0, 0), // Monday 10:00 Beijing
    ...overrides,
  }
}

test('a trusted GET returns the state payload', async () => {
  const { res, captured } = response()
  await handleRequest(request('GET', '/wallet-pill/state'), res, deps())

  assert.equal(captured.status, 200)
  assert.equal(captured.headers['content-type'], 'application/json; charset=utf-8')
  assert.equal(captured.headers['cache-control'], 'no-store')
  const body = JSON.parse(captured.body) as {
    ok: boolean
    value: { balance: unknown; pricing: { zone: string } }
  }
  assert.equal(body.ok, true)
  assert.deepEqual(body.value.balance, ready)
  assert.equal(body.value.pricing.zone, 'peak')
})

test('refresh=1 reaches the reader, everything else does not', async () => {
  const seen: boolean[] = []
  const reader = {
    read: async (force?: boolean) => {
      seen.push(force === true)
      return ready
    },
  }

  const first = response()
  await handleRequest(request('GET', '/wallet-pill/state?refresh=1'), first.res, deps({ reader }))
  const second = response()
  await handleRequest(request('GET', '/wallet-pill/state'), second.res, deps({ reader }))

  assert.deepEqual(seen, [true, false])
})

test('the status probe answers without touching the reader', async () => {
  let reads = 0
  const reader = {
    read: async () => {
      reads += 1
      return ready
    },
  }
  const { res, captured } = response()
  await handleRequest(request('GET', '/wallet-pill/status'), res, deps({ reader }))

  assert.equal(captured.status, 200)
  assert.equal(reads, 0)
  assert.equal((JSON.parse(captured.body) as { value: { name: string } }).value.name, 'wallet-pill')
})

test('a rejected request gets the fence status and no body', async () => {
  const { res, captured } = response()
  await handleRequest(request('GET', '/wallet-pill/state'), res, deps({ rejection: () => 403 }))

  assert.equal(captured.status, 403)
  assert.equal(captured.body, '')
})

test('a non-GET method is refused before the endpoint is read', async () => {
  const { res, captured } = response()
  await handleRequest(request('POST', '/wallet-pill/state'), res, deps())

  assert.equal(captured.status, 405)
  assert.equal(captured.headers.allow, 'GET')
  assert.equal(captured.body, '')
})

test('an unknown endpoint answers with the error envelope', async () => {
  const { res, captured } = response()
  await handleRequest(request('GET', '/wallet-pill/nope'), res, deps())

  assert.equal(captured.status, 404)
  const body = JSON.parse(captured.body) as { ok: boolean; error: { code: string } }
  assert.equal(body.ok, false)
  assert.equal(body.error.code, 'wallet/bad-request')
})

test('a reader failure surfaces as 502 without leaking the reason', async () => {
  const { res, captured } = response()
  await handleRequest(
    request('GET', '/wallet-pill/state'),
    res,
    deps({
      reader: {
        read: async () => {
          throw new Error('sk-secret exploded')
        },
      },
    }),
  )

  assert.equal(captured.status, 502)
  assert.equal(captured.body.includes('sk-secret'), false)
  assert.equal(
    (JSON.parse(captured.body) as { error: { code: string } }).error.code,
    'wallet/balance-failed',
  )
})
