/// <reference types="node" />
/// <reference types="readable-stream" />

// ---------------------------------------------------------------------------
// Avro schema DSL types
// ---------------------------------------------------------------------------

export type AvroPrimitiveType =
  | 'null'
  | 'boolean'
  | 'int'
  | 'long'
  | 'float'
  | 'double'
  | 'bytes'
  | 'string';

export interface AvroRecordField {
  name: string;
  type: AvroSchema;
  default?: unknown;
  doc?: string;
  order?: 'ascending' | 'descending' | 'ignore';
  aliases?: string[];
}

export interface AvroRecordSchema {
  type: 'record' | 'error';
  name: string;
  namespace?: string;
  doc?: string;
  aliases?: string[];
  fields: AvroRecordField[];
}

export interface AvroEnumSchema {
  type: 'enum';
  name: string;
  namespace?: string;
  symbols: string[];
  default?: string;
  doc?: string;
  aliases?: string[];
}

export interface AvroArraySchema {
  type: 'array';
  items: AvroSchema;
}

export interface AvroMapSchema {
  type: 'map';
  values: AvroSchema;
}

export interface AvroFixedSchema {
  type: 'fixed';
  name: string;
  size: number;
  aliases?: string[];
}

export interface AvroLogicalSchema {
  type: AvroPrimitiveType | 'record' | 'enum' | 'array' | 'map' | 'fixed';
  logicalType: string;
  [key: string]: unknown;
}

/** Catch-all for `{ type: 'string' }` and similar shorthand objects. */
export interface AvroNamedTypeObject {
  type: AvroPrimitiveType;
  [key: string]: unknown;
}

export type AvroComplexSchema =
  | AvroRecordSchema
  | AvroEnumSchema
  | AvroArraySchema
  | AvroMapSchema
  | AvroFixedSchema
  | AvroLogicalSchema
  | AvroNamedTypeObject;

/** A valid Avro schema: primitive name, complex object, union array, or a resolved Type. */
export type AvroSchema = AvroPrimitiveType | AvroComplexSchema | AvroSchema[] | string | Type;

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export type Callback<V, E = Error> = (err: E | null, value?: V) => void;

export type Codec = (buf: Uint8Array, cb: Callback<Uint8Array>) => void;

export interface CodecOptions {
  [name: string]: Codec;
}

export interface ForSchemaOptions {
  assertLogicalTypes?: boolean;
  logicalTypes?: { [typeName: string]: new (schema: AvroSchema, opts?: ForSchemaOptions) => types.LogicalType };
  namespace?: string;
  noAnonymousTypes?: boolean;
  omitRecordMethods?: boolean;
  registry?: { [name: string]: Type };
  typeHook?: (schema: AvroSchema, opts: ForSchemaOptions) => Type | undefined;
  wrapUnions?: boolean | 'auto' | 'always' | 'never';
}

export interface TypeOptions extends ForSchemaOptions {
  strictDefaults?: boolean;
}

export interface ForValueOptions extends TypeOptions {
  emptyArrayType?: Type;
  valueHook?: (val: unknown, opts: ForValueOptions) => Type;
}

export interface CloneOptions {
  coerceBuffers?: boolean;
  fieldHook?: (field: types.Field, value: unknown, type: Type) => unknown;
  qualifyNames?: boolean;
  skipMissingFields?: boolean;
  wrapUnions?: boolean;
}

export interface IsValidOptions {
  noUndeclaredFields?: boolean;
  errorHook?: (path: string[], val: unknown, type: Type) => void;
}

export interface SchemaOptions {
  exportAttrs?: boolean;
  noDeref?: boolean;
}

export interface CreateResolverOptions {
  ignoreNamespaces?: boolean;
}

export interface DecoderOptions {
  noDecode?: boolean;
  readerSchema?: string | object | Type;
  codecs?: CodecOptions;
  parseHook?: (schema: AvroSchema) => Type;
}

export interface EncoderOptions {
  blockSize?: number;
  codec?: string;
  codecs?: CodecOptions;
  writeHeader?: boolean | 'always' | 'never' | 'auto';
  syncMarker?: Uint8Array;
}

export interface AssembleOptions {
  importHook: (filePath: string, type: 'idl', callback: Callback<object>) => void;
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export declare class Resolver {
  // Opaque — only created via Type.createResolver()
}

// ---------------------------------------------------------------------------
// Type<T> — the core class, generic so encode/decode carry the value type
// ---------------------------------------------------------------------------

export declare class Type<T = unknown> {
  /**
   * Serialize a value to an Avro-encoded buffer.
   *
   * @example
   * const schema = Type.forSchema<User>({ type: 'record', name: 'User', fields: [...] })
   * const buf: Uint8Array = schema.toBuffer({ id: 1, name: 'Alice' })
   */
  toBuffer(value: T): Uint8Array;

