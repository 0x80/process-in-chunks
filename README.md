# Process in Chunks

Efficiently process large collections of data in manageable chunks with built-in
error handling, throttling, and TypeScript support.

## Features

- 🚀 **High Performance**: Process items in parallel chunks for optimal
  throughput
- 🛡️ **Robust Error Handling**: Choose between fail-fast or graceful error
  collection
- ⏱️ **Built-in Throttling**: Control processing rate to avoid overwhelming
  systems
- 📦 **Flexible Processing**: Handle items individually or process entire chunks
- 🔒 **Type Safe**: Full TypeScript support with discriminated unions
- 🎯 **Zero Dependencies**: Lightweight and focused

## Installation

```bash
pnpm add process-in-chunks
```

## Quick Start

```ts
import { processInChunks } from "process-in-chunks";

// Process items in parallel chunks
const results = await processInChunks(
  [1, 2, 3, 4, 5],
  async (item) => item * 2
);
console.log(results); // [2, 4, 6, 8, 10]
```

## Usage

### Process with a single item handler

Process items individually with parallel execution within each chunk. This is
the most common use case.

```ts
import { processInChunks } from "process-in-chunks";

const results = await processInChunks(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  async (item, index) => {
    console.log(`Processing item ${index}, value ${item}`);
    return item * 10;
  }
);

console.log(results); // [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
```

### Process with a chunk-sized handler

Process entire chunks at once, useful for batch operations like database inserts
or API calls that accept multiple items.

```ts
import { processInChunksByChunk } from "process-in-chunks";

const results = await processInChunksByChunk(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  async (chunk) => {
    // Process entire chunk at once
    return chunk.reduce((sum, item) => sum + item, 0);
  },
  { chunkSize: 3, throttleSeconds: 1 }
);

console.log(results); // [6, 15, 24, 10] (after ~4 seconds)
```

## Error Handling

### Default Behavior (Fail-Fast)

By default, functions throw errors immediately when they encounter a failure,
providing fail-fast behavior.

```ts
import { processInChunksByChunk } from "process-in-chunks";

try {
  const results = await processInChunks([1, 2, 3, 4, 5], async (item) => {
    if (item % 2 === 0) {
      throw new Error(`Failed to process even number: ${item}`);
    }
    return `Processed: ${item}`;
  });

  console.log("All items processed:", results);
} catch (error) {
  console.error("Processing failed:", error.message);
  // Stops on first error (item 2)
}
```

### Enhanced Error Handling with `noThrow`

Enable graceful error handling to collect partial results and error information.

```ts
import { processInChunks } from "process-in-chunks";

const result = await processInChunks(
  [1, 2, 3, 4, 5],
  async (item) => {
    if (item % 2 === 0) {
      throw new Error(`Failed to process even number: ${item}`);
    }
    return `Processed: ${item}`;
  },
  { noThrow: true }
);

if (result.hasErrors) {
  console.log("Some items failed:", result.errorMessages);
  console.log("Partial results:", result.results); // Contains undefined for failed items

  // Filter out failed items
  const successfulResults = result.results.filter((r) => r !== undefined);
  console.log("Successful results:", successfulResults);
} else {
  console.log("All items processed:", result.results);
}
```

## Options

Both functions accept an optional configuration object with the following
options:

### `chunkSize`

- **Type**: `number`
- **Default**: `500`
- **Description**: Number of items to process in parallel within each chunk

```ts
await processInChunks(items, handler, { chunkSize: 100 });
```

### `throttleSeconds`

- **Type**: `number`
- **Default**: `0`
- **Description**: Delay in seconds between processing chunks. Useful for rate
  limiting.

```ts
await processInChunks(items, handler, { throttleSeconds: 2 });
```

### `noThrow`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable enhanced error handling. When `true`, returns a
  discriminated union with error information instead of throwing.

```ts
await processInChunks(items, handler, { noThrow: true });
```

## Function Reference

### `processInChunks<T, R>(items, handler, options?)`

Process items individually with parallel execution within chunks.

**Parameters:**

- `items: T[]` - Array of items to process
- `handler: (item: T, index: number) => R | Promise<R>` - Function to process
  each item
- `options?: ChunkingOptions` - Optional configuration

**Returns:**

