# Usage

## Error Handling

### Default Behavior (Fail-Fast)

By default, functions throw errors immediately when they encounter a failure:

```ts
import { processInChunks } from "process-in-chunks";

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

### Graceful Error Handling with `noThrow`

Enable graceful error handling to collect partial results and error information:

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
  { noThrow: true },
);

if (result.hasErrors) {
  console.log("Some items failed:", result.errorMessages);
  console.log("Partial results:", result.results);

  const successfulResults = result.results.filter((r) => r !== undefined);
  console.log("Successful results:", successfulResults);
} else {
  console.log("All items processed:", result.results);
}
```

## Throttling

Use `throttleSeconds` to control the rate of processing. The throttle runs in
parallel with processing, so it only adds delay if the chunk finishes faster
than the specified time:

```ts
import { processInChunks } from "process-in-chunks";

await processInChunks(items, handler, {
  chunkSize: 50,
  throttleSeconds: 1, // At least 1 second per chunk
});
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
  { chunkSize: 10 },
);
```

### API Calls with Rate Limiting

```ts
import { processInChunksByChunk } from "process-in-chunks";

const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const users = await processInChunksByChunk(
  userIds,
  async (chunk) => {
    const response = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ ids: chunk }),
    });
    return response.json();
  },
  {
    chunkSize: 5,
    throttleSeconds: 1,
  },
);
```

### Data Transformation with Error Handling

```ts
import { processInChunks } from "process-in-chunks";

const result = await processInChunks(
  ["1", "2", "invalid", "4", "5"],
  async (str) => {
    const num = parseInt(str, 10);
    if (isNaN(num)) {
      throw new Error(`Invalid number: ${str}`);
    }
    return num * 2;
  },
  { noThrow: true },
);

if (result.hasErrors) {
  console.log("Errors:", result.errorMessages);
  console.log(
    "Valid results:",
    result.results.filter((r) => r !== undefined),
  );
}
```

### Publishing Messages

```ts
import { processInChunks } from "process-in-chunks";

const events = [
  { type: "user_signup", userId: 1 },
  { type: "purchase", userId: 2, amount: 99.99 },
  { type: "logout", userId: 3 },
];

await processInChunks(
  events,
  async (event) => {
    await publishEvent(event);
    console.log(`Published event: ${event.type}`);
  },
  {
    chunkSize: 50,
    throttleSeconds: 0.5,
  },
);
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
