// deno-lint-ignore-file require-await
import { assertEquals, assertRejects } from '../../tests.deps.ts';
import { saveWithRetry } from '../../../src/utils/saveWithRetry.ts';

Deno.test('saveWithRetry - succeeds first try', async () => {
  let calls = 0;
  const result = await saveWithRetry(async () => {
    calls++;
    return 'ok';
  });
  assertEquals(calls, 1);
  assertEquals(result, 'ok');
});

Deno.test('saveWithRetry - retries once on concurrency conflict', async () => {
  let calls = 0;
  const result = await saveWithRetry(async () => {
    calls++;
    if (calls === 1) throw new Error('Concurrent update detected, please retry.');
    return 'ok';
  });
  assertEquals(calls, 2);
  assertEquals(result, 'ok');
});

Deno.test('saveWithRetry - rethrows non-concurrency errors', async () => {
  await assertRejects(
    () =>
      saveWithRetry(async () => {
        throw new Error('Boom');
      }),
    Error,
    'Boom',
  );
});
