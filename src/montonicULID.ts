import { ulidFactory, decodeTime } from 'ulid-workers'
import type { ULID, ULIDFactory } from 'ulid-workers'

const ulid = ulidFactory({ monotonic: true });

export class MonotonicULID {
  state: DurableObjectState

  constructor (state: DurableObjectState, env: Env) {
    this.state = state;
  }

  // Handle HTTP requests from clients.
  async fetch(request: Request) {
    const { searchParams } = new URL(request.url)
    const url = new URL(request.url);

    // q is the query parameter the represents how many ulids to generate "?q=10"
    const quantity = parseInt(searchParams.get('q') || '1', 10)

    const ulids = [];

    switch (url.pathname) {
      case "/":
        for (let i = 0; i < quantity; i++) {
          const ulidObj = this.constructULID(ulid);
          ulids.push(ulidObj);
        }
        break;
      default:
        return new Response("Not found", { status: 404 });
    }

    return new Response(JSON.stringify(ulids), { status: 200 });
  }

  constructULID(factory: ULIDFactory): Record<string, any> {
    const ulid = factory();
    const ulidObj = {
      t: decodeTime(ulid),
      ts: new Date(decodeTime(ulid)).toISOString(),
      ulid: ulid,
    };

    return ulidObj;
  }
}

interface Env { }