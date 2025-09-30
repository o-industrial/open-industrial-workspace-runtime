import { IoCContainer } from '@fathym/ioc';
import { AgreementManager } from '../../../src/agreements/AgreementManager.ts';
import { assert, assertEquals } from '../../tests.deps.ts';

Deno.test('AgreementManager Tests', async (t) => {
  const ioc = new IoCContainer();

  // Mock a fake KV system for tests (in-memory)
  await ioc.Register(Deno.Kv, async () => await Deno.openKv(':memory:'), { Name: 'oi' });

  const manager = new AgreementManager(ioc);

  await t.step('LoadAgreements - Returns Definitions', async () => {
    const agreements = await manager.LoadAgreements();
    assert(agreements.length >= 2); // we expect at least TOS + Privacy
    assert(agreements.every((a) => a.key && a.version));
  });

  await t.step('SaveUserAccepted - Merges and Saves', async () => {
    const username = 'testuser@example.com';

    await manager.SaveUserAccepted(username, ['terms-of-service']);

    const accepted = await manager.LoadUserAccepted(username);

    assertEquals(Object.keys(accepted).length, 1);
    assert(accepted['terms-of-service']);
  });

  await t.step('SaveUserAccepted - Retry on Conflict', async () => {
    const username = 'retryuser@example.com';

    // First save
    await manager.SaveUserAccepted(username, ['privacy-policy']);

    // Simulate another overwrite manually (force version bump)
    const kv = await ioc.Resolve(Deno.Kv, 'oi');
    await kv.set(['User', username, 'Agreements'], { 'privacy-policy': '9999-01-01T00:00:00Z' });

    // Try to save again — should auto-retry once
    await manager.SaveUserAccepted(username, ['terms-of-service']);

    const accepted = await manager.LoadUserAccepted(username);

    assert(accepted['terms-of-service']);
    assert(accepted['privacy-policy']);
  });

  await t.step('AgreementsOutOfDate - Detects Outdated', async () => {
    const username = 'outdateduser@example.com';

    await manager.SaveUserAccepted(username, ['terms-of-service']);

    const agreements = await manager.LoadAgreements();
    const userAccepted = await manager.LoadUserAccepted(username);

    const outOfDate = manager.AgreementsOutOfDate(agreements, userAccepted);

    // Should be true if only accepted one of the two
    assert(outOfDate);
  });

  const kv = await ioc.Resolve(Deno.Kv, 'oi');

  kv.close();
});
