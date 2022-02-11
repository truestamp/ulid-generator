import { ulidFactory, decodeTime } from 'ulid-workers'

const TIME_MAX = Math.pow(2, 48) - 1

export async function handleRequest(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)

  // q is the query parameter the represents how many ulids to generate "?q=10"
  const quantity = parseInt(searchParams.get('q') || '1', 10)
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

  // m is the query parameter the represents whether to use the monotonic factory "?q=10&m=false"
  // setting m to 'false' will not use the monotonic factory, any other value will use it by default
  const useMonotonic = searchParams.get('m') === 'false' ? false : true

  // 't' is the query parameter that represents the UNIX Epoch timestamp to use for the ulid "?q=10&t=12345"
  let timestamp
  if (searchParams.get('t') !== null) {
    timestamp = parseInt(searchParams.get('t') as string, 10)
  }
  if (timestamp && isNaN(timestamp)) {
    return new Response(`Invalid t parameter (NaN): ${timestamp}`, {
      status: 400,
    })
  }
  if (timestamp && timestamp < 0) {
    return new Response(`Invalid t parameter (<0): ${timestamp}`, {
      status: 400,
    })
  }
  if (timestamp && timestamp > TIME_MAX) {
    return new Response(`Invalid t parameter (> 2^48 - 1): ${quantity}`, {
      status: 400,
    })
  }

  const ulidMonotonic = ulidFactory({ monotonic: true })
  const ulidNonMonotonic = ulidFactory({ monotonic: false })

  const ulids = []
  for (let i = 0; i < quantity; i++) {
    const ulid = useMonotonic
      ? ulidMonotonic(timestamp)
      : ulidNonMonotonic(timestamp)

    ulids.push({
      monotonic: useMonotonic,
      t: decodeTime(ulid),
      ts: new Date(decodeTime(ulid)).toISOString(),
      ulid: ulid,
    })
  }

  return new Response(JSON.stringify(ulids, null, 2), {
    headers: {
      'content-type': 'application/json',
    },
  })
}
