# ULID Generator

A simple Cloudflare Worker API to generate unique [ULID](https://github.com/ulid/spec) strings using the [ulid-workers](https://github.com/ryan-mars/ulid-workers) library.

## Usage

You can try out this API using the `https://ulid.truestamp.com/` endpoint. You are free to use this, but please don't abuse it.

These examples show how to call the API using a plain URL and the [HTTPIE](https://httpie.io/cli) CLI tool.

This API allows you to exercise the full capability of the ULID library by passing parameters to the API request.

### Default

Calling the worker with no params will generate a JSON array with a single object that contains the following properties:

- `monotonic` - a boolean indicating whether the monotonic ULID factory was used (default : true).
- `t` - a timestamp of the Cloudflare Worker request time or timestamp override as a UNIX epoch in ms.
- `ts` - an `ISO-8601` timestamp of the Cloudflare Worker request time or timestamp override.
- `ulid` - the ULID value.

#### Example

[https://ulid.truestamp.com](https://ulid.truestamp.com)

```sh
❯ https --print b https://ulid.truestamp.com
[
    {
        "monotonic": true,
        "t": 1644553616119,
        "ts": "2022-02-11T04:26:56.119Z",
        "ulid": "01FVKGHEQQJ3CBH1G1HDEG8YPS"
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
        "t": 1644553645224,
        "ts": "2022-02-11T04:27:25.224Z",
        "ulid": "01FVKGJB58M3ERB35J6KFKPPK8"
    },
    {
        "monotonic": true,
        "t": 1644553645224,
        "ts": "2022-02-11T04:27:25.224Z",
        "ulid": "01FVKGJB58M3ERB35J6KFKPPK9"
    },
    {
        "monotonic": true,
        "t": 1644553645224,
        "ts": "2022-02-11T04:27:25.224Z",
        "ulid": "01FVKGJB58M3ERB35J6KFKPPKA"
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
        "t": 1644553683002,
        "ts": "2022-02-11T04:28:03.002Z",
        "ulid": "01FVKGKG1TE8K09B9PBSZR41GY"
    }
]
```

### Timestamp Override

By default the ULID will be generated with the current time of the Cloudflare Worker request as milliseconds from the UNIX Epoch. You can override the timestamp component of the ULID by passing in a timestamp value that is a number interpreted as the number of milliseconds from the UNIX Epoch.

#### Example : Specify a timestamp value

[https://ulid.truestamp.com/?t=1469918176385](https://ulid.truestamp.com/?t=1469918176385)

```sh
❯ https --print b https://ulid.truestamp.com t==1469918176385
[
    {
        "monotonic": true,
        "t": 1469918176385,
        "ts": "2016-07-30T22:36:16.385Z",
        "ulid": "01ARYZ6S41KRGGPEHFA2V7C7ZQ"
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

If you never decode your ULID to extract the timestamp, and only care about the uniqueness and lexical sort of the ULIDs, you probably need not care about any of this.