- `Promise<R[]>` - Array of results (default behavior)
- `Promise<ProcessResult<R>>` - Discriminated union when `noThrow: true`

### `processInChunksByChunk<T, R>(items, handler, options?)`

Process entire chunks at once.

**Parameters:**

- `items: T[]` - Array of items to process
- `handler: (chunk: T[], index: number) => R | Promise<R>` - Function to
  process each chunk (where `index` is the zero-based chunk index)
- `options?: ChunkingOptions` - Optional configuration

**Returns:**

- `Promise<R[]>` - Array of results (default behavior)
- `Promise<ProcessResult<R>>` - Discriminated union when `noThrow: true`

### `ProcessResult<R>` (Discriminated Union)

When using `noThrow: true`, functions return a discriminated union:

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

## Real-World Examples

### Processing Files

```ts
import { processInChunks } from "process-in-chunks";
import { readFile } from "fs/promises";

const filePaths = ["file1.txt", "file2.txt", "file3.txt"];

const fileContents = await processInChunks(
  filePaths,
  async (filePath) => {
    const content = await readFile(filePath, "utf-8");
    return { path: filePath, content, size: content.length };
  },
  { chunkSize: 10 } // Process 10 files at a time
);
```

### API Calls with Rate Limiting

```ts
import { processInChunksByChunk } from "process-in-chunks";

const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const users = await processInChunksByChunk(
  userIds,
  async (chunk) => {
    // Batch API call
    const response = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ ids: chunk }),
    });
    return response.json();
  },
  {
    chunkSize: 5, // 5 users per batch
    throttleSeconds: 1, // 1 second between batches
  }
);
```

### Data Transformation with Error Handling

```ts
import { processInChunks } from "process-in-chunks";

const result = await processInChunks(
  ["1", "2", "invalid", "4", "5"],
  async (str) => {
    const num = parseInt(str);
    if (isNaN(num)) {
      throw new Error(`Invalid number: ${str}`);
    }
    return num * 2;
  },
  { noThrow: true }
);

if (result.hasErrors) {
  console.log("Errors:", result.errorMessages);
  console.log(
    "Valid results:",
    result.results.filter((r) => r !== undefined)
  );
}
```

### Publishing Messages (Fire-and-Forget)

```ts
import { processInChunks } from "process-in-chunks";

const events = [
  { type: "user_signup", userId: 1 },
  { type: "purchase", userId: 2, amount: 99.99 },
  { type: "logout", userId: 3 },
];

// Process events without needing return values
await processInChunks(
  events,
  async (event) => {
    // Publish to message queue/pub-sub system
    await publishEvent(event);

    // Log the action
    console.log(`Published event: ${event.type}`);

    // No return value needed for fire-and-forget operations
  },
  {
    chunkSize: 50, // Process 50 events at a time
    throttleSeconds: 0.5, // Small delay to avoid overwhelming the message system
  }
);

console.log("All events published successfully!");
```

## Best Practices

### Choosing Chunk Size

- **Small chunks (10-100)**: For I/O heavy operations or when memory is limited
- **Medium chunks (100-500)**: General purpose, good balance of performance and
  memory
- **Large chunks (500+)**: For CPU-intensive operations with minimal I/O

### When to Use Throttling

- API rate limiting compliance
- Avoiding overwhelming external services
- Managing system resource usage
- Preventing database connection exhaustion

### Error Handling Strategy

- **Use default (throwing)**: When any failure should stop the entire process
- **Use `noThrow: true`**: When partial results are valuable and you want to
  handle errors gracefully

### Performance Considerations

- Monitor memory usage with large datasets
- Adjust chunk size based on your specific use case
- Use throttling to respect external service limits
- Consider using `processInChunksByChunk` for batch operations

## TypeScript Support

This library is written in TypeScript and provides full type safety:

```ts
// Type inference works automatically
const numbers = await processInChunks([1, 2, 3], async (n) => n.toString());
// numbers: string[]

// Discriminated union provides type safety
const result = await processInChunks(items, handler, { noThrow: true });
if (result.hasErrors) {
  // TypeScript knows result.errorMessages is string[]
  // and result.results is (R | undefined)[]
} else {
  // TypeScript knows result.results is R[]
  // and result.errorMessages is undefined
}
```

## License

MIT