  /**
   * Deserialize an Avro-encoded buffer back to a value.
   * The return type matches the generic parameter `T` passed to `Type.forSchema<T>()`.
   *
   * @example
   * const user: User = schema.fromBuffer(buf)
   */
  fromBuffer(buffer: Uint8Array, resolver?: Resolver, noCheck?: boolean): T;

  fromString(str: string): T;
  toString(val?: T): string;

  // Encode into an existing buffer; returns new position
  encode(val: T, buf: Uint8Array, pos?: number): number;
  decode(buf: Uint8Array, pos?: number, resolver?: Resolver): { value: T; offset: number };

  // Validation & cloning
  isValid(val: unknown, opts?: IsValidOptions): val is T;
  clone(val: unknown, opts?: CloneOptions): T;

  // Comparison
  compare(val1: T, val2: T): number;
  compareBuffers(buf1: Uint8Array, buf2: Uint8Array): number;

  // Schema resolution
  createResolver(writerType: Type, opts?: CreateResolverOptions): Resolver;
  equals(type: Type): boolean;
  schema(opts?: SchemaOptions): AvroSchema;

  // Utilities
  fingerprint(algorithm?: string): Uint8Array;
  inspect(): string;
  toJSON(): object;
  wrap(val: T): unknown;
  random(): T;

  // Properties
  readonly aliases: string[] | undefined;
  readonly doc: string | undefined;
  readonly name: string | undefined;
  readonly branchName: string | undefined;
  readonly typeName: string;

  /**
   * Build a `Type` from an Avro schema definition.
   * Pass a TypeScript type as the generic parameter to get typed `toBuffer` / `fromBuffer`.
   *
   * @example
   * interface User { id: number; name: string }
   * const schema = Type.forSchema<User>({ type: 'record', name: 'User', fields: [...] })
   * const buf   = schema.toBuffer({ id: 1, name: 'Alice' })  // value must match User
   * const user  = schema.fromBuffer(buf)                      // inferred as User
   */
  static forSchema<T = unknown>(schema: AvroSchema, opts?: ForSchemaOptions): Type<T>;
  static forTypes<T = unknown>(types: Type[], opts?: TypeOptions): Type<T>;
  static forValue<T = unknown>(value: object, opts?: ForValueOptions): Type<T>;
  static isType(arg: unknown, ...typeNames: string[]): arg is Type;
}

// ---------------------------------------------------------------------------
// Service (IPC/RPC — browser-compatible subset)
// ---------------------------------------------------------------------------

export declare class Service {
  createClient(options?: Partial<Service.ClientOptions>): Service.Client;
  createServer(options?: Partial<Service.ServerOptions>): Service.Server;
  inspect(): string;
  message(name: string): unknown;
  type(name: string): Type | undefined;

  readonly doc: string | undefined;
  readonly hash: Uint8Array;
  readonly messages: unknown[];
  readonly name: string;
  readonly protocol: unknown;
  readonly types: Type[];

  static compatible(client: Service.Client, server: Service.Server): boolean;
  static forProtocol(protocol: unknown, options?: unknown): Service;
  static isService(obj: unknown): obj is Service;
}

export declare namespace Service {
  interface ClientOptions {
    buffering?: boolean;
    strictTypes?: boolean;
    timeout?: number;
    remoteProtocols?: boolean;
  }

  interface ServerOptions {
    objectMode?: boolean;
  }

  class Client {
    activeChannels(): ClientChannel[];
    destroyChannels(options?: { noWait?: boolean }): void;
    use(...args: unknown[]): this;
  }

  class Server {
    readonly service: Service;
    activeChannels(): ServerChannel[];
    onMessage<T>(name: string, handler: (arg: unknown, callback: Callback<T>) => void): this;
    use(...args: unknown[]): this;
  }

  interface ClientChannel {
    readonly destroyed: boolean;
    readonly pending: number;
    readonly timeout: number;
    ping(timeout?: number, cb?: Callback<void>): void;
    destroy(noWait?: boolean): void;
  }

