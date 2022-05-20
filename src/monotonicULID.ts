import { ulidFactory, decodeTime, ULIDFactory } from 'ulid-workers'
const ulid: ULIDFactory = ulidFactory({ monotonic: true })

interface ULIDObject {
  t: number
  ts: string
  ulid: string
}

export class MonotonicULID {
  state: DurableObjectState

  // eslint-disable-next-line prettier/prettier
  constructor(state: DurableObjectState) {
    this.state = state
  }

  // Handle HTTP requests from clients.
  // eslint-disable-next-line @typescript-eslint/require-await
  async fetch(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url)
    const url = new URL(request.url)

    // q is the query parameter the represents how many ulids to generate "?q=10"
    const quantity = parseInt(searchParams.get('q') ?? '1', 10)

    const ulids: ULIDObject[] = []

    switch (url.pathname) {
      case '/':
        for (let i = 0; i < quantity; i++) {
          const ulidObj: ULIDObject = this.constructULID(ulid)
          ulids.push(ulidObj)
        }
        break
      default:
        return new Response('Not found', { status: 404 })
    }

    return new Response(JSON.stringify(ulids), { status: 200 })
  }

  constructULID(factory: ULIDFactory): ULIDObject {
    const ulid = factory()
    const ulidObj: ULIDObject = {
      t: decodeTime(ulid),
      ts: new Date(decodeTime(ulid)).toISOString(),
      ulid: ulid,
    }

    return ulidObj
  }
}
