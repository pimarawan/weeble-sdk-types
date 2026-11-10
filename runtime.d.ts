/**
 * Writes to the deployment's runtime logs. All five methods preserve their log level.
 * Do not log bot tokens, credentials, private KV values, or unnecessary user data.
 */
interface Console {
  error(message?: unknown, ...optionalParams: unknown[]): void;
  log(message?: unknown, ...optionalParams: unknown[]): void;
  warn(message?: unknown, ...optionalParams: unknown[]): void;
  info(message?: unknown, ...optionalParams: unknown[]): void;
  debug(message?: unknown, ...optionalParams: unknown[]): void;
}

declare var console: Console;

interface Performance {
  /** Milliseconds elapsed since this runtime instance started. The origin may span several events. */
  now(): number;

  /** Unix timestamp, in milliseconds, used as the zero point for `performance.now()`. */
  readonly timeOrigin: number;
}

declare var performance: Performance;

/** Decodes base64 to a Latin-1 binary string, not UTF-8 text. */
declare function atob(encodedString: string): string;
/** Encodes a Latin-1 binary string as base64 and throws for characters above U+00FF. */
declare function btoa(rawString: string): string;

/**
 * Runs a callback every `timeout` milliseconds. Only work awaited by the current handler is
 * guaranteed to finish; do not use timers for durable background work or scheduling.
 */
declare function setInterval<TArgs extends unknown[]>(
  handler: (...args: TArgs) => void,
  timeout?: number,
  ...arguments: TArgs
): number;
/** Runs a callback after `timeout` milliseconds. Timer callbacks are not awaited. */
declare function setTimeout<TArgs extends unknown[]>(
  handler: (...args: TArgs) => void,
  timeout?: number,
  ...arguments: TArgs
): number;
declare function clearInterval(handle?: number): void;
declare function clearTimeout(handle?: number): void;
/** Waits for `timeout` milliseconds. Await it from the current handler. */
declare function sleep(timeout: number): Promise<void>;

interface AbortSignal {
  readonly aborted: boolean;
  onabort: ((this: AbortSignal, event: unknown) => unknown) | null;
  readonly reason: unknown;
  throwIfAborted(): void;
  addEventListener(
    type: "abort",
    listener: (event: unknown) => void,
    options?: boolean | { once?: boolean },
  ): void;
  removeEventListener(
    type: "abort",
    listener: (event: unknown) => void,
    options?: boolean,
  ): void;
}

declare var AbortSignal: {
  prototype: AbortSignal;
  abort(reason?: unknown): AbortSignal;
  any(signals: AbortSignal[]): AbortSignal;
  timeout(milliseconds: number): AbortSignal;
};

declare class AbortController {
  constructor();
  readonly signal: AbortSignal;
  abort(reason?: unknown): void;
}

type FormDataEntryValue = File | string;

declare class FormData {
  constructor();

  append(name: string, value: string | Blob, fileName?: string): void;
  delete(name: string): void;
  get(name: string): FormDataEntryValue | null;
  getAll(name: string): FormDataEntryValue[];
  has(name: string): boolean;
  set(name: string, value: string | Blob, fileName?: string): void;
  forEach(
    callbackfn: (
      value: FormDataEntryValue,
      key: string,
      parent: FormData,
    ) => void,
    thisArg?: unknown,
  ): void;
  entries(): IterableIterator<[string, FormDataEntryValue]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<FormDataEntryValue>;
  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>;
}

declare class URLSearchParams {
  constructor(
    init?:
      | Iterable<readonly [string, string]>
      | Record<string, string>
      | string
      | URLSearchParams,
  );

