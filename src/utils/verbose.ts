export function logIfVerbose(...args: unknown[]) {
  if (process.env.VERBOSE) {
    console.log(...args);
  }
}

export function countIfVerbose(label: string) {
  if (process.env.VERBOSE) {
    console.count(label);
  }
}
