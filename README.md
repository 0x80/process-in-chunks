# Process in Chunks

Efficiently process large collections of data in manageable chunks with built-in
error handling, throttling, and TypeScript support.

## Features

- Chunked parallel processing for optimal throughput
- Fail-fast or graceful error collection with discriminated unions
- Built-in throttling to control processing rate
- Full TypeScript support with type inference
- Zero dependencies

## Quick Start

```bash
pnpm add process-in-chunks
```

```ts
import { processInChunks } from "process-in-chunks";

const results = await processInChunks(
  [1, 2, 3, 4, 5],
  async (item) => item * 2,
);
console.log(results); // [2, 4, 6, 8, 10]
```

## Documentation

For full documentation visit
[process-in-chunks.codecompose.dev](https://process-in-chunks.codecompose.dev/).

## License

MIT