  readonly size: number;
  append(name: string, value: string): void;
  delete(name: string, value?: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string, value?: string): boolean;
  set(name: string, value: string): void;
  sort(): void;
  forEach(
    callbackfn: (value: string, key: string, parent: URLSearchParams) => void,
    thisArg?: unknown,
  ): void;
  entries(): IterableIterator<[string, string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  toString(): string;
  [Symbol.iterator](): IterableIterator<[string, string]>;
}

declare class URL {
  constructor(url: string, base?: string | URL);
  static canParse(url: string, base?: string | URL): boolean;
  static parse(url: string, base?: string | URL): URL | null;
  static createObjectURL(blob: Blob): string;
  static revokeObjectURL(url: string): void;
  hash: string;
  host: string;
  hostname: string;
  href: string;
  readonly origin: string;
  password: string;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  readonly searchParams: URLSearchParams;
  username: string;
  toJSON(): string;
  toString(): string;
}

type BufferSource = ArrayBufferView | ArrayBuffer;

interface WebCryptoAlgorithm {
  name: string;
  [parameter: string]: unknown;
}

type AlgorithmIdentifier = string | WebCryptoAlgorithm;
type KeyFormat = "jwk" | "pkcs8" | "raw" | "spki";
type KeyType = "private" | "public" | "secret";
type KeyUsage =
  | "decrypt"
  | "deriveBits"
  | "deriveKey"
  | "encrypt"
  | "sign"
  | "unwrapKey"
  | "verify"
  | "wrapKey";

interface JsonWebKey {
  alg?: string;
  crv?: string;
  d?: string;
  dp?: string;
  dq?: string;
  e?: string;
  ext?: boolean;
  k?: string;
  key_ops?: string[];
  kty?: string;
  n?: string;
  oth?: Array<{ d?: string; r?: string; t?: string }>;
  p?: string;
  q?: string;
  qi?: string;
  use?: string;
  x?: string;
  y?: string;
}

interface CryptoKey {
  readonly algorithm: WebCryptoAlgorithm;
  readonly extractable: boolean;
  readonly type: KeyType;
  readonly usages: KeyUsage[];
}

declare var CryptoKey: {
  prototype: CryptoKey;
};

interface CryptoKeyPair {
  readonly privateKey: CryptoKey;
  readonly publicKey: CryptoKey;
}

interface SubtleCrypto {
  decrypt(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    data: BufferSource,
  ): Promise<ArrayBuffer>;
  deriveBits(
    algorithm: AlgorithmIdentifier,
    baseKey: CryptoKey,
    length?: number | null,
  ): Promise<ArrayBuffer>;
  deriveKey(
    algorithm: AlgorithmIdentifier,
    baseKey: CryptoKey,
    derivedKeyType: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey>;
  digest(
    algorithm: AlgorithmIdentifier,
    data: BufferSource,
  ): Promise<ArrayBuffer>;
  encrypt(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    data: BufferSource,
  ): Promise<ArrayBuffer>;
  exportKey(format: "jwk", key: CryptoKey): Promise<JsonWebKey>;
  exportKey(
    format: Exclude<KeyFormat, "jwk">,
    key: CryptoKey,
  ): Promise<ArrayBuffer>;
  generateKey(
    algorithm: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey | CryptoKeyPair>;
  importKey(
    format: KeyFormat,
    keyData: BufferSource | JsonWebKey,
    algorithm: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey>;
  sign(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    data: BufferSource,
  ): Promise<ArrayBuffer>;
  supports(
    operation: string,
    algorithm: AlgorithmIdentifier,
    lengthOrHash?: number | AlgorithmIdentifier | null,
  ): boolean;
  unwrapKey(
    format: KeyFormat,
    wrappedKey: BufferSource,
    unwrappingKey: CryptoKey,
    unwrapAlgorithm: AlgorithmIdentifier,
    unwrappedKeyAlgorithm: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey>;
  verify(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    signature: BufferSource,
    data: BufferSource,
  ): Promise<boolean>;
  wrapKey(
    format: KeyFormat,
    key: CryptoKey,
    wrappingKey: CryptoKey,
    wrapAlgorithm: AlgorithmIdentifier,
  ): Promise<ArrayBuffer>;
}

declare var SubtleCrypto: {
  prototype: SubtleCrypto;
};

interface Crypto {
  readonly subtle: SubtleCrypto;
  getRandomValues<T extends ArrayBufferView>(array: T): T;
  randomUUID(): `${string}-${string}-${string}-${string}-${string}`;
}

declare var Crypto: {
  prototype: Crypto;
};

declare var crypto: Crypto;

type BodyInit =
  | BufferSource
  | Blob
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>
  | string;

interface Body {
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  bytes(): Promise<Uint8Array>;
  formData(): Promise<FormData>;
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
}

type HeadersInit =
  | Headers
  | Iterable<readonly [string, string]>
  | Record<string, string>;

declare class Headers {
  constructor(init?: HeadersInit);

  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getSetCookie(): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(
    callbackfn: (value: string, key: string, parent: Headers) => void,
    thisArg?: unknown,
  ): void;
  entries(): IterableIterator<[string, string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  [Symbol.iterator](): IterableIterator<[string, string]>;
}

type RequestInfo = Request | URL | string;
type RequestCache =
  | "default"
  | "force-cache"
  | "no-cache"
  | "no-store"
  | "only-if-cached"
  | "reload";
type RequestCredentials = "include" | "omit" | "same-origin";
type RequestMode = "cors" | "navigate" | "no-cors" | "same-origin";
type RequestRedirect = "follow" | "manual" | "error";
type ReferrerPolicy =
  | ""
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

/**
 * Deno-compatible request options. This runtime has no browser cookie jar or CORS context;
 * browser-oriented fields do not relax Weeble's outbound-network policy.
 */
interface RequestInit {
  body?: BodyInit | null;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  /** Required by the Fetch API when `body` is a `ReadableStream`. */
  duplex?: "half";
  headers?: HeadersInit;
  integrity?: string;
  keepalive?: boolean;
  method?: string;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  signal?: AbortSignal | null;
  window?: null;
}

interface Request extends Body {
  readonly cache: RequestCache;
  readonly credentials: RequestCredentials;
  readonly headers: Headers;
  readonly integrity: string;
  readonly keepalive: boolean;
  readonly method: string;
  readonly mode: RequestMode;
  readonly redirect: RequestRedirect;
  readonly referrer: string;
  readonly referrerPolicy: ReferrerPolicy;
  readonly signal: AbortSignal;
  readonly url: string;
  clone(): Request;
}

declare var Request: {
  prototype: Request;
  new (input: RequestInfo, init?: RequestInit): Request;
};

interface ResponseInit {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
}

interface Response extends Body {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type:
    | "basic"
    | "cors"
    | "default"
    | "error"
    | "opaque"
    | "opaqueredirect";
  readonly url: string;
  clone(): Response;
}

declare var Response: {
  prototype: Response;
  new (body?: BodyInit | null, init?: ResponseInit): Response;
  error(): Response;
  json(data: unknown, init?: ResponseInit): Response;
  redirect(url: string | URL, status?: number): Response;
};

/**
 * Sends an outbound HTTP(S) request. Private, loopback, link-local, and Weeble service
 * addresses are blocked, including after redirects and DNS resolution. Requests time out
 * after 10 seconds by default. Responses are buffered and limited to 10 MiB by default;
 * exceeding the limit rejects with `RangeError`. A caller-provided abort signal is honored.
 */
declare function fetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response>;

type BlobPart = BufferSource | Blob | string;
type EndingType = "transparent" | "native";

interface BlobPropertyBag {
  endings?: EndingType;
  type?: string;
}

interface FilePropertyBag extends BlobPropertyBag {
  lastModified?: number;
}

declare class Blob {
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);

  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  bytes(): Promise<Uint8Array>;
  slice(start?: number, end?: number, contentType?: string): Blob;
  stream(): ReadableStream<Uint8Array>;
  text(): Promise<string>;
}

declare class File extends Blob {
  constructor(
    fileBits: BlobPart[],
    fileName: string,
    options?: FilePropertyBag,
  );
  readonly lastModified: number;
  readonly name: string;
}

declare class DOMException extends Error {
  constructor(message?: string, name?: string);
  readonly code: number;
  readonly message: string;
  readonly name: string;
}

interface TextDecodeOptions {
  stream?: boolean;
}

interface TextDecoderOptions {
  fatal?: boolean;
  ignoreBOM?: boolean;
}

declare class TextDecoder {
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;

  constructor(label?: string, options?: TextDecoderOptions);

  decode(input?: BufferSource, options?: TextDecodeOptions): string;
}

interface TextEncoderEncodeIntoResult {
  read: number;
  written: number;
}

declare class TextEncoder {
  readonly encoding: string;

  constructor();

  encode(input?: string): Uint8Array;
  encodeInto(
    source: string,
    destination: Uint8Array,
  ): TextEncoderEncodeIntoResult;
}

interface QueuingStrategy<T = unknown> {
  highWaterMark?: number;
  size?: (chunk: T) => number;
}

interface QueuingStrategyInit {
  highWaterMark: number;
}

interface StreamPipeOptions {
  preventAbort?: boolean;
  preventCancel?: boolean;
  preventClose?: boolean;
}

interface ReadableStreamReadDoneResult<T> {
  done: true;
  value: T | undefined;
}

interface ReadableStreamReadValueResult<T> {
  done: false;
  value: T;
}

type ReadableStreamReadResult<T> =
  | ReadableStreamReadValueResult<T>
  | ReadableStreamReadDoneResult<T>;

interface ReadableStreamIteratorOptions {
  preventCancel?: boolean;
}

interface ReadableStreamDefaultController<R = unknown> {
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk?: R): void;
  error(error?: unknown): void;
}

declare var ReadableStreamDefaultController: {
  prototype: ReadableStreamDefaultController;
};

interface ReadableStreamBYOBRequest {
  readonly view: ArrayBufferView | null;
  respond(bytesWritten: number): void;
  respondWithNewView(view: ArrayBufferView): void;
}

declare var ReadableStreamBYOBRequest: {
  prototype: ReadableStreamBYOBRequest;
};

interface ReadableByteStreamController {
  readonly byobRequest: ReadableStreamBYOBRequest | null;
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk: ArrayBufferView): void;
  error(error?: unknown): void;
}

declare var ReadableByteStreamController: {
  prototype: ReadableByteStreamController;
};

type ReadableStreamController<R> =
  | ReadableStreamDefaultController<R>
  | ReadableByteStreamController;

interface UnderlyingSource<R = unknown> {
  autoAllocateChunkSize?: number;
  cancel?(reason?: unknown): void | PromiseLike<void>;
  pull?(controller: ReadableStreamController<R>): void | PromiseLike<void>;
  start?(controller: ReadableStreamController<R>): unknown;
  type?: "bytes";
}

interface UnderlyingDefaultSource<R = unknown> {
  cancel?(reason?: unknown): void | PromiseLike<void>;
  pull?(
    controller: ReadableStreamDefaultController<R>,
  ): void | PromiseLike<void>;
  start?(controller: ReadableStreamDefaultController<R>): unknown;
  type?: undefined;
}

interface UnderlyingByteSource {
  autoAllocateChunkSize?: number;
  cancel?(reason?: unknown): void | PromiseLike<void>;
  pull?(controller: ReadableByteStreamController): void | PromiseLike<void>;
  start?(controller: ReadableByteStreamController): unknown;
  type: "bytes";
}

interface ReadableStreamGenericReader {
  readonly closed: Promise<void>;
  cancel(reason?: unknown): Promise<void>;
}

interface ReadableStreamDefaultReader<
  R = unknown,
> extends ReadableStreamGenericReader {
  read(): Promise<ReadableStreamReadResult<R>>;
  releaseLock(): void;
}

declare var ReadableStreamDefaultReader: {
  prototype: ReadableStreamDefaultReader;
  new <R = unknown>(stream: ReadableStream<R>): ReadableStreamDefaultReader<R>;
};

interface ReadableStreamBYOBReader extends ReadableStreamGenericReader {
  read<T extends ArrayBufferView>(
    view: T,
  ): Promise<ReadableStreamReadResult<T>>;
  releaseLock(): void;
}

declare var ReadableStreamBYOBReader: {
  prototype: ReadableStreamBYOBReader;
  new (stream: ReadableStream<Uint8Array>): ReadableStreamBYOBReader;
};

interface ReadableWritablePair<R = unknown, W = unknown> {
  readable: ReadableStream<R>;
  writable: WritableStream<W>;
}

interface ReadableStream<R = unknown> {
  readonly locked: boolean;
  cancel(reason?: unknown): Promise<void>;
  getReader(): ReadableStreamDefaultReader<R>;
  getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
  pipeThrough<T>(
    transform: ReadableWritablePair<T, R>,
    options?: StreamPipeOptions,
  ): ReadableStream<T>;
  pipeTo(
    destination: WritableStream<R>,
    options?: StreamPipeOptions,
  ): Promise<void>;
  tee(): [ReadableStream<R>, ReadableStream<R>];
  values(options?: ReadableStreamIteratorOptions): AsyncIterableIterator<R>;
  [Symbol.asyncIterator](
    options?: ReadableStreamIteratorOptions,
  ): AsyncIterableIterator<R>;
}

declare var ReadableStream: {
  prototype: ReadableStream;
  new (
    underlyingSource: UnderlyingByteSource,
    strategy?: { highWaterMark?: number },
  ): ReadableStream<Uint8Array>;
  new <R = unknown>(
    underlyingSource: UnderlyingDefaultSource<R>,
    strategy?: QueuingStrategy<R>,
  ): ReadableStream<R>;
  new <R = unknown>(
    underlyingSource?: UnderlyingSource<R>,
    strategy?: QueuingStrategy<R>,
  ): ReadableStream<R>;
};

interface WritableStreamDefaultController {
  error(error?: unknown): void;
}

declare var WritableStreamDefaultController: {
  prototype: WritableStreamDefaultController;
};

interface UnderlyingSink<W = unknown> {
  abort?(reason?: unknown): void | PromiseLike<void>;
  close?(): void | PromiseLike<void>;
  start?(controller: WritableStreamDefaultController): unknown;
  type?: undefined;
  write?(
    chunk: W,
    controller: WritableStreamDefaultController,
  ): void | PromiseLike<void>;
}

interface WritableStreamDefaultWriter<W = unknown> {
  readonly closed: Promise<void>;
  readonly desiredSize: number | null;
  readonly ready: Promise<void>;
  abort(reason?: unknown): Promise<void>;
  close(): Promise<void>;
  releaseLock(): void;
  write(chunk?: W): Promise<void>;
}

declare var WritableStreamDefaultWriter: {
  prototype: WritableStreamDefaultWriter;
  new <W = unknown>(stream: WritableStream<W>): WritableStreamDefaultWriter<W>;
};

interface WritableStream<W = unknown> {
  readonly locked: boolean;
  abort(reason?: unknown): Promise<void>;
  close(): Promise<void>;
  getWriter(): WritableStreamDefaultWriter<W>;
}

declare var WritableStream: {
  prototype: WritableStream;
  new <W = unknown>(
    underlyingSink?: UnderlyingSink<W>,
    strategy?: QueuingStrategy<W>,
  ): WritableStream<W>;
};

interface Transformer<I = unknown, O = unknown> {
  flush?(
    controller: TransformStreamDefaultController<O>,
  ): void | PromiseLike<void>;
  readableType?: undefined;
  start?(controller: TransformStreamDefaultController<O>): unknown;
  transform?(
    chunk: I,
    controller: TransformStreamDefaultController<O>,
  ): void | PromiseLike<void>;
  writableType?: undefined;
}

interface TransformStreamDefaultController<O = unknown> {
  readonly desiredSize: number | null;
  enqueue(chunk?: O): void;
  error(reason?: unknown): void;
  terminate(): void;
}

declare var TransformStreamDefaultController: {
  prototype: TransformStreamDefaultController;
};

interface TransformStream<I = unknown, O = unknown> {
  readonly readable: ReadableStream<O>;
  readonly writable: WritableStream<I>;
}

declare var TransformStream: {
  prototype: TransformStream;
  new <I = unknown, O = unknown>(
    transformer?: Transformer<I, O>,
    writableStrategy?: QueuingStrategy<I>,
    readableStrategy?: QueuingStrategy<O>,
  ): TransformStream<I, O>;
};

interface ByteLengthQueuingStrategy extends QueuingStrategy<ArrayBufferView> {
  readonly highWaterMark: number;
  readonly size: (chunk: ArrayBufferView) => number;
}

declare var ByteLengthQueuingStrategy: {
  prototype: ByteLengthQueuingStrategy;
  new (init: QueuingStrategyInit): ByteLengthQueuingStrategy;
};

interface CountQueuingStrategy extends QueuingStrategy {
  readonly highWaterMark: number;
  readonly size: (chunk: unknown) => number;
}

declare var CountQueuingStrategy: {
  prototype: CountQueuingStrategy;
  new (init: QueuingStrategyInit): CountQueuingStrategy;
};

/**
 * Weeble runtime APIs for scheduled tasks, metered compute, and persistent KV storage.
 *
 * Module state may be reused across events handled by the same warm runtime, but it is not
 * durable and must never be the only copy of data. An execution is one event or task dispatch.
 */
declare namespace weeble {
  type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
  interface JsonObject {
    [key: string]: JsonValue | undefined;
  }
  interface JsonArray extends Array<JsonValue> {}

  interface ScheduledTaskEvent {
    /** Task name registered in code. */
    name: string;
    /** Instance ID supplied to `weeble.tasks.runAt(...)`, or `null` for recurring tasks. */
    instanceId: string | null;
    /** Payload supplied to `runAt`, or an empty object for recurring tasks. */
    payload: JsonObject;
    /** Unique run ID for this attempt. */
    runId: string;
    /** UTC time this run was scheduled for, as an ISO string. */
    scheduledAt: string;
    /** UTC time this run started, as an ISO string. */
    startedAt: string;
    /** Number of intervening recurring occurrences that were skipped, not separately delivered. */
    missedRuns: number;
  }

  /** A returned promise is awaited; rejecting it marks the run as failed. */
  type ScheduledTaskHandler = (event: ScheduledTaskEvent) => unknown;

  namespace cron {
    /**
     * Registers a recurring task during publish. Intervals are one positive integer followed by
     * `s`, `m`, `h`, or `d` (for example `30s` or `2h`); compound forms are not accepted.
     */
    function every(
      name: string,
      interval: string,
      handler: ScheduledTaskHandler,
    ): void;

    /**
     * Runs a task from a five-field cron expression in UTC.
     *
     * Fields are minute, hour, day of month, month, and day of week. Use `*`,
     * comma-separated values, ranges, and `/` steps. Sunday is `0` or `7`.
     * When both day fields are restricted, either may match. Named values, macros,
     * and extensions such as `L`, `#`, and `?` are not accepted.
     *
     * Example: `weeble.cron.schedule('daily-report', '0 9 * * *', handler)` runs
     * every day at 09:00 UTC.
     */
    function schedule(
      name: string,
      expression: string,
      handler: ScheduledTaskHandler,
    ): void;
  }

  interface OneShotTaskResult {
    /** Stable task ID generated from the deployment, task name, and instance ID. */
    id: string;
    /** Normalized task name. */
    name: string;
    /** Caller-supplied ID used to replace or reschedule the same logical task. */
    instanceId: string;
    /** Scheduled time as an ISO 8601 string. */
    runAt: string;
    /** The same scheduled time as a Unix timestamp in milliseconds. */
    nextRunAt: number;
  }

  /**
   * One-shot schedules are durable but cannot be listed or canceled from script code.
   * Use a stable `instanceId` so a later call can reschedule the same logical task.
   */
  namespace tasks {
    /** Defines a named handler for one-shot schedules. Recurring registrations define theirs inline. */
    function define(name: string, handler: ScheduledTaskHandler): void;
    /**
     * Schedules one future run of a named task handler.
     *
     * The handler must be declared at top level with `weeble.tasks.define(name, handler)`.
     * Scheduling the same `name` and `instanceId` again replaces its time and payload.
     * Failed runs are attempted up to 5 times with exponential backoff.
     * Delivery can repeat after infrastructure failures, so handlers must be idempotent.
     * Runs for one schedule do not overlap; the next run is selected after completion.
     */
    function runAt(
      name: string,
      instanceId: string,
      runAt: Date | string | number,
      payload?: JsonObject,
    ): Promise<OneShotTaskResult>;
  }

  interface ComputeOptions {
    /** CPU time budget for this job. Defaults to 1000ms; valid values are 1–10000ms. */
    cpuMs?: number;
    /** Wall-clock timeout for async work inside the job. Defaults to `cpuMs`; the execution deadline still applies. */
    timeoutMs?: number;
  }

  interface ComputeResult<T> {
    result: T;
    /** CPU milliseconds charged to this job, rounded up to the next millisecond. */
    usedCpuMs: number;
    /** Wall-clock milliseconds spent waiting for the callback to settle. */
    usedWallMs: number;
    /** Total CPU milliseconds available to compute jobs in this execution (10000ms). */
    bucketMaximumMs: number;
    /** Remaining CPU milliseconds available to compute jobs in this execution. */
    bucketRemainingMs: number;
  }

  class ComputeQuotaError extends Error {
    /** Raised before a job starts when its request exceeds the execution's quota or job count. */
    readonly name: "ComputeQuotaError";
  }

  class ComputeTimeoutError extends Error {
    /** Raised when the callback does not settle within `timeoutMs`; prior side effects remain. */
    readonly name: "ComputeTimeoutError";
  }

  namespace compute {
    /**
     * Runs CPU-heavy work against a separate 10000ms budget. Normal handlers have a 500ms CPU
     * budget and a 10-second wall deadline by default. One execution can start at most 8 jobs.
     * `name` labels the job in runtime accounting; it is not an idempotency key.
     */
    function run<T>(
      name: string,
      callback: () => T | Promise<T>,
      options?: ComputeOptions,
    ): Promise<ComputeResult<T>>;

  }

  interface KVPutOptions {
    /** Duration in milliseconds until the key expires. Omitting it removes an existing TTL. */
    ttl?: number;
    /** Only put if the key does not already exist; `put` returns whether it was written. */
    ifNotExists?: boolean;
  }

  interface KVDeleteOptions {
    /**
     * If provided, only delete if the serialized JSON matches; object key order is significant.
     * `delete` returns whether the value matched and was removed.
     */
    prevValue?: JsonValue;
  }

  interface KVListOptions {
    /** Return only keys that start with this prefix. */
    prefix?: string;
    /** Maximum number of keys to return. Defaults to 100. */
    limit?: number;
  }

  interface KVPageOptions extends KVListOptions {
    /** Continue after the cursor returned by a previous page. */
    cursor?: string;
  }

  interface KVPage<T> {
    items: T[];
    /** Present when another page is available. */
    cursor?: string;
  }

  interface KVIncrementOptions {
    /** Duration in milliseconds until the counter expires. When supplied, each increment resets it. */
    ttl?: number;
  }

  type KVBatchOperation =
    | { type: "put"; key: string; value: JsonValue; ttl?: number }
    | { type: "delete"; key: string };

  interface KVCompareAndSetOptions {
    /** Duration in milliseconds until the updated key expires. */
    ttl?: number;
  }

  interface KVItem {
    key: string;
    value: JsonValue;
  }

  /**
   * A namespaced key-value store.
   *
   * KV data is scoped to the current deployment and namespace. It persists across
   * publishes and rollbacks until it is explicitly deleted, cleared, expires by
   * TTL, or the deployment is deleted. Completed writes are immediately visible to
   * later reads, including from another runtime instance.
   *
   * ```ts
   * const storage = new weeble.KVNamespace('my-data');
   * await storage.put('counter', 42);
   * const count = await storage.get<number>('counter');
   * ```
   */
  class KVNamespace {
    readonly namespace: string;
    constructor(namespace: string);
    /** Writes a value and returns `false` only when `ifNotExists` prevents the write. */
    put(key: string, value: JsonValue, options?: KVPutOptions): Promise<boolean>;
    get<T extends JsonValue>(key: string): Promise<T | undefined>;
    /** Reads up to 100 keys in one storage operation. Results match the input order. */
    getMany<T extends JsonValue>(
      keys: readonly string[],
    ): Promise<Array<T | undefined>>;
    /** Deletes a value and reports whether it existed and, when supplied, matched `prevValue`. */
    delete(key: string, options?: KVDeleteOptions): Promise<boolean>;
    /** Atomically adds `amount` (default `1`) to a number. Missing keys start at zero; negatives subtract. */
    increment(
      key: string,
      amount?: number,
      options?: KVIncrementOptions,
    ): Promise<number>;
    /** Applies up to 100 puts and deletes atomically within this namespace. */
    batch(operations: readonly KVBatchOperation[]): Promise<void>;
    /** Returns one lexicographically ordered page of keys (100 by default). */
    list(options?: KVListOptions): Promise<string[]>;
    /** Returns one lexicographically ordered page of entries (100 by default). */
    items(options?: KVListOptions): Promise<KVItem[]>;
    /** Returns lexicographically ordered keys and an opaque cursor for the next page. */
    listPage(options?: KVPageOptions): Promise<KVPage<string>>;
    /** Returns lexicographically ordered entries and an opaque cursor for the next page. */
    itemsPage(options?: KVPageOptions): Promise<KVPage<KVItem>>;
    /** Returns the exact number of keys in this namespace. */
    count(): Promise<number>;
    /** Permanently deletes every key in this namespace and returns the number removed. */
    clear(): Promise<number>;
    /**
     * Replaces a value only when its serialized JSON equals `compare`.
     * Object key order is significant.
     */
    compareAndSet(
      key: string,
      compare: JsonValue,
      set: JsonValue,
      options?: KVCompareAndSetOptions,
    ): Promise<boolean>;
    /**
     * Atomically updates a key, retrying when another execution changes it.
     * Return `undefined` from the callback to delete the key.
     * The callback may run up to eight times and must not perform side effects.
     */
    transact<T extends JsonValue>(
      key: string,
      transaction: (prev: T | undefined) => T | undefined,
    ): Promise<T | undefined>;
  }
}
