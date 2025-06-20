import { chunk, getErrorMessage, logIfVerbose, waitSeconds } from "./utils";

export type ChunkingOptions = {
  chunkSize?: number;
  throttleSeconds?: number;
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
): Promise<ProcessResult<R>> {
  const { chunkSize, throttleSeconds } = Object.assign(
    {},
    optionsDefaults,
    options
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
        errorMessagesSet.add(getErrorMessage(err));
        return { success: false, result: undefined };
      }
    });

    /** Run throttle wait in parallel with processing if throttling is enabled */
    if (throttleSeconds > 0) {
      const [itemResults] = await Promise.all([
        Promise.all(itemPromises),
        waitSeconds(throttleSeconds),
      ]);

      for (const itemResult of itemResults) {
        results.push(itemResult.result);
      }
    } else {
      const itemResults = await Promise.all(itemPromises);

      for (const itemResult of itemResults) {
        results.push(itemResult.result);
      }
    }

    overallIndex += items.length;
  }

  const errorMessages = Array.from(errorMessagesSet);

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
  options: ChunkingOptions = {}
): Promise<ProcessResult<R>> {
  const { chunkSize, throttleSeconds } = Object.assign(
    {},
    optionsDefaults,
    options
  );

  const chunks = chunk(allItems, chunkSize);
  const errorMessagesSet = new Set<string>();
  const results: (R | undefined)[] = [];

  let overallIndex = 0;

  for (const [index, items] of chunks.entries()) {
    logIfVerbose(`Processing chunk ${index + 1}/${chunks.length}`);

    try {
      const processPromise = processFn(items, overallIndex);

      /** Run throttle wait in parallel with processing if throttling is enabled */
      if (throttleSeconds > 0) {
        const [result] = await Promise.all([
          processPromise,
          waitSeconds(throttleSeconds),
        ]);
        results.push(result);
      } else {
        const result = await processPromise;
        results.push(result);
      }

      overallIndex += chunkSize;
    } catch (err) {
      errorMessagesSet.add(getErrorMessage(err));
      results.push(undefined);
      overallIndex += chunkSize;
    }
  }

  const errorMessages = Array.from(errorMessagesSet);

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
