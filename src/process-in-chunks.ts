import {
  chunk,
  getErrorMessage,
  isEmpty,
  logIfVerbose,
  take,
  waitSeconds,
} from "./utils";

export type ChunkingOptions = {
  chunkSize?: number;
  throttleSecs?: number;
};

const optionsDefaults: Required<ChunkingOptions> = {
  chunkSize: 500,
  throttleSecs: 0,
};

/**
 * Iterate over a potentially large set of items and process them in chunks with
 * some optional CLI feedback on progress. If the process function returns a
 * value those values are aggregated in the final result.
 */
export async function processInChunks<T, R>(
  allItems: T[],
  processFn: (value: T, index: number) => R | Promise<R>,
  options: ChunkingOptions = {}
): Promise<R[]> {
  const { chunkSize, throttleSecs } = Object.assign(
    {},
    optionsDefaults,
    options
  );

  const chunks = chunk(allItems, chunkSize);
  let overallIndex = 0;

  const errorMessages: string[] = [];
  const allResults: R[] = [];

  for (const [index, items] of chunks.entries()) {
    logIfVerbose(`Processing chunk ${index + 1}/${chunks.length}`);

    try {
      const processPromise = Promise.all(
        items.map((v, idx) => processFn(v, overallIndex + idx))
      );

      /** Run throttle wait in parallel with processing if throttling is enabled */
      if (throttleSecs > 0) {
        const [results] = await Promise.all([
          processPromise,
          waitSeconds(throttleSecs),
        ]);
        allResults.push(...results);
      } else {
        const results = await processPromise;
        allResults.push(...results);
      }

      overallIndex += items.length;
    } catch (err) {
      errorMessages.push(getErrorMessage(err));
    }
  }

  if (!isEmpty(errorMessages)) {
    throw new Error(
      `Failed to process all chunks successfully. Error messages (limited to 10): ${JSON.stringify(
        take(errorMessages, 10)
      )}}`
    );
  }

  return allResults;
}

/**
 * Same as processInChunks, but passing the whole chunk to the callback
 * function.
 */
export async function processInChunksByChunk<T, R>(
  allItems: T[],
  processFn: (chunk: T[], index: number) => R | Promise<R>,
  options: ChunkingOptions = {}
): Promise<R[]> {
  const { chunkSize, throttleSecs } = Object.assign(
    {},
    optionsDefaults,
    options
  );

  const chunks = chunk(allItems, chunkSize);
  const errorMessages: string[] = [];
  const allResults: R[] = [];

  let overallIndex = 0;

  for (const [index, items] of chunks.entries()) {
    logIfVerbose(`Processing chunk ${index + 1}/${chunks.length}`);

    try {
      const processPromise = processFn(items, overallIndex);

      /** Run throttle wait in parallel with processing if throttling is enabled */
      if (throttleSecs > 0) {
        const [result] = await Promise.all([
          processPromise,
          waitSeconds(throttleSecs),
        ]);
        allResults.push(result);
      } else {
        const result = await processPromise;
        allResults.push(result);
      }

      overallIndex += chunkSize;
    } catch (err) {
      errorMessages.push(getErrorMessage(err));
    }
  }

  if (!isEmpty(errorMessages)) {
    throw new Error(
      `Failed to process all chunks successfully. Error messages (limited to 10): ${JSON.stringify(
        take(errorMessages, 10)
      )}}`
    );
  }

  return allResults;
}
