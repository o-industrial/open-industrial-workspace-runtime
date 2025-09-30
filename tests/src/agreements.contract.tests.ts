// deno-lint-ignore-file no-explicit-any
import { assertEquals } from '../../tests.deps.ts';
import { z } from 'npm:zod@3.23.8';
import { IoCContainer } from '@fathym/ioc';
import { handler } from '../../../apps/workspace/agreements.tsx';

const SuccessSchema = z.object({ success: z.literal(true) });
const ErrorSchema = z.object({ success: z.literal(false), error: z.string() });

Deno.test('POST /workspace/agreements contract: success with agreedKeys', async () => {
  const ioc = new IoCContainer();
  await ioc.Register(Deno.Kv, async () => await Deno.openKv(':memory:'), { Name: 'oi' });

  const req = new Request('http://localhost/workspace/agreements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agreedKeys: ['terms-of-service', 'privacy-policy'] }),
  });

  const ctx: any = { Runtime: { IoC: ioc }, State: { Username: 'contract@example.com' } };

  const res = await (handler as any).POST(req, ctx);
  assertEquals(res.headers.get('content-type')?.startsWith('application/json'), true);
  const body = await res.json();
  SuccessSchema.parse(body);

  const kv = await ioc.Resolve(Deno.Kv, 'oi');
  kv.close();
});

Deno.test('POST /workspace/agreements contract: error on missing/invalid keys', async () => {
  const ioc = new IoCContainer();
  await ioc.Register(Deno.Kv, async () => await Deno.openKv(':memory:'), { Name: 'oi' });

  const req = new Request('http://localhost/workspace/agreements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const ctx: any = { Runtime: { IoC: ioc }, State: { Username: 'contract@example.com' } };

  const res = await (handler as any).POST(req, ctx);
  const body = await res.json();
  ErrorSchema.parse(body);

  const kv = await ioc.Resolve(Deno.Kv, 'oi');
  kv.close();
});
