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

const results = await processInChunks(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  async (item, index) => {
    console.log(`Processing item ${index}, value ${item}`);

    return value * 10;
  }
);

/** This will log [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] */
console.log(results);
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
console.log(result);
```

## API

@TODO some more docs. In the meantime, please just have a look at the function
signatures. I think they are pretty self-explanatory.
