# API Reference

## `processInChunks`

Process items individually with parallel execution within chunks.

```ts
function processInChunks<T, R>(
  items: T[],
  handler: (item: T, index: number) => R | Promise<R>,
  options?: ChunkingOptions,
): Promise<R[]>;

// With noThrow: true
function processInChunks<T, R>(
  items: T[],
  handler: (item: T, index: number) => R | Promise<R>,
  options: ChunkingOptions & { noThrow: true },
): Promise<ProcessResult<R>>;
```

### Parameters

- **`items`** `T[]` — Array of items to process
- **`handler`** `(item: T, index: number) => R | Promise<R>` — Function to
  process each item. Receives the item and its index in the original array.
- **`options`** `ChunkingOptions` — Optional configuration

### Returns

- `Promise<R[]>` — Array of results (default behavior)
- `Promise<ProcessResult<R>>` — Discriminated union when `noThrow: true`

## `processInChunksByChunk`

Process entire chunks at once. Useful for batch operations like database inserts
or API calls that accept multiple items.

```ts
function processInChunksByChunk<T, R>(
  items: T[],
  handler: (chunk: T[], index: number) => R | Promise<R>,
  options?: ChunkingOptions,
): Promise<R[]>;

// With noThrow: true
function processInChunksByChunk<T, R>(
  items: T[],
  handler: (chunk: T[], index: number) => R | Promise<R>,
  options: ChunkingOptions & { noThrow: true },
): Promise<ProcessResult<R>>;
```

### Parameters

- **`items`** `T[]` — Array of items to process
- **`handler`** `(chunk: T[], index: number) => R | Promise<R>` — Function to
  process each chunk. Receives the chunk array and the zero-based chunk index.
- **`options`** `ChunkingOptions` — Optional configuration

### Returns

- `Promise<R[]>` — Array of results (default behavior)
- `Promise<ProcessResult<R>>` — Discriminated union when `noThrow: true`

## `ChunkingOptions`

Configuration options for both processing functions.

```ts
interface ChunkingOptions {
  chunkSize?: number;
  throttleSeconds?: number;
  noThrow?: boolean;
}
```

### Properties

| Property          | Type      | Default | Description                                                                                                                                           |
| ----------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chunkSize`       | `number`  | `500`   | Number of items to process in parallel within each chunk                                                                                              |
| `throttleSeconds` | `number`  | `0`     | Minimum time in seconds for processing each chunk. The throttle runs in parallel with processing, so it only adds delay if the chunk finishes faster. |
| `noThrow`         | `boolean` | `false` | Enable enhanced error handling. When `true`, returns a discriminated union with error information instead of throwing.                                |

## `ProcessResult<R>`

Discriminated union returned when using `noThrow: true`.

```ts
type ProcessResult<R> =
  | {
      hasErrors: false;
      results: R[];
      errorMessages?: undefined;
    }
  | {
      hasErrors: true;
      results: (R | undefined)[];
      errorMessages: string[];
    };
```

### Success Case (`hasErrors: false`)

- **`results`** `R[]` — All results, fully typed
- **`errorMessages`** `undefined`

### Error Case (`hasErrors: true`)

- **`results`** `(R | undefined)[]` — Partial results with `undefined` for
  failed items
- **`errorMessages`** `string[]` — Error messages from failed items
