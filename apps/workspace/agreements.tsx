import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { PageProps } from '@fathym/eac-applications/preact';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { AgreementManager } from '../../src/agreements/AgreementManager.ts';
import { AgreementData, AgreementList } from '@o-industrial/atomic/organisms';

export const IsIsland = true;

type AgreementsPageData = {
  agreements: AgreementData[];
  returnUrl?: string;
};

export const handler: EaCRuntimeHandlerSet<
  OpenIndustrialWebState,
  AgreementsPageData
> = {
  GET: async (req, ctx) => {
    const manager = new AgreementManager(ctx.Runtime.IoC);

    const agreements = await manager.LoadAgreements();
    const userAccepted = await manager.LoadUserAccepted(ctx.State.Username!);

    const agreementsToAccept = agreements.filter((agreement) => {
      const acceptedVersion = userAccepted[agreement.key];
      return !acceptedVersion || acceptedVersion !== agreement.version;
    });

    const url = new URL(req.url);
    const returnUrl = url.searchParams.get('returnUrl') || '/';

    return ctx.Render({ agreements: agreementsToAccept, returnUrl });
  },

  POST: async (req, ctx) => {
    const manager = new AgreementManager(ctx.Runtime.IoC);

    const body = await req.json();
    const agreedKeys: string[] = body.agreedKeys;

    if (!Array.isArray(agreedKeys) || agreedKeys.length === 0) {
      return Response.json({
        success: false,
        error: 'Invalid or missing agreement keys.',
      });
    }

    await manager.SaveUserAccepted(ctx.State.Username!, agreedKeys);

    return Response.json({ success: true });
  },
};

export default function AgreementsPage({
  Data,
}: PageProps<AgreementsPageData>) {
  async function handleAllAccepted() {
    try {
      const res = await fetch('/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreedKeys: Data.agreements.map((a) => a.key),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Unknown error accepting agreements.');
      }

      location.href = Data.returnUrl || '/';
    } catch (error) {
      alert((error as Error).message);
    }
  }

  return (
    <>
      {/* Header */}
      <div class='px-6 pt-10 pb-4'>
        <div class='max-w-4xl mx-auto text-center'>
          <h1 class='text-3xl font-semibold tracking-tight mb-2'>
            Review and Accept Agreements
          </h1>
          <p class='text-sm text-neutral-600 dark:text-neutral-300'>
            Please review and accept the agreements below to continue.
          </p>
        </div>
      </div>

      {/* Content Card */}
      <div class='px-6 pb-10'>
        <div class='max-w-4xl mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 shadow-md backdrop-blur-sm'>
          <div class='p-6 sm:p-8'>
            <AgreementList
              agreements={Data.agreements}
              onAllAccepted={handleAllAccepted}
            />
          </div>
        </div>
      </div>
    </>
  );
}
