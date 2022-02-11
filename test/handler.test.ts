import { handleRequest } from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'
import { decodeTime } from 'ulid-workers'

// node crypto for testing
import crypto from 'crypto'

declare let global: any

// const TEST_ULID = '01ARYZ6S41TSV4RRFFQ69G5FAV'
const TEST_TIME_EPOCH_MS = 1469918176385

describe('handle', () => {
  beforeAll(function () {
    // Web Crypto, specifically crypto.getRandomValues is not available in
    // Node. Stub out getRandomValues for tests.
    global.crypto = {
      getRandomValues: function (buf: Uint8Array) {
        if (!(buf instanceof Uint8Array)) {
          throw new TypeError('expected Uint8Array')
        }
        const bytes = crypto.randomBytes(buf.length)
        buf.set(bytes)
        return buf
      },
    }
  })

  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  test('returns an Array of length 1 and expected object props with no query params', async () => {
    const result = await handleRequest(new Request('/', { method: 'GET' }))
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    expect(obj).toHaveLength(1)
    expect(obj[0]).toHaveProperty('monotonic', true)
    expect(obj[0]).toHaveProperty('ulid')
    expect(obj[0]).toHaveProperty('ts')
  })

  test('returns an Array of length 10 with q=10', async () => {
    const result = await handleRequest(new Request('/?q=10', { method: 'GET' }))
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    expect(obj).toHaveLength(10)
  })

  test('returns an error with q=0', async () => {
    const result = await handleRequest(new Request('/?q=0', { method: 'GET' }))
    expect(result.status).toEqual(400)
  })

  test('returns an error with q=1001', async () => {
    const result = await handleRequest(
      new Request('/?q=1001', { method: 'GET' }),
    )
    expect(result.status).toEqual(400)
  })

  test('returns an error with q=foo', async () => {
    const result = await handleRequest(
      new Request('/?q=foo', { method: 'GET' }),
    )
    expect(result.status).toEqual(400)
  })

  test('returns a non-monotonic ULID only if requested', async () => {
    const result = await handleRequest(
      new Request('/?m=false', { method: 'GET' }),
    )
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    expect(obj).toHaveLength(1)
    expect(obj[0]).toHaveProperty('monotonic', false)
  })

  test('returns a monotonic ULID for any non "false" value of m', async () => {
    const result = await handleRequest(
      new Request('/?m=true', { method: 'GET' }),
    )
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    expect(obj).toHaveLength(1)
    expect(obj[0]).toHaveProperty('monotonic', true)
  })

  test('returns a single non-monotonic ULID with a specified timestamp value', async () => {
    const result = await handleRequest(
      new Request(`/?q=1&t=${TEST_TIME_EPOCH_MS}&m=false`, { method: 'GET' }),
    )
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    // console.log(obj)
    expect(obj).toHaveLength(1)
    expect(obj[0]).toHaveProperty('monotonic', false)
    expect(obj[0]).toHaveProperty('t', TEST_TIME_EPOCH_MS)
    expect(decodeTime(obj[0].ulid)).toBe(TEST_TIME_EPOCH_MS)
  })

  test('returns multiple monotonic ULIDs with a specified timestamp value', async () => {
    const result = await handleRequest(
      new Request(`/?q=10&t=${TEST_TIME_EPOCH_MS}`, { method: 'GET' }),
    )
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    // console.log(obj)
    expect(obj).toHaveLength(10)

    expect(obj[0]).toHaveProperty('monotonic', true)
    expect(obj[0]).toHaveProperty('t', TEST_TIME_EPOCH_MS)
    expect(decodeTime(obj[0].ulid)).toBe(TEST_TIME_EPOCH_MS)

    expect(obj[1]).toHaveProperty('monotonic', true)
    expect(obj[1]).toHaveProperty('t', TEST_TIME_EPOCH_MS)
    expect(decodeTime(obj[1].ulid)).toBe(TEST_TIME_EPOCH_MS)
  })
})
