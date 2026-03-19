---
layout: home

hero:
  name: Process in Chunks
  tagline: Efficiently process large collections in manageable chunks with error handling, throttling, and TypeScript support
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api

features:
  - title: Chunked Processing
    details: Process items in parallel chunks for optimal throughput. Control chunk size to balance performance and resource usage.
  - title: Error Handling
    details: Choose between fail-fast or graceful error collection with discriminated unions for type-safe partial results.
  - title: Built-in Throttling
    details: Control processing rate to avoid overwhelming external services. The throttle runs in parallel, only adding delay when needed.
  - title: Type Safe
    details: Full TypeScript support with discriminated unions for error handling and type inference for results.
---

## What is Process in Chunks?

Process in Chunks provides a convenient way to process large collections of data
in manageable chunks with built-in error handling, throttling, and TypeScript
support.

It offers two main functions: `processInChunks` for processing items
individually with parallel execution within each chunk, and
`processInChunksByChunk` for processing entire chunks at once — useful for batch
operations like database inserts or API calls that accept multiple items.

```ts
import { processInChunks } from "process-in-chunks";

const results = await processInChunks(
  [1, 2, 3, 4, 5],
  async (item) => item * 2,
);
console.log(results); // [2, 4, 6, 8, 10]
```