  interface ServerChannel {
    readonly destroyed: boolean;
    readonly pending: number;
    readonly server: Server;
    destroy(noWait?: boolean): void;
  }
}

// ---------------------------------------------------------------------------
// Streams (browser-compatible — uses readable-stream under the hood)
// ---------------------------------------------------------------------------

import { Duplex, Transform } from 'readable-stream';

export declare namespace streams {
  class BlockDecoder extends Duplex {
    constructor(opts?: DecoderOptions);
    static defaultCodecs(): CodecOptions;
  }

  class BlockEncoder extends Duplex {
    constructor(schema: AvroSchema, opts?: EncoderOptions);
    static defaultCodecs(): CodecOptions;
  }

  class RawDecoder extends Duplex {
    constructor(schema: AvroSchema, opts?: { decode?: boolean });
  }

  class RawEncoder extends Duplex {
    constructor(schema: AvroSchema, opts?: { batchSize?: number });
  }
}

// ---------------------------------------------------------------------------
// Browser-specific helpers
// ---------------------------------------------------------------------------

/** Decode an Avro container stored as a browser Blob. */
export declare function createBlobDecoder(blob: Blob, opts?: DecoderOptions): streams.BlockDecoder;

/** Encode Avro values into a container. The returned encoder emits a single
 *  Blob when `.end()` is called. Access it via `encoder.blob` (a Promise). */
export declare function createBlobEncoder(
  schema: AvroSchema,
  opts?: EncoderOptions
): streams.BlockEncoder & { blob: Promise<Blob> };

// ---------------------------------------------------------------------------
// Top-level utilities
// ---------------------------------------------------------------------------

/** Parse an Avro schema or IDL string and return a Type or Service. */
export declare function parse(schemaOrIdl: string | AvroSchema, opts?: ForSchemaOptions): Type | Service;

export declare function readSchema(schemaIdl: string, opts?: Partial<DecoderOptions>): AvroSchema;
export declare function readProtocol(protocolIdl: string, opts?: Partial<DecoderOptions>): unknown;

export declare function assembleProtocol(filePath: string, opts: Partial<AssembleOptions>, callback: Callback<object>): void;
export declare function assembleProtocol(filePath: string, callback: Callback<object>): void;

export declare function discoverProtocol(
  transport: unknown,
  options: unknown,
  callback: Callback<unknown>
): void;
export declare function discoverProtocol(transport: unknown, callback: Callback<unknown>): void;

// ---------------------------------------------------------------------------
// Built-in type classes (for LogicalType extension)
// ---------------------------------------------------------------------------

export declare namespace types {
  class ArrayType<T = unknown> extends Type<T[]> {
    readonly itemsType: Type<T>;
  }

  class MapType<T = unknown> extends Type<{ [key: string]: T }> {
    readonly valuesType: Type<T>;
  }

  class RecordType extends Type<Record<string, unknown>> {
    readonly fields: Field[];
    readonly recordConstructor: unknown;
    field(name: string): Field;
  }

  class EnumType extends Type<string> {
    readonly symbols: string[];
  }

  class FixedType extends Type<Uint8Array> {
    readonly size: number;
  }

  class LogicalType<T = unknown> extends Type<T> {
    readonly underlyingType: Type;
    protected _export(schema: AvroSchema): void;
    protected _fromValue(val: unknown): T;
    protected _resolve(type: Type): unknown;
    protected _toValue(val: T): unknown;
  }

  class LongType extends Type<number> {
    static __with(methods: object, noUnpack?: boolean): LongType;
  }

  class Field {
    name: string;
    type: Type;
    order: string;
    aliases: string[];
    defaultValue(): unknown;
  }

  class BooleanType extends Type<boolean> {}
  class BytesType extends Type<Uint8Array> {}
  class DoubleType extends Type<number> {}
  class FloatType extends Type<number> {}
  class IntType extends Type<number> {}
  class NullType extends Type<null> {}
  class StringType extends Type<string> {}

  class UnwrappedUnionType extends Type {
    readonly types: Type[];
  }

  class WrappedUnionType extends Type {
    readonly types: Type[];
  }
}

// ---------------------------------------------------------------------------
// Default export (for `import avrocado from 'avrocado'`)
// ---------------------------------------------------------------------------

declare const avrocado: {
  Type: typeof Type;
  Service: typeof Service;
  streams: typeof streams;
  types: typeof types;
  parse: typeof parse;
  readSchema: typeof readSchema;
  readProtocol: typeof readProtocol;
  assembleProtocol: typeof assembleProtocol;
  discoverProtocol: typeof discoverProtocol;
  createBlobDecoder: typeof createBlobDecoder;
  createBlobEncoder: typeof createBlobEncoder;
};

export default avrocado;
