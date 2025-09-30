// deno-lint-ignore-file no-explicit-any
import { assert, assertEquals } from '../../tests.deps.ts';
import { agreementsBlockerMiddleware } from '../../../src/agreements/agreementsBlockerMiddleware.ts';
import { IoCContainer } from '@fathym/ioc';
import { AgreementManager } from '../../../src/agreements/AgreementManager.ts';

Deno.test('agreementsBlockerMiddleware - redirects to agreements when out of date', async () => {
  const ioc = new IoCContainer();
  await ioc.Register(Deno.Kv, async () => await Deno.openKv(':memory:'), { Name: 'oi' });

  const req = new Request('http://localhost/workspace');
  const ctx: any = {
    Runtime: { IoC: ioc },
    State: { Username: 'test@example.com' },
    Next: () => new Response('next'),
  };

  try {
    // Ensure there are defined agreements from the file system
    const mgr = new AgreementManager(ioc);
    const agreements = await mgr.LoadAgreements();
    assert(agreements.length >= 1);

    const res = await agreementsBlockerMiddleware(req, ctx);
    // Expect redirect to agreements with returnUrl
    assertEquals(res.status, 302);
    const loc = res.headers.get('location')!;
    assert(loc.startsWith('/workspace/agreements?returnUrl='));
  } finally {
    const kv = await ioc.Resolve(Deno.Kv, 'oi');
    kv.close();
  }
});
