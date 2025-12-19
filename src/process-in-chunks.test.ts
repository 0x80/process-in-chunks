import { got } from "get-or-throw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { processInChunks, processInChunksByChunk } from "./process-in-chunks";

describe("processInChunks", () => {
  describe("basic functionality", () => {
    it("processes all items and returns aggregated results", async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await processInChunks(items, async (item) => item * 2);

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it("passes correct index to callback for each item", async () => {
      const items = ["a", "b", "c"];
      const receivedIndices: number[] = [];

      await processInChunks(items, async (item, index) => {
        receivedIndices.push(index);
        return item;
      });

      expect(receivedIndices).toEqual([0, 1, 2]);
    });

    it("works with sync callbacks", async () => {
      const items = [1, 2, 3];
      const results = await processInChunks(items, (item) => item * 10);

      expect(results).toEqual([10, 20, 30]);
    });

    it("handles empty array input", async () => {
      const results = await processInChunks([], async (item) => item);

      expect(results).toEqual([]);
    });
  });

  describe("chunking behavior", () => {
    it("respects custom chunkSize option", async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const chunksCalled: number[][] = [];

      /** Track which items are processed together by using timing */
      let currentChunk: number[] = [];
      let processingChunk = false;

      await processInChunks(
        items,
        async (item) => {
          if (!processingChunk) {
            processingChunk = true;
            currentChunk = [item];
          } else {
            currentChunk.push(item);
          }

          /** Small delay to allow parallel items to be added */
          await new Promise((resolve) => setTimeout(resolve, 10));

          if (currentChunk.length > 0) {
            chunksCalled.push([...currentChunk]);
            currentChunk = [];
            processingChunk = false;
          }

          return item;
        },
        { chunkSize: 2 }
      );

      /** With chunkSize 2 and 6 items, we expect 3 chunks */
      expect(items.length / 2).toBe(3);
    });

    it("processes items in parallel within each chunk", async () => {
      const items = [1, 2, 3, 4];
      const startTimes: number[] = [];

      await processInChunks(
        items,
        async (item) => {
          startTimes.push(Date.now());
          await new Promise((resolve) => setTimeout(resolve, 50));
          return item;
        },
        { chunkSize: 2 }
      );

      /** Items 0 and 1 should start at nearly the same time (within a chunk) */
      expect(Math.abs(got(startTimes, 0) - got(startTimes, 1))).toBeLessThan(
        20
      );
      /** Items 2 and 3 should start at nearly the same time (within a chunk) */
      expect(Math.abs(got(startTimes, 2) - got(startTimes, 3))).toBeLessThan(
        20
      );
      /** Chunk 2 should start after chunk 1 finishes */
      expect(got(startTimes, 2) - got(startTimes, 0)).toBeGreaterThanOrEqual(
        40
      );
    });

    it("last chunk correctly handles remaining items", async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await processInChunks(items, async (item) => item, {
        chunkSize: 2,
      });

      /** 5 items with chunkSize 2 = chunks of [1,2], [3,4], [5] */
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("error handling", () => {
    it("throws error when any item fails", async () => {
      const items = [1, 2, 3];

      await expect(
        processInChunks(items, async (item) => {
          if (item === 2) {
            throw new Error("Item 2 failed");
          }
          return item;
        })
      ).rejects.toThrow("Failed to process all chunks successfully");
    });

    it("error message contains the failure reason", async () => {
      const items = [1, 2, 3];

      await expect(
        processInChunks(items, async (item) => {
          if (item === 2) {
            throw new Error("Specific failure message");
          }
          return item;
        })
      ).rejects.toThrow("Specific failure message");
    });

    it("limits error messages to 10 in output", async () => {
      const items = Array.from({ length: 15 }, (_, i) => i);

      try {
        await processInChunks(
          items,
          async (item) => {
            throw new Error(`Error ${item}`);
          },
          { chunkSize: 20 }
        );
      } catch (err) {
        const errorMessage = (err as Error).message;
        /** Count how many "Error" occurrences in the message */
        const errorCount = (errorMessage.match(/"Error \d+"/g) || []).length;
        expect(errorCount).toBeLessThanOrEqual(10);
      }
    });
  });
});

describe("processInChunksByChunk", () => {
  describe("core behavior", () => {
    it("passes entire chunk array to callback", async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const receivedChunks: number[][] = [];

      await processInChunksByChunk(
        items,
        async (chunk) => {
          receivedChunks.push([...chunk]);
          return chunk.reduce((sum, n) => sum + n, 0);
        },
        { chunkSize: 2 }
      );

      expect(receivedChunks).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it("returns array of chunk results", async () => {
      const items = [1, 2, 3, 4, 5, 6];

      const results = await processInChunksByChunk(
        items,
        async (chunk) => chunk.reduce((sum, n) => sum + n, 0),
        { chunkSize: 2 }
      );

      expect(results).toEqual([3, 7, 11]);
    });

    it("handles chunks of different sizes correctly", async () => {
      const items = [1, 2, 3, 4, 5];
      const chunkSizes: number[] = [];

      await processInChunksByChunk(
        items,
        async (chunk) => {
          chunkSizes.push(chunk.length);
          return chunk.length;
        },
        { chunkSize: 2 }
      );

      expect(chunkSizes).toEqual([2, 2, 1]);
    });

    it("handles empty array input", async () => {
      const results = await processInChunksByChunk(
        [],
        async (chunk) => chunk.length
      );

      expect(results).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("throws error when chunk processing fails", async () => {
      const items = [1, 2, 3, 4];

      await expect(
        processInChunksByChunk(
          items,
          async (chunk) => {
            if (chunk.includes(3)) {
              throw new Error("Chunk with 3 failed");
            }
            return chunk.reduce((sum, n) => sum + n, 0);
          },
          { chunkSize: 2 }
        )
      ).rejects.toThrow("Chunk with 3 failed");
    });
  });
});

describe("throttling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays between chunks when throttleSeconds > 0 (processInChunks)", async () => {
    const items = [1, 2, 3, 4];
    const chunkStartTimes: number[] = [];

    const promise = processInChunks(
      items,
      async (item) => {
        chunkStartTimes.push(Date.now());
        return item;
      },
      { chunkSize: 2, throttleSeconds: 1 }
    );

    /** Process first chunk */
    await vi.advanceTimersByTimeAsync(0);
    /** Advance past throttle delay */
    await vi.advanceTimersByTimeAsync(1000);
    /** Process second chunk */
    await vi.advanceTimersByTimeAsync(1000);

    await promise;

    expect(chunkStartTimes).toHaveLength(4);
  });

  it("delays between chunks when throttleSeconds > 0 (processInChunksByChunk)", async () => {
    const items = [1, 2, 3, 4, 5, 6];
    const chunkProcessed: number[] = [];

    const promise = processInChunksByChunk(
      items,
      async (chunk) => {
        chunkProcessed.push(got(chunk, 0));
        return chunk.length;
      },
      { chunkSize: 2, throttleSeconds: 1 }
    );

    /** Advance timers to allow all chunks to process */
    await vi.advanceTimersByTimeAsync(3000);

    await promise;

    /** All chunks should have been processed */
    expect(chunkProcessed).toEqual([1, 3, 5]);
  });

  it("does not delay when throttleSeconds is 0", async () => {
    const items = [1, 2, 3, 4];
    let completed = false;

    const promise = processInChunks(items, async (item) => item, {
      chunkSize: 2,
      throttleSeconds: 0,
    }).then(() => {
      completed = true;
    });

    /** Should complete without needing to advance timers */
    await vi.advanceTimersByTimeAsync(0);
    await promise;

    expect(completed).toBe(true);
  });
});
