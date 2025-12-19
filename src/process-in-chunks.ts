import { chunk, getErrorMessage, logIfVerbose, waitSeconds } from "./utils";

export type ChunkingOptions = {
  chunkSize?: number;
  throttleSeconds?: number;
  noThrow?: boolean;
};

export type ProcessResult<R> =
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

const optionsDefaults: Required<ChunkingOptions> = {
  chunkSize: 500,
  throttleSeconds: 0,
  noThrow: false,
};

/**
 * Iterate over a potentially large set of items and process them in chunks with
 * some optional CLI feedback on progress. If the process function returns a
 * value those values are aggregated in the final result.
 */
export async function processInChunks<T, R>(
  allItems: T[],
  processFn: (value: T, index: number) => R | Promise<R>,
  options: ChunkingOptions & { noThrow: true },
): Promise<ProcessResult<R>>;
export async function processInChunks<T, R>(
  allItems: T[],
  processFn: (value: T, index: number) => R | Promise<R>,
  options?: ChunkingOptions,
): Promise<R[]>;
export async function processInChunks<T, R>(
  allItems: T[],
  processFn: (value: T, index: number) => R | Promise<R>,
  options: ChunkingOptions = {},
): Promise<ProcessResult<R> | R[]> {
  const { chunkSize, throttleSeconds, noThrow } = Object.assign(
    {},
    optionsDefaults,
    options,
  );

  const chunks = chunk(allItems, chunkSize);
  let overallIndex = 0;

  const errorMessagesSet = new Set<string>();
  const results: (R | undefined)[] = [];

  for (const [index, items] of chunks.entries()) {
    logIfVerbose(`Processing chunk ${index + 1}/${chunks.length}`);

    // Process each item individually with error handling
    const itemPromises = items.map(async (v, idx) => {
      try {
        const result = await processFn(v, overallIndex + idx);
        return { success: true, result };
      } catch (err) {
        if (!noThrow) {
          throw err; // Rethrow original error immediately
        }
        errorMessagesSet.add(getErrorMessage(err));
        return { success: false, result: undefined };
      }
    });

    /** Run throttle wait in parallel with processing if throttling is enabled */
    const itemResults = await (throttleSeconds > 0
      ? Promise.all([
          Promise.all(itemPromises),
          waitSeconds(throttleSeconds),
        ]).then(([results]) => results)
      : Promise.all(itemPromises));

    for (const itemResult of itemResults) {
      results.push(itemResult.result);
    }

    overallIndex += items.length;
  }

  const errorMessages = Array.from(errorMessagesSet);

  if (!noThrow) {
    // If noThrow is false (default) and we reach here, there were no errors
    return results as R[];
  }

  if (errorMessages.length === 0) {
    return {
      hasErrors: false,
      results: results as R[],
    };
  } else {
    return {
      hasErrors: true,
      results,
      errorMessages,
    };
  }
}

/**
 * Same as processInChunks, but passing the whole chunk to the callback
 * function.
 */
export async function processInChunksByChunk<T, R>(
  allItems: T[],
  processFn: (chunk: T[], index: number) => R | Promise<R>,
  options: ChunkingOptions & { noThrow: true },
): Promise<ProcessResult<R>>;
export async function processInChunksByChunk<T, R>(
  allItems: T[],
  processFn: (chunk: T[], index: number) => R | Promise<R>,
  options?: ChunkingOptions,
): Promise<R[]>;
export async function processInChunksByChunk<T, R>(
  allItems: T[],
  processFn: (chunk: T[], index: number) => R | Promise<R>,
  options: ChunkingOptions = {},
): Promise<ProcessResult<R> | R[]> {
  const { chunkSize, throttleSeconds, noThrow } = Object.assign(
    {},
    optionsDefaults,
    options,
  );

  const chunks = chunk(allItems, chunkSize);
  const errorMessagesSet = new Set<string>();
  const results: (R | undefined)[] = [];

  for (const [index, items] of chunks.entries()) {
    logIfVerbose(`Processing chunk ${index + 1}/${chunks.length}`);

    try {
      const processPromise = processFn(items, index);

      /** Run throttle wait in parallel with processing if throttling is enabled */
      const result = await (throttleSeconds > 0
        ? Promise.all([processPromise, waitSeconds(throttleSeconds)]).then(
            ([res]) => res,
          )
        : processPromise);

      results.push(result);
    } catch (err) {
      if (!noThrow) {
        throw err; // Rethrow original error immediately
      }
      errorMessagesSet.add(getErrorMessage(err));
      results.push(undefined);
    }
  }

  const errorMessages = Array.from(errorMessagesSet);

  if (!noThrow) {
    // If noThrow is false (default) and we reach here, there were no errors
    return results as R[];
  }

  if (errorMessages.length === 0) {
    return {
      hasErrors: false,
      results: results as R[],
    };
  } else {
    return {
      hasErrors: true,
      results,
      errorMessages,
    };
  }
}
