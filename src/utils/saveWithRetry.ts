/**
 * Helper function to retry a save action once in case of concurrency failure.
 * @param doSave The save function to attempt.
 * @param retries Number of retries allowed (defaults to 1).
 */
export async function saveWithRetry<T>(
  doSave: () => Promise<T>,
  retries = 1,
): Promise<T> {
  try {
    return await doSave();
  } catch (err) {
    if (
      retries > 0 &&
      err instanceof Error &&
      err.message.includes('Concurrent update detected')
    ) {
      console.warn(
        'AgreementManager: Concurrency conflict detected. Retrying once.',
      );
      return await saveWithRetry(doSave, retries - 1);
    }
    throw err;
  }
}
