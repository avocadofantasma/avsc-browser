# avsc-browser

**Apache Avro serialization that actually works in the browser.**

`avsc-browser` is a browser-compatible fork of [`avsc`](https://github.com/mtth/avsc) — the fastest and most complete Avro implementation in JavaScript. The original library is Node.js-only. This fork replaces every Node built-in with browser-safe equivalents so you can use Avro schemas, encode/decode records, and work with Avro containers in any Vite, React, Next.js, or serverless environment with zero configuration.

---

## Why this exists

`avsc` is excellent, but it depends on `buffer`, `stream`, `zlib`, `events`, `util`, `fs`, `path`, and `process` — all Node.js built-ins that browsers don't have. The moment you `import avsc` in a Vite app, you get:

```
Module "buffer" has been externalized for browser compatibility.
Uncaught TypeError: Cannot read properties of undefined (reading 'alloc')
```

`avsc-browser` fixes this by replacing every Node dependency with a browser-native equivalent:

| Node module | Replacement |
|---|---|
| `buffer` | [`buffer`](https://www.npmjs.com/package/buffer) npm polyfill |
| `crypto` | Pure-JS MD5 (avsc's own browser shim) |
| `stream` | [`readable-stream`](https://www.npmjs.com/package/readable-stream) |
| `events` | [`events`](https://www.npmjs.com/package/events) npm polyfill |
| `util` | Inlined minimal replacements (`inherits`, `deprecate`, `format`) |
| `zlib` | Native browser [`CompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream) API |
| `process.nextTick` | Native [`queueMicrotask()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/queueMicrotask) |
| `fs` / `path` | Stubbed — throws a clear error if called in the browser |

All of this is **bundled inside the package**. You install one dependency and everything works.

---

## Installation

```bash
npm install avsc-browser
# or
pnpm add avsc-browser
# or
yarn add avsc-browser
```

---

## Quick start

```ts
import { Type } from 'avsc-browser'

const schema = Type.forSchema({
  type: 'record',
  name: 'User',
  fields: [
    { name: 'id',    type: 'int'    },
    { name: 'name',  type: 'string' },
    { name: 'email', type: 'string' },
  ],
})

const encoded = schema.toBuffer({ id: 1, name: 'Alice', email: 'alice@example.com' })
const decoded = schema.fromBuffer(encoded)
// → { id: 1, name: 'Alice', email: 'alice@example.com' }
```

---

## TypeScript

Pass your interface as the generic parameter to get fully typed `toBuffer` / `fromBuffer`:

```ts
import { Type } from 'avsc-browser'

interface User {
  id: number
  name: string
  email: string
}

const schema = Type.forSchema<User>({
  type: 'record',
  name: 'User',
  fields: [
    { name: 'id',    type: 'int'    },
    { name: 'name',  type: 'string' },
    { name: 'email', type: 'string' },
  ],
})

const buf: Uint8Array = schema.toBuffer({ id: 1, name: 'Alice', email: 'alice@example.com' })
const user: User      = schema.fromBuffer(buf)
```

---

## All schema types supported

```ts
import { Type } from 'avsc-browser'

// Primitives: null, boolean, int, long, float, double, bytes, string
// Complex: record, enum, array, map, union, fixed
// Logical: date, time-millis, timestamp-millis, decimal, uuid, ...

const orderSchema = Type.forSchema({
  type: 'record',
  name: 'Order',
  fields: [
    { name: 'id',       type: 'long'                                      },
    { name: 'status',   type: { type: 'enum', name: 'Status',
                                symbols: ['PENDING', 'SHIPPED', 'DONE'] } },
    { name: 'items',    type: { type: 'array', items: 'string'           } },
    { name: 'metadata', type: { type: 'map',   values: 'string'         } },
    { name: 'note',     type: ['null', 'string'], default: null           },
  ],
})
```

---

## Working with Blobs (file upload / download)

`avsc-browser` ships browser-native helpers for reading and writing Avro container files as [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) objects.

### Encode to a Blob

```ts
import { createBlobEncoder } from 'avsc-browser'

const encoder = createBlobEncoder(schema)

encoder.write({ id: 1, name: 'Alice', email: 'alice@example.com' })
encoder.write({ id: 2, name: 'Bob',   email: 'bob@example.com'   })
encoder.end()

const blob: Blob = await encoder.blob
// → download it, send it to an API, store it in IndexedDB, etc.
```

### Decode from a Blob

```ts
import { createBlobDecoder } from 'avsc-browser'

// e.g. from a file <input> or a fetch() response
const blob: Blob = await fetch('/data/users.avro').then(r => r.blob())

const decoder = createBlobDecoder(blob)
decoder.on('data', (record) => console.log(record))
decoder.on('end',  () => console.log('done'))
```

---

## Streams

The full `streams` API is available for processing Avro container data:

```ts
import { streams } from 'avsc-browser'

const decoder = new streams.BlockDecoder()
const encoder = new streams.BlockEncoder(schema)
const rawDecoder = new streams.RawDecoder(schema)
const rawEncoder = new streams.RawEncoder(schema)
```

---

## Custom logical types

Extend `types.LogicalType` to add your own types (e.g. map `long` timestamps to `Date`):

```ts
import { Type, types } from 'avsc-browser'

class DateType extends types.LogicalType<Date> {
  protected _fromValue(val: unknown): Date  { return new Date(val as number) }
  protected _toValue(val: Date): unknown    { return val.getTime() }
}

const schema = Type.forSchema(
  { type: 'long', logicalType: 'timestamp-millis' },
  { logicalTypes: { 'timestamp-millis': DateType } }
)

const buf  = schema.toBuffer(new Date())
const date = schema.fromBuffer(buf) // → Date
```

---

## Default import

If you prefer a single namespace import:

```ts
import avro from 'avsc-browser'

const schema = avro.Type.forSchema({ ... })
```

---

## API reference

The full API mirrors `avsc`. See the [avsc documentation](https://github.com/mtth/avsc/wiki) for detailed reference — every method listed there works in `avsc-browser` except the Node.js file-system helpers (`createFileDecoder`, `createFileEncoder`, `extractFileHeader`), which are replaced by the browser Blob equivalents above.

### Top-level exports

| Export | Description |
|---|---|
| `Type` | Core class — parse schemas, encode/decode values |
| `Service` | IPC/RPC service definition |
| `streams` | `BlockDecoder`, `BlockEncoder`, `RawDecoder`, `RawEncoder` |
| `types` | Built-in type classes for logical type extension |
| `parse(schema)` | Parse a schema string or object → `Type` or `Service` |
| `readSchema(idl)` | Parse Avro IDL string → schema object |
| `readProtocol(idl)` | Parse Avro protocol IDL |
| `createBlobDecoder(blob)` | Decode an Avro container `Blob` → readable stream |
| `createBlobEncoder(schema)` | Encode records → Avro container `Blob` |

---

## Browser compatibility

| API used internally | Browser support |
|---|---|
| `CompressionStream` (deflate) | Chrome 80+, Firefox 113+, Safari 16.4+ |
| `queueMicrotask` | All modern browsers |
| `Blob` | All modern browsers |
| `FileReader` | All modern browsers |

> If you need to support older browsers or environments without `CompressionStream`, open an issue — we can add a fallback.

---

## Vite / bundler setup

No configuration needed. `avsc-browser` ships a pre-bundled ESM build (`dist/index.mjs`) that contains all polyfills. Just install and import.

```ts
// Works out of the box in Vite, Next.js, Remix, Astro, esbuild, Rollup...
import { Type } from 'avsc-browser'
```

---

## Credits

`avsc-browser` is a fork of [`avsc`](https://github.com/mtth/avsc) by [mtth](https://github.com/mtth), licensed under Apache-2.0. All the hard work of implementing the Avro specification is theirs. This project exists solely to make that work accessible in browser environments.

---

## Contributing

Bug reports and pull requests are welcome. The source is in `src/` — all files are plain CommonJS, bundled for the browser via [tsup](https://tsup.egoist.dev/).

```bash
git clone https://github.com/avocadofantasma/avsc-browser
cd avsc-browser
npm install
npm run build   # outputs to dist/
npm run dev     # watch mode
```

---

## License

Apache-2.0 — same as the upstream `avsc` project.
