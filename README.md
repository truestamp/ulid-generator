# ULID Generator

A simple Cloudflare Worker API to generate unique [ULID](https://github.com/ulid/spec) strings using the [ulid-workers](https://github.com/ryan-mars/ulid-workers) library.

## Usage

You can try out this API using the `https://ulid.truestamp.com/` endpoint. You are free to use this, but please don't abuse it.

These examples show how to call the API using a plain URL and the [HTTPIE](https://httpie.io/cli) CLI tool.

This API allows you to exercise the full capability of the ULID library by passing parameters to the API request.

### Default

Calling the worker with no params will generate a JSON array with a single object that contains the following properties:

- `monotonic` - a boolean indicating whether the monotonic ULID factory was used (default : true).
- `ts` - an `ISO-8601` timestamp of the Cloudflare Worker request time.
- `ulid` - the ULID value.

#### Example

[https://ulid.truestamp.com](https://ulid.truestamp.com)

```sh
❯ https --print b https://ulid.truestamp.com
[
    {
        "monotonic": true,
        "ts": "2022-01-02T17:36:08.145Z",
        "ulid": "01FRDXSRYHTEFJ56Q490VJPRXV"
    }
]
```

### Quantity

Pass a `?q=n` query string param, where `n` is the quantity of ULID's you want generated. Valid values are `1 - 1000`

#### Example : Generate three ULIDs

[https://ulid.truestamp.com/?q=3](https://ulid.truestamp.com/?q=3)

```sh
❯ https --print b https://ulid.truestamp.com q==3
[
    {
        "monotonic": true,
        "ts": "2022-01-02T17:38:35.822Z",
        "ulid": "01FRDXY95ETSPBVT447N2GPDZ7"
    },
    {
        "monotonic": true,
        "ts": "2022-01-02T17:38:35.822Z",
        "ulid": "01FRDXY95ETSPBVT447N2GPDZ8"
    },
    {
        "monotonic": true,
        "ts": "2022-01-02T17:38:35.822Z",
        "ulid": "01FRDXY95ETSPBVT447N2GPDZ9"
    }
]
```

### Monotonic

The monotonic ULID factory is used by default. You can override this by setting the `m` query string parameter to `false`. e.g. `?m=false`.

#### Example : Do not use Monotonic function

[https://ulid.truestamp.com/?m=false](https://ulid.truestamp.com/?m=false)

```sh
❯ https --print b https://ulid.truestamp.com m==false
[
    {
        "monotonic": false,
        "ts": "2022-01-02T17:42:36.537Z",
        "ulid": "01FRDY5M7SC2GEH115CX1MVY3F"
    }
]
```

### Seed

By default the ULID will be generated with the current time of the Cloudflare Worker request as milliseconds from the UNIX Epoch. You can override the timestamp component of the ULID by passing in a seed value that is a number interpreted as the number of milliseconds from the UNIX Epoch.

#### Note

If a seed value is specified the `monotonic` property will always be `false` and the `ts` property will still reflect the time at the start of the request, not the `seed` time.

#### Example : Specify a seed value

[https://ulid.truestamp.com/?s=1469918176385](https://ulid.truestamp.com/?s=1469918176385)

```sh
❯ https --print b https://ulid.truestamp.com s==1469918176385
[
    {
        "monotonic": false,
        "ts": "2022-01-02T17:43:11.912Z",
        "ulid": "01ARYZ6S41W35EQ2JQ634TH006"
    }
]
```

## Cloudflare Workers Caveat

In Cloudflare Workers, for security reasons, the time returned by `Date.now()` does not change during the course of executing a single request (typically measured in milliseconds of run time).

See the [documentation](https://developers.cloudflare.com/workers/learning/security-model#step-1-disallow-timers-and-multi-threading) to understand why this is necessary.

However, this has no effect on the generation of valid unique ULID values since a large part of the ULID is composed of a full [80 bits of randomness](https://github.com/ulid/spec#specification) which allows for `1.21e+24 unique ULIDs per millisecond`.

It would seem the only effect this may have on your use of ULIDs generated within a Cloudflare Worker is if you rely on millisecond accurate timestamps within your ULID that match the wall clock time in `ms` at the time they were generated. This does NOT affect the uniqueness of your ULIDs.

For example, if your Cloudflare function was very slow, running for seconds, when you reach the point in your code where the ULID is generated it may have a timestamp component that is stale and represents the start time of your request. If your use case requires extreme accuracy of the ULID timestamp you would be advised to generate your ULIDs in an environment that supports access to high precision clock values that are in lockstep with wall time (e.g. run your own Deno or NodeJS server on a bare metal server with an accurate NTP synced clock).

Most use cases for ULIDs probably do not demand this level of timestamp precision, and are primarily concerned with no-conflict uniqueness and lexical sortability. If this is not the case for you then Cloudflare Workers may not be the right choice for ULID generation (or perhaps your application in general).
