import { handleRequest } from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'

// node crypto for testing
import crypto from 'crypto';

declare let global: any

describe('handle', () => {
  beforeAll(function () {
    // Web Crypto, specifically crypto.getRandomValues is not available in
    // Node. Stub out getRandomValues for tests.
    global.crypto = {
      getRandomValues: function (buf: Uint8Array) {
        if (!(buf instanceof Uint8Array)) {
          throw new TypeError("expected Uint8Array");
        }
        const bytes = crypto.randomBytes(buf.length);
        buf.set(bytes);
        return buf;
      }
    };
  });

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
    const result = await handleRequest(new Request('/?q=1001', { method: 'GET' }))
    expect(result.status).toEqual(400)
  })

  test('returns an error with q=foo', async () => {
    const result = await handleRequest(new Request('/?q=foo', { method: 'GET' }))
    expect(result.status).toEqual(400)
  })

  test('returns a non-monotonicFactory ULID only if requested', async () => {
    const result = await handleRequest(new Request('/?m=false', { method: 'GET' }))
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    expect(obj).toHaveLength(1)
    expect(obj[0]).toHaveProperty('monotonic', false)
  })

  test('returns a monotonicFactory ULID for any non "false" value of m', async () => {
    const result = await handleRequest(new Request('/?m=true', { method: 'GET' }))
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    expect(obj).toHaveLength(1)
    expect(obj[0]).toHaveProperty('monotonic', true)
  })

  test('returns a specified time ULID with a valid seed value', async () => {
    const result = await handleRequest(new Request('/?s=1469918176385', { method: 'GET' }))
    expect(result.status).toEqual(200)
    const text = await result.text()
    const obj = JSON.parse(text)
    expect(obj).toHaveLength(1)
    // Monotonic function is not used when a seed is specified
    expect(obj[0]).toHaveProperty('monotonic', false)
    // The timestamp portion of the ULID is derived from the seed value
    expect(obj[0].ulid).toContain('01ARYZ6S41')
  })

})
