# Getting Started

## Installation

```bash
pnpm add process-in-chunks
```

## Basic Example

Process items individually with parallel execution within each chunk:

```ts
import { processInChunks } from "process-in-chunks";

const results = await processInChunks(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  async (item, index) => {
    console.log(`Processing item ${index}, value ${item}`);
    return item * 10;
  },
);

console.log(results); // [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
```

## Batch Processing

Process entire chunks at once, useful for batch operations like database inserts
or API calls that accept multiple items:

```ts
import { processInChunksByChunk } from "process-in-chunks";

const results = await processInChunksByChunk(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  async (chunk) => {
    return chunk.reduce((sum, item) => sum + item, 0);
  },
  { chunkSize: 3, throttleSeconds: 1 },
);

console.log(results); // [6, 15, 24, 10] (after ~4 seconds)
```
