# Process in Chunks

Conveniently process data in chunks with optional throttling.

## Installation

```bash
pnpm add process-in-chunks
```

## Usage

### Process with a single item handler

In most situations it will be practical to declare a handler for a single item.
These handlers will be executing in parallel, according to the chunk size, which
defaults to 500.

```ts
import { processInChunks } from "process-in-chunks";

const result = await processInChunks(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  async (item, index) => {
    console.log(`Processing item ${index}, value ${item}`);

    return item * 10;
  }
);

/** This will log [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] */
console.log(result.results);
```

### Process with a chunk-sized handler

In some cases you might want to handle each chunk together, for example if you
are injecting the items via an API endpoint into some database or external
system that accepts multiple items for each call.

```ts
import { processInChunks } from "process-in-chunks";

const result = await processInChunksByChunk(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  async (chunk) => {
    /** Return the sum of each chunk */
    return chunk.reduce((acc, curr) => acc + curr, 0);
  },
  /**
   * Throttle and chunkSize are optional. Here, we process 3 items at a time,
   * one chunk per second.
   */
  { chunkSize: 3, throttleSeconds: 1 }
);

/** This will log [6, 15, 24, 10], after roughly 4 seconds have passed */
console.log(result.results);
```

### Error Handling

Both functions handle errors gracefully by collecting error messages and
returning a discriminated union that allows the calling context to decide how to
handle errors. The functions themselves never throw - they return either
successful results or results with error information.

```ts
import { processInChunks } from "process-in-chunks";

const result = await processInChunks([1, 2, 3, 4, 5], async (item) => {
  if (item % 2 === 0) {
    throw new Error(`Failed to process even number: ${item}`);
  }
  return `Processed: ${item}`;
});

if (result.hasErrors) {
  // Choose to throw an error with concatenated messages
  throw new Error(result.errorMessages.join("; "));
}

// TypeScript here knows results is string[] without undefined values
console.log("All items processed successfully:", result.results);
```

The discriminated union provides type safety:

- When `hasErrors` is `false`: `results` is guaranteed to be `R[]` (no
  undefined) and `errorMessages` is undefined
- When `hasErrors` is `true`: `results` will contain undefined values and
  `errorMessages` is available

### Fail-Fast Mode

You can enable fail-fast behavior by setting `shouldThrow: true`. In this mode,
the functions will throw the original error immediately when the first error
occurs, stopping all further processing.

```ts
import { processInChunks } from "process-in-chunks";

// This will throw immediately on the first error
const results = await processInChunks(
  [1, 2, 3, 4, 5],
  async (item) => {
    if (item % 2 === 0) {
      throw new Error(`Failed to process even number: ${item}`);
    }
    return `Processed: ${item}`;
  },
  { shouldThrow: true }
);

// TypeScript knows results is string[] (no undefined values possible)
// If we reach this point, all items were processed successfully
console.log("All items processed:", results);
```

When `shouldThrow: true`:

- The function returns `R[]` directly (no discriminated union)
- No undefined values in results (guaranteed by TypeScript)
- Processing stops immediately on first error
- Original error is rethrown (not wrapped or modified)

## API

@TODO some more docs. In the meantime, please just have a look at the function
signatures. I think they are pretty self-explanatory.
