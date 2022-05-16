// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { MonotonicULID } from './monotonicULID'

interface Env {
  MONOTONIC_ULID: DurableObjectNamespace
}

async function handleRequest(request: Request, env: Env) {
  const { searchParams } = new URL(request.url)

  // q is the query parameter the represents how many ulids to generate "?q=10"
  const quantity = parseInt(searchParams.get('q') ?? '1', 10)

  if (isNaN(quantity)) {
    return new Response(`Invalid q parameter (NaN): ${quantity}`, {
      status: 400,
    })
  }

  if (quantity < 1) {
    return new Response(`Invalid q parameter (<1): ${quantity}`, {
      status: 400,
    })
  }

  if (quantity > 1000) {
    return new Response(`Invalid q parameter (>1000): ${quantity}`, {
      status: 400,
    })
  }

  // 'default' is an arbitrary name, and will always return the same id
  const id = env.MONOTONIC_ULID.idFromName('default')
  const stub = env.MONOTONIC_ULID.get(id)
  // the hostname 'object' is arbitrary, and will always point to the Durable Object
  const response = await stub.fetch('http://object/?q=' + quantity)
  const ulids = await response.json()

  return new Response(`${JSON.stringify(ulids, null, 2)}`, {
    headers: {
      'content-type': 'application/json',
    },
  })
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      return await handleRequest(request, env)
    } catch (e) {
      return new Response(`${e}`)
    }
  },
}
