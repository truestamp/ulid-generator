import { ulid, monotonicFactory } from 'ulid-workers'
const ulidm = monotonicFactory()

export async function handleRequest(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)

  // q is the query parameter the represents how many ulids to generate "?q=10"
  const quantity = parseInt(searchParams.get('q') || '1', 10)
  if (isNaN(quantity)) {
    return new Response(`Invalid q parameter (NaN): ${quantity}`, { status: 400 })
  }
  if (quantity < 1) {
    return new Response(`Invalid q parameter (<1): ${quantity}`, { status: 400 })
  }
  if (quantity > 1000) {
    return new Response(`Invalid q parameter (>1000): ${quantity}`, { status: 400 })
  }

  // m is the query parameter the represents whether to use the monotonic factory "?q=10&m=false"
  // setting m to 'false' will not use the monotonic factory, any other value will use it by default
  let useMonotonic = searchParams.get('m') === "false" ? false : true

  // seed is the query parameter the represents the seed to use for the ulid "?q=10&s=12345"
  let seed
  if (searchParams.get('s') !== null) {
    seed = parseInt(searchParams.get('s') as string, 10)
    // If the seed is valid we cannot use the monotonic factory
    // as its function signature won't accept a seed.
    useMonotonic = false
  }

  const ulids = []
  for (let i = 0; i < quantity; i++) {
    ulids.push({
      monotonic: useMonotonic,
      ts: new Date().toISOString(),
      ulid: useMonotonic ? ulidm() : ulid(seed),
    })
  }

  return new Response(JSON.stringify(ulids, null, 2), {
    headers: {
      'content-type': 'application/json',
    },
  })
}
