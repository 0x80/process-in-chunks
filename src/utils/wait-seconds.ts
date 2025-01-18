export async function waitSeconds(numSeconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, numSeconds * 1000);
  });
}
